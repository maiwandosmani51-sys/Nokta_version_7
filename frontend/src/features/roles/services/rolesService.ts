import { api } from '@/services/apiClient';

export interface RoleRecord {
  key: string;
  slug: string;
  name: string;
  description: string;
  scope: string;
  isSystemRole: boolean;
  hasCustomization: boolean;
  userCount: number;
  branchAccess: {
    scope: string;
    count: number;
  };
  permissionCount: number;
  permissionKeys: string[];
  permissions: Array<{ key: string; module: string; action: string }>;
}

export interface PermissionTemplate {
  modules: Array<{ key: string; label: string; actions: string[] }>;
  roleTemplates: Record<string, Record<string, string[]>>;
}

export const rolesService = {
  list: () => api.get('/roles').then((res) => res.data.data as RoleRecord[]),
  permissions: () => api.get('/permissions').then((res) => res.data.data as Array<{ key: string; module: string; action: string }>),
  templates: () => api.get('/permissions/template').then((res) => res.data.data as PermissionTemplate),
  create: (payload: Pick<RoleRecord, 'slug' | 'name' | 'description' | 'scope' | 'permissionKeys'>) =>
    api.post('/roles', payload).then((res) => res.data.data as RoleRecord),
  update: (slug: string, payload: Partial<Pick<RoleRecord, 'name' | 'description' | 'scope' | 'permissionKeys'>>) =>
    api.put(`/roles/${slug}`, payload).then((res) => res.data.data as RoleRecord),
  remove: (slug: string) => api.delete(`/roles/${slug}`).then((res) => res.data.data as RoleRecord)
};
