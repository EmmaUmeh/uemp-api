import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import { HTTPStatus } from '../../utils/http.utils';

export default async function logoutHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
  res.clearCookie('university.sid');
  res.status(HTTPStatus.OK).json({ message: 'Logged out successfully.' });
}
