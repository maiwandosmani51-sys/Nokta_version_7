import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { createError } from '../helpers/response';
import { permissionFromLegacy } from '../utils/roleHelpers';
import { User } from '../models/User';
import { normalizeRole } from '../utils/roleHelpers';
import { SessionService } from '../services/sessionService';
import { PermissionService } from '../services/permissionService';
import { RoleProfileService } from '../services/roleProfileService';
import type { RoleType } from '../types';

export interface AuthPayload {
  userId: string;
  role: RoleType;
  canonicalRole?: string;
  branchId?: string | null;
  sessionId?: string;
  jti?: string;
}

const sessionService = new SessionService();
const permissionService = new PermissionService();
const roleProfileService = new RoleProfileService();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json(createError('Authentication required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    const sessionId = payload.jti || payload.sessionId;
    if (sessionId && await sessionService.isAccessTokenBlacklisted(sessionId)) {
      return res.status(401).json(createError('Session has been revoked'));
    }

    const currentUser = await User.findById(payload.userId)
      .select('role branchId permissionKeys revokedPermissionKeys permissions status isDeleted')
      .lean<Record<string, any>>();

    if (!currentUser || currentUser.isDeleted) {
      return res.status(401).json(createError('Invalid token'));
    }

    if (['locked', 'suspended', 'inactive'].includes(String(currentUser.status || 'active'))) {
      return res.status(403).json(createError(`Account is ${currentUser.status}`));
    }

    const canonicalRole = permissionService.getCanonicalRole(currentUser.role);
    const rolePermissionKeys = canonicalRole
      ? await roleProfileService.getRolePermissionOverride(canonicalRole)
      : null;

    req.user = {
      userId: payload.userId,
      role: currentUser.role,
      canonicalRole,
      branchId: currentUser.branchId?.toString?.() ?? null,
      sessionId: sessionId ?? null,
      permissionKeys: Array.isArray(currentUser.permissionKeys) ? currentUser.permissionKeys : [],
      rolePermissionKeys: rolePermissionKeys ?? undefined
    };

    next();
  } catch {
    return res.status(401).json(createError('Invalid token'));
  }
}

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !permissionService.hasRequiredAccess({ role }, { prefix: req.originalUrl, roles: allowedRoles as any })) {
      return res.status(403).json(createError('Access denied'));
    }
    next();
  };
}

export function checkPermission(moduleKey: string, action: string) {
  const permission = permissionFromLegacy(moduleKey, action);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return res.status(401).json(createError('Authentication required'));
    }

    if (!permission) {
      return res.status(403).json(createError('Forbidden'));
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

export function permissionGuard(req: Request, res: Response, next: NextFunction) {
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

export function studentFilter(req: Request, res: Response, next: NextFunction) {
  if (req.user?.canonicalRole === 'student') {
    (req as any).filter = { userId: req.user.userId };
  }
  next();
}

export const authMiddleware = authenticate;
