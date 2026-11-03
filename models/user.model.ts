import mongoose, { HydratedDocument, Types } from 'mongoose';
import { ACADEMIC_LEVELS, AcademicLevel, UserRole } from './enums';

export const SENSITIVE_FIELDS = [
  'password',
  '__v',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
] as const;

export interface User {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  role: UserRole;
  faculty?: Types.ObjectId;
  department?: Types.ObjectId;
  program?: Types.ObjectId;
  level?: AcademicLevel;
  matricNumber?: string;
  staffNumber?: string;
  phone?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const userSchema = new mongoose.Schema<User>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    emailAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    level: {
      type: Number,
      enum: ACADEMIC_LEVELS,
    },
    matricNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    staffNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

userSchema.index({ department: 1, role: 1, lastName: 1, firstName: 1 });
userSchema.index({ program: 1, level: 1, role: 1 });

userSchema.set('toJSON', {
  transform(_doc, value) {
    for (const field of SENSITIVE_FIELDS) {
      Reflect.deleteProperty(value, field);
    }

    return value;
  },
});

export type UserDocument = HydratedDocument<User>;
const UserModel = mongoose.model<User>('User', userSchema);
export default UserModel;
