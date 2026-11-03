import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import { HTTPStatus } from '../../utils/http.utils';

export default async function meHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(HTTPStatus.OK).json({ user: req.user });
}
