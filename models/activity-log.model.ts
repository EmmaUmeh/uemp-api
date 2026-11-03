import mongoose, { Types } from 'mongoose';
import { ActivityAction, ActivityResource } from './enums';

export interface IActivityLog {
  user: Types.ObjectId;
  action: ActivityAction;
  resourceType: ActivityResource;
  resourceId?: Types.ObjectId;
  details?: Record<string, unknown>;
}

const activityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ActivityAction),
      required: true,
    },
    resourceType: {
      type: String,
      enum: Object.values(ActivityResource),
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLogModel = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
