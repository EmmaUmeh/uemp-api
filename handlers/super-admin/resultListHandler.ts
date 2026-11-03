import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import ResultModel from '../../models/result.model';

export default async function resultListHandler(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const results = await ResultModel.find().populate({
    path: 'registration',
    populate: [
      { path: 'student', select: 'firstName lastName matricNumber department' },
      { path: 'course', select: 'code title units department' },
      { path: 'academicPeriod', select: 'session semester' },
    ],
  });
  res.json({ results });
}
