import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import RegistrationModel from '../../models/registration.model';

export default async function registrationListHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const registrations = await RegistrationModel.find()
    .populate({
      path: 'course',
      match: { lecturers: req.user.id, department: req.user.department },
      select: 'code title units lecturers department',
    })
    .populate('student', 'firstName lastName matricNumber program level')
    .populate('academicPeriod', 'session semester');
  res.json({ registrations: registrations.filter((registration) => registration.course) });
}
