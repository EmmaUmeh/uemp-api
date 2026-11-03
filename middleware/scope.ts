import { HTTPStatus } from '../utils/http.utils';
import type { Types } from 'mongoose';
import type { AuthenticatedRequest } from '../types/http';
import type { Response } from 'express';
import { UserRole } from '../models/enums';

export function sameId(left: unknown, right: unknown): boolean {
  return String(left || '') === String(right || '');
}

export function hasDepartmentAccess(
  req: AuthenticatedRequest,
  res: Response,
  departmentId: Types.ObjectId | string | undefined,
): boolean {
  if (req.user.role === UserRole.SUPER_ADMIN || sameId(req.user.department, departmentId))
    return true;
  res
    .status(HTTPStatus.FORBIDDEN)
    .json({ message: 'You can only access records in your department.' });
  return false;
}
