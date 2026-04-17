import { enterprisePermissions, enterpriseRoles, legacyRoleAliases, rolePermissionMatrix, type CanonicalRole, type PermissionKey, type SupportedRole } from '../config/systemMasterRules';

const permissionLookup = new Set<string>(enterprisePermissions);

const legacyActionMap: Record<string, string> = {
  create: 'CREATE',
  read: 'VIEW',
  update: 'UPDATE',
  delete: 'DELETE'
};

const legacyModuleMap: Record<string, string> = {
  users: 'USER',
  students: 'STUDENT',
  teachers: 'TEACHER',
  classes: 'CLASS',
  subjects: 'SUBJECT',
  exams: 'EXAM',
  results: 'RESULT',
  finance: 'PAYMENT',
  expenses: 'EXPENSE',
  families: 'FAMILY_LINK',
  books: 'RESOURCE',
  notifications: 'NOTIFICATION',
  audit: 'AUDIT',
  roles: 'ROLE',
  permissions: 'PERMISSION',
  dashboard: 'DASHBOARD'
};

export function normalizeRole(role?: string | null): CanonicalRole | undefined {
  if (!role) {
    return undefined;
  }

  const value = role.toLowerCase() as SupportedRole;
  if ((enterpriseRoles as readonly string[]).includes(value)) {
    return value as CanonicalRole;
  }

  return legacyRoleAliases[value as keyof typeof legacyRoleAliases];
}

export function roleMatches(userRole: string | null | undefined, allowedRoles: Array<string | null | undefined>) {
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) {
    return false;
  }

  return allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === normalizedUserRole);
}

export function permissionFromLegacy(moduleKey: string, action: string): PermissionKey | undefined {
  const modulePrefix = legacyModuleMap[moduleKey];
  const actionSuffix = legacyActionMap[action];

  if (!modulePrefix || !actionSuffix) {
    return undefined;
  }

  const candidate = `${modulePrefix}_${actionSuffix}`;
  if (permissionLookup.has(candidate)) {
    return candidate as PermissionKey;
  }

  return undefined;
}

export function flattenLegacyPermissionMap(value: unknown): PermissionKey[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const permissions: PermissionKey[] = [];
  for (const [moduleKey, actions] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(actions)) {
      continue;
    }

    for (const action of actions) {
      if (typeof action !== 'string') {
        continue;
      }

      const permission = permissionFromLegacy(moduleKey, action);
      if (permission) {
        permissions.push(permission);
      }
    }
  }

  return Array.from(new Set(permissions));
}

export function getRolePermissions(role?: string | null): PermissionKey[] | ['*'] {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return [];
  }

  return rolePermissionMatrix[normalizedRole];
}

export function collectUserPermissions(user: {
  role?: string | null;
  rolePermissionKeys?: string[];
  permissionKeys?: string[];
  revokedPermissionKeys?: string[];
  permissions?: unknown;
} | null | undefined): PermissionKey[] | ['*'] {
  const rolePermissionOverride = Array.isArray(user?.rolePermissionKeys) && user?.rolePermissionKeys.length
    ? user.rolePermissionKeys.filter((permission): permission is PermissionKey => permissionLookup.has(permission))
    : null;

  const basePermissions = rolePermissionOverride ?? getRolePermissions(user?.role);
  if (basePermissions[0] === '*') {
    return ['*'];
  }

  const grantedByRole = new Set<string>(basePermissions as PermissionKey[]);
  const grantedByLegacyMap = flattenLegacyPermissionMap(user?.permissions);
  const grantedByUser = Array.isArray(user?.permissionKeys) ? user!.permissionKeys : [];
  const revokedByUser = new Set(Array.isArray(user?.revokedPermissionKeys) ? user!.revokedPermissionKeys : []);

  const granted = new Set<string>([...grantedByRole, ...grantedByLegacyMap, ...grantedByUser]);
  for (const revoked of revokedByUser) {
    granted.delete(revoked);
  }

  return Array.from(granted).filter((permission): permission is PermissionKey => permissionLookup.has(permission));
}

export function hasPermission(
  user: {
    role?: string | null;
    rolePermissionKeys?: string[];
    permissionKeys?: string[];
    revokedPermissionKeys?: string[];
    permissions?: unknown;
  } | null | undefined,
  permission: PermissionKey
) {
  const permissions = collectUserPermissions(user);
  return permissions[0] === '*' || (permissions as PermissionKey[]).includes(permission);
}
