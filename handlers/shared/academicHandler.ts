import { HTTPStatus } from '../../utils/http.utils';
import type { AuthenticatedRequest } from '../../types/http';
import type { Response } from 'express';
import {
  AcademicPeriodModel,
  DepartmentModel,
  FacultyModel,
  ProgramModel,
} from '../../models/academic.model';
import { ActivityLogModel } from '../../models/activity-log.model';
import { AcademicResource, ActivityAction, ActivityResource, UserRole } from '../../models/enums';
import { sameId } from '../../middleware/scope';

const isAcademicResource = (value: string): value is AcademicResource =>
  Object.values(AcademicResource).includes(value as AcademicResource);

export async function listAcademicHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const resource = req.params.resource;
  if (!isAcademicResource(resource)) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Academic resource not found.' });
    return;
  }
  if (resource === 'faculties') {
    res.json({ faculties: await FacultyModel.find().sort({ name: 1 }) });
  } else if (resource === 'departments') {
    if (req.user.role === UserRole.DEPARTMENT_ADMIN && !req.user.department) {
      res
        .status(HTTPStatus.FORBIDDEN)
        .json({ message: 'Department admin account has no assigned department.' });
      return;
    }
    const filter = req.user.role === UserRole.DEPARTMENT_ADMIN ? { _id: req.user.department } : {};
    res.json({ departments: await DepartmentModel.find(filter).sort({ name: 1 }) });
  } else if (resource === 'programs') {
    if (req.user.role === UserRole.DEPARTMENT_ADMIN && !req.user.department) {
      res
        .status(HTTPStatus.FORBIDDEN)
        .json({ message: 'Department admin account has no assigned department.' });
      return;
    }
    const filter =
      req.user.role === UserRole.DEPARTMENT_ADMIN ? { department: req.user.department } : {};
    res.json({ programs: await ProgramModel.find(filter).sort({ name: 1 }) });
  } else {
    res.json({ periods: await AcademicPeriodModel.find().sort({ session: -1, semester: 1 }) });
  }
}

export async function createAcademicHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const resource = req.params.resource;
  if (!isAcademicResource(resource)) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Academic resource not found.' });
    return;
  }
  if (req.user.role === UserRole.DEPARTMENT_ADMIN && resource !== AcademicResource.PROGRAMS) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admins can manage programs only.' });
    return;
  }
  const data = { ...req.body };
  if (resource === 'faculties') {
    const record = await FacultyModel.create({
      ...data,
      createdBy: req.user.id,
      updatedBy: undefined,
    });
    await logAction(req, resource, ActivityResource.FACULTY, record.id, true);
    res.status(HTTPStatus.CREATED).json({ record });
  } else if (resource === 'departments') {
    const record = await DepartmentModel.create({
      ...data,
      createdBy: req.user.id,
      updatedBy: undefined,
    });
    await logAction(req, resource, ActivityResource.DEPARTMENT, record.id, true);
    res.status(HTTPStatus.CREATED).json({ record });
  } else if (resource === 'programs') {
    if (req.user.role === UserRole.DEPARTMENT_ADMIN) {
      if (data.department && !sameId(data.department, req.user.department)) {
        res
          .status(HTTPStatus.FORBIDDEN)
          .json({ message: 'You can only create programs in your department.' });
        return;
      }
      data.department = req.user.department;
    }
    const record = await ProgramModel.create({
      ...data,
      createdBy: req.user.id,
      updatedBy: undefined,
    });
    await logAction(req, resource, ActivityResource.PROGRAM, record.id, true);
    res.status(HTTPStatus.CREATED).json({ record });
  } else {
    const record = await AcademicPeriodModel.create({
      ...data,
      createdBy: req.user.id,
      updatedBy: undefined,
    });
    await logAction(req, resource, ActivityResource.ACADEMIC_PERIOD, record.id, true);
    res.status(HTTPStatus.CREATED).json({ record });
  }
}

export async function updateAcademicHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const resource = req.params.resource;
  if (!isAcademicResource(resource)) {
    res.status(HTTPStatus.NOT_FOUND).json({ message: 'Academic resource not found.' });
    return;
  }
  if (req.user.role === UserRole.DEPARTMENT_ADMIN && resource !== AcademicResource.PROGRAMS) {
    res
      .status(HTTPStatus.FORBIDDEN)
      .json({ message: 'Department admins can manage programs only.' });
    return;
  }
  if (resource === 'faculties') {
    const record = await FacultyModel.findById(req.params.id);
    if (!record) return missing(res);
    record.set({ ...req.body, createdBy: record.createdBy, updatedBy: req.user.id });
    await record.save();
    await logAction(req, resource, ActivityResource.FACULTY, record.id, false);
    res.json({ record });
  } else if (resource === 'departments') {
    const record = await DepartmentModel.findById(req.params.id);
    if (!record) return missing(res);
    record.set({ ...req.body, createdBy: record.createdBy, updatedBy: req.user.id });
    await record.save();
    await logAction(req, resource, ActivityResource.DEPARTMENT, record.id, false);
    res.json({ record });
  } else if (resource === 'programs') {
    const filter =
      req.user.role === UserRole.DEPARTMENT_ADMIN
        ? { _id: req.params.id, department: req.user.department }
        : { _id: req.params.id };
    const record = await ProgramModel.findOne(filter);
    if (!record) return missing(res);
    if (
      req.user.role === UserRole.DEPARTMENT_ADMIN &&
      req.body.department &&
      !sameId(req.body.department, req.user.department)
    ) {
      res
        .status(HTTPStatus.FORBIDDEN)
        .json({ message: 'You cannot move a program to another department.' });
      return;
    }
    record.set(
      req.user.role === UserRole.DEPARTMENT_ADMIN
        ? {
            ...req.body,
            department: req.user.department,
            createdBy: record.createdBy,
            updatedBy: req.user.id,
          }
        : { ...req.body, createdBy: record.createdBy, updatedBy: req.user.id },
    );
    await record.save();
    await logAction(req, resource, ActivityResource.PROGRAM, record.id, false);
    res.json({ record });
  } else {
    const record = await AcademicPeriodModel.findById(req.params.id);
    if (!record) return missing(res);
    record.set({ ...req.body, createdBy: record.createdBy, updatedBy: req.user.id });
    await record.save();
    await logAction(req, resource, ActivityResource.ACADEMIC_PERIOD, record.id, false);
    res.json({ record });
  }
}

async function logAction(
  req: AuthenticatedRequest,
  resource: AcademicResource,
  resourceType: ActivityResource,
  id: string,
  created: boolean,
): Promise<void> {
  await ActivityLogModel.create({
    user: req.user.id,
    action: created
      ? ActivityAction.ACADEMIC_RECORD_CREATED
      : ActivityAction.ACADEMIC_RECORD_UPDATED,
    resourceType,
    resourceId: id,
    details: { resource },
  });
}

function missing(res: Response): void {
  res.status(HTTPStatus.NOT_FOUND).json({ message: 'Academic record not found.' });
}
