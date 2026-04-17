import { enterpriseRoutePolicies, type PermissionKey, type RoutePolicy } from '../config/systemMasterRules';
import { hasPermission, normalizeRole, roleMatches } from '../utils/roleHelpers';

export interface PermissionPrincipal {
  userId?: string;
  role?: string;
  branchId?: string | null;
  rolePermissionKeys?: string[];
  permissionKeys?: string[];
  revokedPermissionKeys?: string[];
  permissions?: unknown;
}

export class PermissionService {
  getRoutePolicy(pathname: string, method: string) {
    const normalizedMethod = method.toUpperCase();
    return enterpriseRoutePolicies.find((policy) => {
      if (!pathname.startsWith(policy.prefix)) {
        return false;
      }

      if (!policy.methods?.length) {
        return true;
      }

      return policy.methods.map((item) => item.toUpperCase()).includes(normalizedMethod);
    });
  }

  isPublicRoute(pathname: string, method: string) {
    const policy = this.getRoutePolicy(pathname, method);
    return Boolean(policy?.public);
  }

  hasRequiredAccess(user: PermissionPrincipal | null | undefined, policy: RoutePolicy) {
    if (policy.public) {
      return true;
    }

    if (!user?.role) {
      return false;
    }

    if (policy.roles?.length && !roleMatches(user.role, policy.roles)) {
      return false;
    }

    if (!policy.permissions?.length) {
      return true;
    }

    return policy.permissions.every((permission) => hasPermission(user, permission as PermissionKey));
  }

  getCanonicalRole(role?: string | null) {
    return normalizeRole(role);
  }
}
