import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import { ActivityLogModel } from '../../models/activity-log.model';

export default async function activityListHandler(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const activities = await ActivityLogModel.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('user', 'firstName lastName role');
  res.json({ activities });
}
