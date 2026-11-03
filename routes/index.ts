import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { asyncHandler, roleHandler } from '../types/http';
import loginHandler from '../handlers/auth/loginHandler';
import { loginLimiter } from '../middleware/rate-limiter';
import logoutHandler from '../handlers/auth/logoutHandler';
import meHandler from '../handlers/auth/meHandler';
import studentCourseListHandler from '../handlers/student/courseListHandler';
import studentRegistrationHandler, {
  listStudentRegistrationsHandler,
} from '../handlers/student/registrationHandler';
import studentResultListHandler from '../handlers/student/resultListHandler';
import lecturerCourseListHandler from '../handlers/lecturer/courseListHandler';
import lecturerRegistrationListHandler from '../handlers/lecturer/registrationListHandler';
import {
  listLecturerResultsHandler,
  saveResultDraftHandler,
  submitResultHandler,
} from '../handlers/lecturer/resultHandler';
import {
  createDepartmentCourseHandler,
  updateDepartmentCourseHandler,
} from '../handlers/department-admin/courseManagementHandler';
import departmentCourseListHandler from '../handlers/department-admin/courseListHandler';
import {
  createDepartmentUserHandler,
  listDepartmentUsersHandler,
  updateDepartmentUserHandler,
} from '../handlers/department-admin/userManagementHandler';
import departmentRegistrationListHandler from '../handlers/department-admin/registrationListHandler';
import departmentResultListHandler from '../handlers/department-admin/resultListHandler';
import departmentReviewResultHandler from '../handlers/department-admin/reviewResultHandler';
import {
  createCourseHandler,
  listCoursesHandler,
  updateCourseHandler,
} from '../handlers/super-admin/courseManagementHandler';
import {
  createUserHandler,
  listUsersHandler,
  updateUserHandler,
} from '../handlers/super-admin/userManagementHandler';
import superRegistrationListHandler from '../handlers/super-admin/registrationListHandler';
import superResultListHandler from '../handlers/super-admin/resultListHandler';
import superReviewResultHandler from '../handlers/super-admin/reviewResultHandler';
import activityListHandler from '../handlers/super-admin/activityListHandler';
import {
  createAcademicHandler,
  listAcademicHandler,
  updateAcademicHandler,
} from '../handlers/shared/academicHandler';
import { UserRole } from '../models/enums';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema } from '../validators/auth/login.schema';

const router = Router();

router.post('/auth/login', loginLimiter, validateRequest(loginSchema), asyncHandler(loginHandler));
router.use(authenticate);
router.get('/auth/me', asyncHandler(meHandler));
router.post('/auth/logout', asyncHandler(logoutHandler));

router.get(
  '/academics/:resource(faculties|departments|programs|periods)',
  asyncHandler(listAcademicHandler),
);
router.post(
  '/academics/:resource(faculties|departments|programs|periods)',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN),
  asyncHandler(createAcademicHandler),
);
router.patch(
  '/academics/:resource(faculties|departments|programs|periods)/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN),
  asyncHandler(updateAcademicHandler),
);

router.get(
  '/users',
  roleHandler({
    [UserRole.SUPER_ADMIN]: listUsersHandler,
    [UserRole.DEPARTMENT_ADMIN]: listDepartmentUsersHandler,
  }),
);
router.post(
  '/users',
  roleHandler({
    [UserRole.SUPER_ADMIN]: createUserHandler,
    [UserRole.DEPARTMENT_ADMIN]: createDepartmentUserHandler,
  }),
);
router.patch(
  '/users/:id',
  roleHandler({
    [UserRole.SUPER_ADMIN]: updateUserHandler,
    [UserRole.DEPARTMENT_ADMIN]: updateDepartmentUserHandler,
  }),
);

router.get(
  '/courses',
  roleHandler({
    [UserRole.SUPER_ADMIN]: listCoursesHandler,
    [UserRole.DEPARTMENT_ADMIN]: departmentCourseListHandler,
    [UserRole.LECTURER]: lecturerCourseListHandler,
    [UserRole.STUDENT]: studentCourseListHandler,
  }),
);
router.post(
  '/courses',
  roleHandler({
    [UserRole.SUPER_ADMIN]: createCourseHandler,
    [UserRole.DEPARTMENT_ADMIN]: createDepartmentCourseHandler,
  }),
);
router.patch(
  '/courses/:id',
  roleHandler({
    [UserRole.SUPER_ADMIN]: updateCourseHandler,
    [UserRole.DEPARTMENT_ADMIN]: updateDepartmentCourseHandler,
  }),
);

router.get(
  '/registrations',
  roleHandler({
    [UserRole.SUPER_ADMIN]: superRegistrationListHandler,
    [UserRole.DEPARTMENT_ADMIN]: departmentRegistrationListHandler,
    [UserRole.LECTURER]: lecturerRegistrationListHandler,
    [UserRole.STUDENT]: listStudentRegistrationsHandler,
  }),
);
router.post(
  '/registrations',
  authorize(UserRole.STUDENT),
  asyncHandler(studentRegistrationHandler),
);

router.get(
  '/results',
  roleHandler({
    [UserRole.SUPER_ADMIN]: superResultListHandler,
    [UserRole.DEPARTMENT_ADMIN]: departmentResultListHandler,
    [UserRole.LECTURER]: listLecturerResultsHandler,
    [UserRole.STUDENT]: studentResultListHandler,
  }),
);
router.put(
  '/results/registration/:registrationId',
  authorize(UserRole.LECTURER),
  asyncHandler(saveResultDraftHandler),
);
router.post('/results/:id/submit', authorize(UserRole.LECTURER), asyncHandler(submitResultHandler));
router.post(
  '/results/:id/review',
  roleHandler({
    [UserRole.DEPARTMENT_ADMIN]: departmentReviewResultHandler,
    [UserRole.SUPER_ADMIN]: superReviewResultHandler,
  }),
);

router.get('/activities', authorize(UserRole.SUPER_ADMIN), asyncHandler(activityListHandler));

export default router;
