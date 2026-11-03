import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import RegistrationModel from '../../models/registration.model';

export default async function registrationListHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const registrations = await RegistrationModel.find()
    .populate({
      path: 'student',
      match: { department: req.user.department },
      select: 'firstName lastName matricNumber program level department',
    })
    .populate('course', 'code title units')
    .populate('academicPeriod', 'session semester');
  res.json({ registrations: registrations.filter((registration) => registration.student) });
}
