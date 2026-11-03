import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import CourseModel from '../../models/course.model';
import { ActivityLogModel } from '../../models/activity-log.model';
import { ActivityAction, ActivityResource, AcademicSemester } from '../../models/enums';
import { sameId } from '../../middleware/scope';
import { validateCourseAssignment } from '../../services/courseValidation';

export async function createDepartmentCourseHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const body = req.body as { program?: string; lecturers?: string[]; semester?: AcademicSemester };
  if (
    !body.program ||
    !Object.values(AcademicSemester).includes(body.semester as AcademicSemester) ||
    (body.lecturers !== undefined && !Array.isArray(body.lecturers))
  ) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'A program, semester, and list of lecturer IDs are required.' });
    return;
  }
  const assignmentError = await validateCourseAssignment(
    req.user.department,
    body.program,
    body.lecturers || [],
  );
  if (assignmentError) {
    res.status(HTTPStatus.BAD_REQUEST).json({ message: assignmentError });
    return;
  }
  const course = await CourseModel.create({
    ...req.body,
    department: req.user.department,
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

export async function updateDepartmentCourseHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user.department) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admin account has no assigned department.' });
    return;
  }
  const course = await CourseModel.findOne({ _id: req.params.id, department: req.user.department });
  if (!course) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Department course not found.' });
    return;
  }
  if (req.body.department && !sameId(req.body.department, req.user.department)) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'You cannot move a course to another department.' });
    return;
  }
  const body = req.body as { program?: string; lecturers?: string[]; semester?: AcademicSemester };
  if (body.lecturers !== undefined && !Array.isArray(body.lecturers)) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'Lecturers must be a list of lecturer IDs.' });
    return;
  }
  const semester = body.semester || course.semester;
  if (!Object.values(AcademicSemester).includes(semester)) {
    res
      .status(HTTPStatus.BAD_REQUEST)
      .json({ message: 'Course semester must be first or second.' });
    return;
  }
  const assignmentError = await validateCourseAssignment(
    req.user.department,
    body.program || course.program,
    body.lecturers || course.lecturers,
  );
  if (assignmentError) {
    res.status(HTTPStatus.BAD_REQUEST).json({ message: assignmentError });
    return;
  }
  course.set({
    ...req.body,
    department: req.user.department,
    createdBy: course.createdBy,
    updatedBy: req.user.id,
  });
  await course.save();
  await ActivityLogModel.create({
    user: req.user.id,
    action: ActivityAction.COURSE_UPDATED,
    resourceType: ActivityResource.COURSE,
    resourceId: course.id,
  });
  res.json({ course });
}
