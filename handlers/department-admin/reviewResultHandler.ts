import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import ResultModel from '../../models/result.model';
import { ActivityLogModel } from '../../models/activity-log.model';
import { sameId } from '../../middleware/scope';
import type { Course } from '../../models/course.model';
import {
  ActivityAction,
  ActivityResource,
  ResultReviewDecision,
  ResultStatus,
} from '../../models/enums';

export default async function reviewResultHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { decision, feedback } = req.body as { decision?: ResultReviewDecision; feedback?: string };
  const result = await ResultModel.findById(req.params.id).populate<{
    registration: { course: Course };
  }>({ path: 'registration', populate: { path: 'course' } });
  if (!result) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Result not found.' });
    return;
  }
  const course = result.registration.course;
  if (!sameId(course.department, req.user.department)) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'You can only review results in your department.' });
    return;
  }
  if (sameId(result.createdBy, req.user.id) || sameId(result.submittedBy, req.user.id)) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'You cannot approve your own submitted results.' });
    return;
  }
  if (result.status !== ResultStatus.SUBMITTED) {
    res.status(HTTPStatus.CONFLICT).json({ message: 'Only submitted results can be reviewed.' });
    return;
  }
  if (decision !== ResultReviewDecision.APPROVED && decision !== ResultReviewDecision.RETURNED) {
    res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Decision must be approved or returned.' });
    return;
  }
  if (decision === ResultReviewDecision.RETURNED && !feedback?.trim()) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'Feedback is required when returning a result.' });
    return;
  }
  const previousStatus = result.status;
  result.status =
    decision === ResultReviewDecision.APPROVED ? ResultStatus.APPROVED : ResultStatus.RETURNED;
  result.feedback = feedback?.trim() || undefined;
  result.reviewedBy = req.user.id;
  result.reviewedAt = new Date();
  result.updatedBy = req.user.id;
  await result.save();
  await ActivityLogModel.create({
    user: req.user.id,
    action:
      result.status === ResultStatus.APPROVED
        ? ActivityAction.RESULT_APPROVED
        : ActivityAction.RESULT_RETURNED,
    resourceType: ActivityResource.RESULT,
    resourceId: result.id,
    details: { from: previousStatus, to: result.status, feedback: result.feedback },
  });
  res.json({ result });
}
