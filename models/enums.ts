export enum UserRole {
  STUDENT = 'student',
  LECTURER = 'lecturer',
  DEPARTMENT_ADMIN = 'department_admin',
  SUPER_ADMIN = 'super_admin',
}

export enum AcademicSemester {
  FIRST = 'first',
  SECOND = 'second',
}

export enum AcademicResource {
  FACULTIES = 'faculties',
  DEPARTMENTS = 'departments',
  PROGRAMS = 'programs',
  PERIODS = 'periods',
}

export enum AcademicLevel {
  LEVEL_100 = 100,
  LEVEL_200 = 200,
  LEVEL_300 = 300,
  LEVEL_400 = 400,
  LEVEL_500 = 500,
  LEVEL_600 = 600,
  LEVEL_700 = 700,
  LEVEL_800 = 800,
  LEVEL_900 = 900,
}

export const ACADEMIC_LEVELS = Object.values(AcademicLevel).filter(
  (value): value is AcademicLevel => typeof value === 'number',
);

export enum RegistrationStatus {
  REGISTERED = 'registered',
  DROPPED = 'dropped',
}

export enum ResultStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  RETURNED = 'returned',
  APPROVED = 'approved',
}

export enum ResultReviewDecision {
  APPROVED = 'approved',
  RETURNED = 'returned',
}

export enum ResultGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
}

export enum ActivityAction {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  COURSE_CREATED = 'course.created',
  COURSE_UPDATED = 'course.updated',
  ACADEMIC_RECORD_CREATED = 'academic_record.created',
  ACADEMIC_RECORD_UPDATED = 'academic_record.updated',
  RESULT_DRAFT_SAVED = 'result.draft_saved',
  RESULT_SUBMITTED = 'result.submitted',
  RESULT_APPROVED = 'result.approved',
  RESULT_RETURNED = 'result.returned',
}

export enum ActivityResource {
  USER = 'User',
  COURSE = 'Course',
  RESULT = 'Result',
  FACULTY = 'Faculty',
  DEPARTMENT = 'Department',
  PROGRAM = 'Program',
  ACADEMIC_PERIOD = 'AcademicPeriod',
}
