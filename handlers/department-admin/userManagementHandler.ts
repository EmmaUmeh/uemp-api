import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import UserModel from '../../models/user.model';
import { ActivityLogModel } from '../../models/activity-log.model';
import { ActivityAction, ActivityResource, UserRole } from '../../models/enums';
import { sameId } from '../../middleware/scope';
import { DepartmentModel, ProgramModel } from '../../models/academic.model';
import { hashPassword } from '../../services/password.service';

const departmentRoles: UserRole[] = [UserRole.STUDENT, UserRole.LECTURER];

export async function listDepartmentUsersHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const users = await UserModel.find({ department: req.user.department }).sort({
    lastName: 1,
    firstName: 1,
  });
  res.json({ users });
}

export async function createDepartmentUserHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    faculty,
    program,
    level,
    matricNumber,
    staffNumber,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    faculty?: string;
    program?: string;
    level?: number;
    matricNumber?: string;
    staffNumber?: string;
  };
  if (!firstName || !lastName || !email || !password || !role) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'First name, last name, email, password, and role are required.' });
    return;
  }
  if (!departmentRoles.includes(role)) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admins can create student and lecturer accounts only.' });
    return;
  }
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const department = await DepartmentModel.findById(req.user.department);
  if (!department) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: "The department admin's department does not exist." });
    return;
  }
  if (program && !(await ProgramModel.exists({ _id: program, department: req.user.department }))) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'The selected program does not belong to your department.' });
    return;
  }
  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    password: await hashPassword(password),
    role,
    department: req.user.department,
    faculty: department.faculty,
    program,
    level,
    matricNumber,
    staffNumber,
    createdBy: req.user.id,
  });
  await ActivityLogModel.create({
    user: req.user.id,
    action: ActivityAction.USER_CREATED,
    resourceType: ActivityResource.USER,
    resourceId: user.id,
    details: { role },
  });
  res.status(HTTPStatus.CREATED).json({ user });
}

export async function updateDepartmentUserHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const user = await UserModel.findOne({ _id: req.params.id, department: req.user.department });
  if (!user) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Department user not found.' });
    return;
  }
  const fields = [
    'firstName',
    'lastName',
    'phone',
    'program',
    'level',
    'matricNumber',
    'staffNumber',
  ] as const;
  const body = req.body as Record<string, unknown>;
  if (
    typeof body.program === 'string' &&
    !(await ProgramModel.exists({ _id: body.program, department: req.user.department }))
  ) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'The selected program does not belong to your department.' });
    return;
  }
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      user.set(field, body[field]);
    }
  }
  if (body.department && !sameId(body.department, req.user.department)) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'You cannot move a user to another department.' });
    return;
  }
  user.updatedBy = req.user.id;
  await user.save();
  await ActivityLogModel.create({
    user: req.user.id,
    action: ActivityAction.USER_UPDATED,
    resourceType: ActivityResource.USER,
    resourceId: user.id,
  });
  res.json({ user });
}
