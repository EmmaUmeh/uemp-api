import mongoose, { Types } from 'mongoose';
import { RegistrationStatus } from './enums';

export interface Registration {
  student: Types.ObjectId;
  course: Types.ObjectId;
  academicPeriod: Types.ObjectId;
  status: RegistrationStatus;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const registrationSchema = new mongoose.Schema<Registration>(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    academicPeriod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicPeriod',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.REGISTERED,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);
registrationSchema.index({ student: 1, course: 1, academicPeriod: 1 }, { unique: true });
registrationSchema.index({ student: 1, academicPeriod: 1, status: 1 });
registrationSchema.index({ course: 1, academicPeriod: 1, status: 1 });

const RegistrationModel = mongoose.model<Registration>('Registration', registrationSchema);
export default RegistrationModel;
