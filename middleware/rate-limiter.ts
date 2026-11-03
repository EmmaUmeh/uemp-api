import rateLimit from 'express-rate-limit';
import { HTTPStatus } from '../utils/http.utils';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(HTTPStatus.TOO_MANY_REQUESTS)
      .json({ message: 'Too many login attempts. Try again later.' });
  },
});
