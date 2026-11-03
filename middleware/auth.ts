import type { RequestHandler } from 'express';
import UserModel from '../models/user.model';
import { HTTPStatus } from '../utils/http.utils';

export const authenticate: RequestHandler = async (req, res, next) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(HTTPStatus.UNAUTHORIZED).json({ message: 'Authentication required.' });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      req.session.destroy((error) => {
        if (error) {
          next(error);
          return;
        }
        res.clearCookie('university.sid');
        res.status(HTTPStatus.UNAUTHORIZED).json({ message: 'Account is unavailable.' });
      });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
