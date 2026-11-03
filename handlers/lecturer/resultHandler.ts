import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import RegistrationModel from '../../models/registration.model';
import ResultModel from '../../models/result.model';
import type { Course } from '../../models/course.model';
import { ActivityLogModel } from '../../models/activity-log.model';
import { ActivityAction, ActivityResource, ResultGrade, ResultStatus } from '../../models/enums';
import { sameId } from '../../middleware/scope';
import { gradeForScore } from '../../services/grading';

export async function listLecturerResultsHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const results = await ResultModel.find().populate<{
    registration: { course: Course | null; student: unknown };
  }>({
    path: 'registration',
    populate: [
      { path: 'student', select: 'firstName lastName matricNumber' },
      { path: 'course', match: { lecturers: req.user.id }, select: 'code title units lecturers' },
    ],
  });
  res.json({
    results: results.filter((result) => result.registration && result.registration.course),
  });
}

export async function saveResultDraftHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { registrationId } = req.params;
  const { continuousAssessment, examination } = req.body as {
    continuousAssessment?: number;
    examination?: number;
  };
  const registration = await RegistrationModel.findById(registrationId).populate<{
    course: Course;
  }>('course');
  if (!registration) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Registration not found.' });
    return;
  }
  const course = registration.course;
  if (!course.lecturers.some((lecturerId) => sameId(lecturerId, req.user.id))) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'You can only enter results for your assigned courses.' });
    return;
  }
  const existing = await ResultModel.findOne({ registration: registration.id });
  if (existing && ![ResultStatus.DRAFT, ResultStatus.RETURNED].includes(existing.status)) {
    res
      .status(HTTPStatus.CONFLICT)
      .json({ message: 'Submitted results cannot be edited unless returned for correction.' });
    return;
  }
  const ca = Number(continuousAssessment);
  const exam = Number(examination);
  if (
    !Number.isFinite(ca) ||
    !Number.isFinite(exam) ||
    ca < 0 ||
    ca > 40 ||
    exam < 0 ||
    exam > 60
  ) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'CA must be 0-40 and examination must be 0-60.' });
    return;
  }
  const total = ca + exam;
  const previousScores = existing
    ? {
        continuousAssessment: existing.continuousAssessment,
        examination: existing.examination,
        total: existing.total,
        grade: existing.grade,
      }
    : undefined;
  const result = await ResultModel.findOneAndUpdate(
    { registration: registration.id },
    {
      $set: {
        continuousAssessment: ca,
        examination: exam,
        total,
        grade: gradeForScore(total),
        status: ResultStatus.DRAFT,
        feedback: undefined,
        updatedBy: req.user.id,
      },
      $setOnInsert: { createdBy: req.user.id },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await ActivityLogModel.create({
    user: req.user.id,
    action: ActivityAction.RESULT_DRAFT_SAVED,
    resourceType: ActivityResource.RESULT,
    resourceId: result.id,
    details: {
      before: previousScores,
      after: { continuousAssessment: ca, examination: exam, total, grade: gradeForScore(total) },
    },
  });
  res.json({ result });
}

export async function submitResultHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const result = await ResultModel.findById(req.params.id).populate<{
    registration: { course: Course };
  }>({ path: 'registration', populate: { path: 'course' } });
  if (!result) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Result not found.' });
    return;
  }
  const course = result.registration.course;
  if (!course.lecturers.some((lecturerId) => sameId(lecturerId, req.user.id))) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'You can only submit results for your assigned courses.' });
    return;
  }
  if (![ResultStatus.DRAFT, ResultStatus.RETURNED].includes(result.status)) {
    res.status(HTTPStatus.CONFLICT).json({ message: 'This result cannot be submitted.' });
    return;
  }
  const previousStatus = result.status;
  result.status = ResultStatus.SUBMITTED;
  result.submittedBy = req.user.id;
  result.updatedBy = req.user.id;
  result.submittedAt = new Date();
  result.feedback = undefined;
  await result.save();
  await ActivityLogModel.create({
    user: req.user.id,
    action: ActivityAction.RESULT_SUBMITTED,
    resourceType: ActivityResource.RESULT,
    resourceId: result.id,
    details: { from: previousStatus, to: result.status, submittedAt: result.submittedAt },
  });
  res.json({ result });
}
