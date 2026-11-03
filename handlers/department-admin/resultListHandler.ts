import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import ResultModel from '../../models/result.model';
import type { Course } from '../../models/course.model';

export default async function resultListHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const results = await ResultModel.find().populate<{
    registration: { course: Course | null; student: unknown; academicPeriod: unknown };
  }>({
    path: 'registration',
    populate: [
      { path: 'student', select: 'firstName lastName matricNumber department' },
      {
        path: 'course',
        match: { department: req.user.department },
        select: 'code title units department',
      },
      { path: 'academicPeriod', select: 'session semester' },
    ],
  });
  res.json({
    results: results.filter((result) => result.registration && result.registration.course),
  });
}
