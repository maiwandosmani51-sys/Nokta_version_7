import type { Request, Response, NextFunction } from 'express';
import { createError } from '../helpers/response';
import { PermissionService } from '../services/permissionService';
import { RoleProfileService } from '../services/roleProfileService';
import { User } from '../models/User';
import type { PermissionKey } from '../config/systemMasterRules';
import { normalizeRole } from '../utils/roleHelpers';

const permissionService = new PermissionService();
const roleProfileService = new RoleProfileService();

export function permissionMiddleware(permission: PermissionKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return res.status(401).json(createError('Authentication required'));
    }

    const currentUser = await User.findById(req.user.userId)
      .select('role permissionKeys revokedPermissionKeys permissions')
      .lean<Record<string, any>>();

    const canonicalRole = normalizeRole(currentUser?.role);
    const rolePermissionKeys = canonicalRole
      ? await roleProfileService.getRolePermissionOverride(canonicalRole)
      : null;

    if (!currentUser || !permissionService.hasRequiredAccess({ ...currentUser, rolePermissionKeys: rolePermissionKeys ?? undefined }, { prefix: req.originalUrl, permissions: [permission] })) {
      return res.status(403).json(createError('Forbidden'));
    }

    next();
  };
}

export function routePermissionMiddleware(req: Request, res: Response, next: NextFunction) {
  const policy = permissionService.getRoutePolicy(req.originalUrl, req.method);
  if (!policy || policy.public) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json(createError('Authentication required'));
  }

  return permissionService.hasRequiredAccess(req.user, policy)
    ? next()
    : res.status(403).json(createError('Forbidden'));
}
