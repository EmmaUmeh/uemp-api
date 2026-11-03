import { HTTPStatus } from '../utils/http.utils';
import type { RequestHandler } from 'express';
import type { UserRole } from '../models/enums';

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res
        .status(HTTPStatus.FORBIDDEN)
        .json({ message: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
}
