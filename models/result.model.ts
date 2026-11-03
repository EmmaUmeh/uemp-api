import mongoose, { Types } from 'mongoose';
import { ResultGrade, ResultStatus } from './enums';

export { ResultGrade, ResultStatus } from './enums';
export type Grade = ResultGrade;
export interface Result {
  registration: Types.ObjectId;
  continuousAssessment: number;
  examination: number;
  total: number;
  grade?: Grade;
  status: ResultStatus;
  feedback?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  submittedBy?: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
}

const resultSchema = new mongoose.Schema<Result>(
  {
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
    },
    continuousAssessment: {
      type: Number,
      min: 0,
      max: 40,
      default: 0,
    },
    examination: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },
    total: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    grade: {
      type: String,
      enum: Object.values(ResultGrade),
    },
    status: {
      type: String,
      enum: Object.values(ResultStatus),
      default: ResultStatus.DRAFT,
    },
    feedback: {
      type: String,
      trim: true,
    },
    submittedAt: Date,
    reviewedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);
resultSchema.index({ registration: 1 }, { unique: true });
resultSchema.index({ status: 1, createdAt: -1 });
resultSchema.index({ reviewedBy: 1, reviewedAt: -1 });

const ResultModel = mongoose.model<Result>('Result', resultSchema);
export default ResultModel;
