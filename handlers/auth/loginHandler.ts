import type { Request } from 'express';
import UserModel from '../../models/user.model';
import type { RequestApiHandler } from '../../types/http';
import { HTTPStatus } from '../../utils/http.utils';
import HTTPException from '../../utils/error.utils';
import { comparePassword } from '../../services/password.service';
import { createAuthenticatedSession } from '../../services/session.service';

const loginHandler: RequestApiHandler = async (req: Request, res) => {
  const { emailAddress, password } = req.body;

  const user = await UserModel.findOne({ email: emailAddress.toLowerCase() }).select('+password');

  if (!user) {
    throw new HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid email or password.');
  }

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw new HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new HTTPException(
      HTTPStatus.FORBIDDEN,
      'Your account is inactive. Contact an administrator for assistance.',
    );
  }

  await createAuthenticatedSession(req, user.id);

  res.status(HTTPStatus.OK).json({ message: 'Login successful.', user });
};

export default loginHandler;
