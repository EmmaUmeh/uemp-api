import mongoose, { Types } from 'mongoose';
import { ACADEMIC_LEVELS, AcademicLevel, AcademicSemester } from './enums';

export interface Course {
  code: string;
  title: string;
  units: number;
  department: Types.ObjectId;
  program: Types.ObjectId;
  level: AcademicLevel;
  semester: AcademicSemester;
  lecturers: Types.ObjectId[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const courseSchema = new mongoose.Schema<Course>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    units: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    level: {
      type: Number,
      enum: ACADEMIC_LEVELS,
      required: true,
    },
    semester: {
      type: String,
      enum: Object.values(AcademicSemester),
      required: true,
    },
    lecturers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: { type: Boolean, default: true },
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
courseSchema.index({ department: 1, code: 1 }, { unique: true });
courseSchema.index({ department: 1, program: 1, level: 1, semester: 1, isActive: 1 });
courseSchema.index({ lecturers: 1, isActive: 1 });

const CourseModel = mongoose.model<Course>('Course', courseSchema);
export default CourseModel;
