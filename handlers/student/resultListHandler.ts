import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import ResultModel from '../../models/result.model';
import { ResultStatus } from '../../models/enums';
import { calculateGpa } from '../../services/grading';

export default async function resultListHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const results = await ResultModel.find({ status: ResultStatus.APPROVED }).populate<{
    registration: { course: { units: number } | null } | null;
  }>({
    path: 'registration',
    match: { student: req.user.id },
    populate: [
      { path: 'course', select: 'code title units' },
      { path: 'academicPeriod', select: 'session semester' },
    ],
  });
  const studentResults = results.filter((result) => result.registration);
  const gpaCourses = studentResults.flatMap((result) =>
    result.registration?.course
      ? [{ grade: result.grade, units: result.registration.course.units }]
      : [],
  );
  res.json({ results: studentResults, cgpa: calculateGpa(gpaCourses) });
}
