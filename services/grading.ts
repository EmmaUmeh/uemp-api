import { ResultGrade } from '../models/enums';

export const GRADE_POINT_SCALE: Readonly<Record<ResultGrade, number>> = {
  [ResultGrade.A]: 5,
  [ResultGrade.B]: 4,
  [ResultGrade.C]: 3,
  [ResultGrade.D]: 2,
  [ResultGrade.E]: 1,
  [ResultGrade.F]: 0,
};

export function gradeForScore(score: number): ResultGrade {
  if (score >= 70) return ResultGrade.A;
  if (score >= 60) return ResultGrade.B;
  if (score >= 50) return ResultGrade.C;
  if (score >= 45) return ResultGrade.D;
  if (score >= 40) return ResultGrade.E;
  return ResultGrade.F;
}

export function calculateGpa(
  courses: ReadonlyArray<{ grade?: ResultGrade; units: number }>,
): number {
  const completed = courses.filter((course) => course.grade && course.units > 0);
  const totalUnits = completed.reduce((sum, course) => sum + course.units, 0);
  if (totalUnits === 0) return 0;
  const weightedPoints = completed.reduce(
    (sum, course) => sum + course.units * (course.grade ? GRADE_POINT_SCALE[course.grade] : 0),
    0,
  );
  return Number((weightedPoints / totalUnits).toFixed(2));
}
