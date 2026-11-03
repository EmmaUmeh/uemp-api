import mongoose, { Types } from 'mongoose';
import { AcademicSemester } from './enums';

export interface Faculty {
  name: string;
  code: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface Department {
  name: string;
  code: string;
  faculty: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface Program {
  name: string;
  code: string;
  department: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface AcademicPeriod {
  session: string;
  semester: AcademicSemester;
  startsAt?: Date;
  endsAt?: Date;
  registrationOpen: boolean;
  isCurrent: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const auditFields = {
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
};

const facultySchema = new mongoose.Schema<Faculty>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    ...auditFields,
  },
  { timestamps: true },
);

const departmentSchema = new mongoose.Schema<Department>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    ...auditFields,
  },
  { timestamps: true },
);
departmentSchema.index({ faculty: 1, code: 1 }, { unique: true });

const programSchema = new mongoose.Schema<Program>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    ...auditFields,
  },
  { timestamps: true },
);
programSchema.index({ department: 1, code: 1 }, { unique: true });

const academicPeriodSchema = new mongoose.Schema<AcademicPeriod>(
  {
    session: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      enum: Object.values(AcademicSemester),
      required: true,
    },
    startsAt: Date,
    endsAt: Date,
    registrationOpen: {
      type: Boolean,
      default: false,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    ...auditFields,
  },
  { timestamps: true },
);
academicPeriodSchema.index({ session: 1, semester: 1 }, { unique: true });
academicPeriodSchema.index({ isCurrent: 1, registrationOpen: 1 });
academicPeriodSchema.index(
  { isCurrent: 1 },
  { unique: true, partialFilterExpression: { isCurrent: true } },
);

export const FacultyModel = mongoose.model<Faculty>('Faculty', facultySchema);
export const DepartmentModel = mongoose.model<Department>('Department', departmentSchema);
export const ProgramModel = mongoose.model<Program>('Program', programSchema);
export const AcademicPeriodModel = mongoose.model<AcademicPeriod>(
  'AcademicPeriod',
  academicPeriodSchema,
);
