import type { Request, Response, NextFunction } from 'express';
import { createError } from '../helpers/response';
import { PermissionService } from '../services/permissionService';

const permissionService = new PermissionService();

export function branchMiddleware(req: Request, res: Response, next: NextFunction) {
  const policy = permissionService.getRoutePolicy(req.originalUrl, req.method);
  if (!policy?.branchScoped) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json(createError('Authentication required'));
  }

  if (['super_admin', 'owner', 'system_automation'].includes(req.user.canonicalRole ?? '')) {
    return next();
  }

  const requestBranchId = (req.body?.branchId || req.query?.branchId || req.user.branchId || null)?.toString?.() ?? null;
  if (!req.user.branchId || (requestBranchId && req.user.branchId !== requestBranchId)) {
    return res.status(403).json(createError('Branch access denied'));
  }

  next();
}
