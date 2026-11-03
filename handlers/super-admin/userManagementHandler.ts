import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import UserModel from '../../models/user.model';
import { ActivityLogModel } from '../../models/activity-log.model';
import { ActivityAction, ActivityResource, UserRole } from '../../models/enums';
import { hashPassword } from '../../services/password.service';

export async function listUsersHandler(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const users = await UserModel.find().sort({ lastName: 1, firstName: 1 });
  res.json({ users });
}

export async function createUserHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const {
    firstName,
    lastName,
    emailAddress,
    password,
    role,
    department,
    faculty,
    program,
    level,
    matricNumber,
    staffNumber,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    password?: string;
    role?: UserRole;
    department?: string;
    faculty?: string;
    program?: string;
    level?: number;
    matricNumber?: string;
    staffNumber?: string;
  };
  if (!firstName || !lastName || !emailAddress || !password || !role) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'First name, last name, emailAddress, password, and role are required.' });
    return;
  }
  if (!Object.values(UserRole).includes(role)) {
    res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Invalid user role.' });
    return;
  }
  if (role !== UserRole.SUPER_ADMIN && !department) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'A department is required for this account.' });
    return;
  }
  const user = await UserModel.create({
    firstName,
    lastName,
    emailAddress,
    password: await hashPassword(password),
    role,
    department,
    faculty,
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

export async function updateUserHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await UserModel.findById(req.params.id);
  if (!user) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'User not found.' });
    return;
  }
  const fields = [
    'firstName',
    'lastName',
    'phone',
    'faculty',
    'department',
    'program',
    'level',
    'matricNumber',
    'staffNumber',
    'isActive',
    'role',
  ] as const;
  const body = req.body as Record<string, unknown>;
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      if (field === 'role' && !Object.values(UserRole).includes(body.role as UserRole)) {
        res.status(HTTPStatus.BAD_REQUEST).json({ message: 'Invalid user role.' });
        return;
      }
      user.set(field, body[field]);
    }
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
