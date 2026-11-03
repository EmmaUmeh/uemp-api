import 'dotenv/config';
import mongoose from 'mongoose';
import { DepartmentModel, ProgramModel } from '../models/academic.model';
import { AcademicLevel, UserRole } from '../models/enums';
import UserModel from '../models/user.model';
import { hashPassword } from '../services/password.service';
import logger from '../utils/logger.utils';
import dotenv from 'dotenv';

dotenv.config();

const STUDENT_EMAIL = 'test.student@example.com';
const LECTURER_EMAIL = 'test.lecturer@example.com';
const DEPARTMENT_ADMIN_EMAIL = 'test.department-admin@example.com';
const SUPER_ADMIN_EMAIL = 'test.super-admin@example.com';

async function createTestAccounts(): Promise<void> {
  //   if (process.env.NODE_ENV === 'production') {
  //     throw new Error('Test accounts cannot be created when NODE_ENV is production.');
  //   }

  const mongoUri = process.env.MONGODB_URI;
  const password = process.env.TEST_ACCOUNTS_PASSWORD;

  if (!mongoUri || !password) {
    throw new Error('Set MONGODB_URI and TEST_ACCOUNTS_PASSWORD in your .env file.');
  }

  if (password.length < 12) {
    throw new Error('TEST_ACCOUNTS_PASSWORD must be at least 12 characters long.');
  }

  const departmentId = process.env.TEST_DEPARTMENT_ID?.trim();
  const programId = process.env.TEST_PROGRAM_ID?.trim();

  if (Boolean(departmentId) !== Boolean(programId)) {
    throw new Error('Set both TEST_DEPARTMENT_ID and TEST_PROGRAM_ID, or leave both empty.');
  }

  if (
    (departmentId && !mongoose.isValidObjectId(departmentId)) ||
    (programId && !mongoose.isValidObjectId(programId))
  ) {
    throw new Error('TEST_DEPARTMENT_ID and TEST_PROGRAM_ID must be valid MongoDB IDs.');
  }

  await mongoose.connect(mongoUri);

  const [existingStudent, existingLecturer, existingDepartmentAdmin, existingSuperAdmin] =
    await Promise.all([
      UserModel.findOne({ emailAddress: STUDENT_EMAIL }),
      UserModel.findOne({ emailAddress: LECTURER_EMAIL }),
      UserModel.findOne({ emailAddress: DEPARTMENT_ADMIN_EMAIL }),
      UserModel.findOne({ emailAddress: SUPER_ADMIN_EMAIL }),
    ]);

  if (existingStudent && existingStudent.role !== UserRole.STUDENT) {
    throw new Error(`${STUDENT_EMAIL} already belongs to a non-student account.`);
  }

  if (existingLecturer && existingLecturer.role !== UserRole.LECTURER) {
    throw new Error(`${LECTURER_EMAIL} already belongs to a non-lecturer account.`);
  }

  if (existingDepartmentAdmin && existingDepartmentAdmin.role !== UserRole.DEPARTMENT_ADMIN) {
    throw new Error(`${DEPARTMENT_ADMIN_EMAIL} already belongs to a different role.`);
  }

  if (existingSuperAdmin && existingSuperAdmin.role !== UserRole.SUPER_ADMIN) {
    throw new Error(`${SUPER_ADMIN_EMAIL} already belongs to a different role.`);
  }

  let department;
  let program;

  if (departmentId && programId) {
    [department, program] = await Promise.all([
      DepartmentModel.findById(departmentId),
      ProgramModel.findById(programId),
    ]);

    if (!department || !program) {
      throw new Error('The configured test department or program was not found.');
    }

    if (!program.department.equals(department._id)) {
      throw new Error('TEST_PROGRAM_ID must belong to TEST_DEPARTMENT_ID.');
    }
  }

  const hashedPassword = await hashPassword(password);
  const departmentFields = department
    ? { department: department._id, faculty: department.faculty }
    : {};
  const departmentUnset = department ? {} : { department: '', faculty: '' };
  const programUnset = program ? {} : { program: '' };

  await UserModel.findOneAndUpdate(
    { emailAddress: STUDENT_EMAIL },
    {
      $set: {
        firstName: 'Test',
        lastName: 'Student',
        password: hashedPassword,
        role: UserRole.STUDENT,
        isActive: true,
        level: AcademicLevel.LEVEL_100,
        matricNumber: 'TEST-STUDENT-001',
        ...departmentFields,
        ...(program ? { program: program._id } : {}),
      },
      $unset: {
        ...departmentUnset,
        ...programUnset,
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  await UserModel.findOneAndUpdate(
    { emailAddress: LECTURER_EMAIL },
    {
      $set: {
        firstName: 'Test',
        lastName: 'Lecturer',
        password: hashedPassword,
        role: UserRole.LECTURER,
        isActive: true,
        staffNumber: 'TEST-LECTURER-001',
        ...departmentFields,
      },
      $unset: departmentUnset,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  await UserModel.findOneAndUpdate(
    { emailAddress: DEPARTMENT_ADMIN_EMAIL },
    {
      $set: {
        firstName: 'Test',
        lastName: 'Department Admin',
        password: hashedPassword,
        role: UserRole.DEPARTMENT_ADMIN,
        isActive: true,
        staffNumber: 'TEST-DEPT-ADMIN-001',
        ...departmentFields,
      },
      $unset: {
        ...departmentUnset,
        program: '',
        level: '',
        matricNumber: '',
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  await UserModel.findOneAndUpdate(
    { emailAddress: SUPER_ADMIN_EMAIL },
    {
      $set: {
        firstName: 'Test',
        lastName: 'Super Admin',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
      $unset: {
        department: '',
        faculty: '',
        program: '',
        level: '',
        matricNumber: '',
        staffNumber: '',
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  logger.info('Test accounts for all four roles are ready.', {
    studentEmail: STUDENT_EMAIL,
    lecturerEmail: LECTURER_EMAIL,
    departmentAdminEmail: DEPARTMENT_ADMIN_EMAIL,
    superAdminEmail: SUPER_ADMIN_EMAIL,
    departmentConfigured: Boolean(department),
    programConfigured: Boolean(program),
  });
}

createTestAccounts()
  .catch((error: unknown) => {
    logger.error('Could not create test accounts.', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
