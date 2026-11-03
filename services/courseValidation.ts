import { ProgramModel } from '../models/academic.model';
import UserModel from '../models/user.model';
import type { Types } from 'mongoose';
import { UserRole } from '../models/enums';

type Id = string | Types.ObjectId;

export async function validateCourseAssignment(
  department: Id,
  program: Id,
  lecturers: Id[],
): Promise<string | undefined> {
  const [matchingProgram, matchingLecturers] = await Promise.all([
    ProgramModel.exists({ _id: program, department }),
    lecturers.length
      ? UserModel.countDocuments({
          _id: { $in: lecturers },
          department,
          role: UserRole.LECTURER,
          isActive: true,
        })
      : Promise.resolve(0),
  ]);
  if (!matchingProgram) return 'Course program must belong to its department.';
  if (matchingLecturers !== new Set(lecturers.map(String)).size) {
    return 'Every assigned lecturer must be an active lecturer in the course department.';
  }
  return undefined;
}
