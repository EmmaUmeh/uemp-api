import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import CourseModel from '../../models/course.model';
import { ActivityLogModel } from '../../models/activity-log.model';
import { ActivityAction, ActivityResource, AcademicSemester } from '../../models/enums';
import { validateCourseAssignment } from '../../services/courseValidation';

export async function listCoursesHandler(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const courses = await CourseModel.find().populate(
    'department program lecturers',
    'name code firstName lastName email',
  );
  res.json({ courses });
}

export async function createCourseHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = req.body as {
    department?: string;
    program?: string;
    lecturers?: string[];
    semester?: AcademicSemester;
  };
  if (
    !body.department ||
    !body.program ||
    !Object.values(AcademicSemester).includes(body.semester as AcademicSemester) ||
    (body.lecturers !== undefined && !Array.isArray(body.lecturers))
  ) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'Department, program, semester, and lecturer IDs are required.' });
    return;
  }
  const assignmentError = await validateCourseAssignment(
    body.department,
    body.program,
    body.lecturers || [],
  );
  if (assignmentError) {
    res.status(HTTPStatus.BAD_REQUEST).json({ message: assignmentError });
    return;
  }
  const course = await CourseModel.create({
    ...req.body,
    createdBy: req.user.id,
    updatedBy: undefined,
  });
  await ActivityLogModel.create({
    user: req.user.id,
    action: ActivityAction.COURSE_CREATED,
    resourceType: ActivityResource.COURSE,
    resourceId: course.id,
  });
  res.status(HTTPStatus.CREATED).json({ course });
}

export async function updateCourseHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const course = await CourseModel.findById(req.params.id);
  if (!course) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Course not found.' });
    return;
  }
  const body = req.body as {
    department?: string;
    program?: string;
    lecturers?: string[];
    semester?: AcademicSemester;
  };
  if (body.lecturers !== undefined && !Array.isArray(body.lecturers)) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'Lecturers must be a list of lecturer IDs.' });
    return;
  }
  const department = body.department || course.department;
  const program = body.program || course.program;
  const semester = body.semester || course.semester;
  if (!Object.values(AcademicSemester).includes(semester)) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'Course semester must be first or second.' });
    return;
  }
  const assignmentError = await validateCourseAssignment(
    department,
    program,
    body.lecturers || course.lecturers,
  );
  if (assignmentError) {
    res.status(HTTPStatus.BAD_REQUEST).json({ message: assignmentError });
    return;
  }
  course.set({ ...req.body, createdBy: course.createdBy, updatedBy: req.user.id });
  await course.save();
  await ActivityLogModel.create({
    user: req.user.id,
    action: ActivityAction.COURSE_UPDATED,
    resourceType: ActivityResource.COURSE,
    resourceId: course.id,
  });
  res.json({ course });
}
