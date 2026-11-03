import { HTTPStatus } from '../utils/http.utils';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserDocument } from '../models/user.model';
import type { UserRole } from '../models/enums';

export type AuthenticatedRequest = Request & { user: UserDocument };
export type ApiHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export type RequestApiHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(handler: ApiHandler | RequestApiHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req as AuthenticatedRequest, res, next)).catch(next);
  };
}

export function roleHandler(handlers: Partial<Record<UserRole, ApiHandler>>): RequestHandler {
  return (req, res, next) => {
    const handler = req.user && handlers[req.user.role];
    if (!handler) {
      res
        .status(HTTPStatus.FORBIDDEN)
        .json({ message: 'You do not have permission to perform this action.' });
      return;
    }
    void handler(req as AuthenticatedRequest, res, next).catch(next);
  };
}
