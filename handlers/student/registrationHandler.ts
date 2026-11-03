import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import CourseModel from '../../models/course.model';
import RegistrationModel from '../../models/registration.model';
import { AcademicPeriodModel } from '../../models/academic.model';
import { sameId } from '../../middleware/scope';
import { AcademicSemester, RegistrationStatus } from '../../models/enums';

export async function listStudentRegistrationsHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const registrations = await RegistrationModel.find({ student: req.user.id })
    .populate('course', 'code title units level')
    .populate('academicPeriod', 'session semester');
  res.json({ registrations });
}

export default async function registrationHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { courseId, academicPeriodId } = req.body as {
    courseId?: string;
    academicPeriodId?: string;
  };
  if (!courseId || !academicPeriodId) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'courseId and academicPeriodId are required.' });
    return;
  }
  const [course, period] = await Promise.all([
    CourseModel.findOne({ _id: courseId, isActive: true }),
    AcademicPeriodModel.findOne({ _id: academicPeriodId, isCurrent: true }),
  ]);
  if (!course || !period) {
    res
      .status(HTTPStatus.NOT_FOUND)
      .json({ message: 'Course or current academic period not found.' });
    return;
  }
  if (!period.registrationOpen) {
    res.status(HTTPStatus.CONFLICT).json({ message: 'Course registration is closed.' });
    return;
  }
  if (
    !sameId(course.department, req.user.department) ||
    !sameId(course.program, req.user.program) ||
    course.level !== req.user.level ||
    course.semester !== period.semester ||
    !Object.values(AcademicSemester).includes(period.semester)
  ) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'This course is not available for your program and level.' });
    return;
  }
  const existing = await RegistrationModel.findOne({
    student: req.user.id,
    course: course.id,
    academicPeriod: period.id,
  });
  if (existing?.status === RegistrationStatus.REGISTERED) {
    res
      .status(HTTPStatus.CONFLICT)
      .json({ message: 'You are already registered for this course this semester.' });
    return;
  }
  if (existing) {
    existing.status = RegistrationStatus.REGISTERED;
    existing.updatedBy = req.user.id;
    await existing.save();
    res.status(HTTPStatus.OK).json({ registration: existing });
    return;
  }
  const registration = await RegistrationModel.create({
    student: req.user.id,
    course: course.id,
    academicPeriod: period.id,
    createdBy: req.user.id,
  });
  res.status(HTTPStatus.CREATED).json({ registration });
}
