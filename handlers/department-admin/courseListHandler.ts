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
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const courses = await CourseModel.find({ department: req.user.department }).populate(
    'program lecturers',
    'name code firstName lastName email',
  );
  res.json({ courses });
}
