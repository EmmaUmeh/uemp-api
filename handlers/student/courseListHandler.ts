import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import CourseModel from '../../models/course.model';

export default async function courseListHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.program || !req.user.level) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Your account must have a program and academic level assigned.' });
    return;
  }
  const courses = await CourseModel.find({
    isActive: true,
    program: req.user.program,
    level: req.user.level,
  }).populate('department program', 'name code');
  res.json({ courses });
}
