import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import RegistrationModel from '../../models/registration.model';

export default async function registrationListHandler(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const registrations = await RegistrationModel.find()
    .populate('student', 'firstName lastName matricNumber department program level')
    .populate('course', 'code title units department program level')
    .populate('academicPeriod', 'session semester');
  res.json({ registrations });
}
