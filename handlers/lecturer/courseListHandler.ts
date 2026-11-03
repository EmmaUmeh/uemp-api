import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import CourseModel from '../../models/course.model';

export default async function courseListHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Lecturer account has no assigned department.' });
    return;
  }
  const courses = await CourseModel.find({
    isActive: true,
    department: req.user.department,
    lecturers: req.user.id,
  }).populate('program', 'name code');
  res.json({ courses });
}
