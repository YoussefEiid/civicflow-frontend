import { apiClient } from './apiClient';
import { Role } from '../types';

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    const data = await apiClient.get<any>('/roles');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.roles)) return data.roles;
    return [];
  },

  getRoleById: async (id: string): Promise<Role> => {
    return apiClient.get<Role>(`/roles/${id}`);
  },

  createRole: async (roleData: { name: string; description?: string; permissions?: any[]; extraPermissions?: any }): Promise<Role> => {
    return apiClient.post<Role>('/roles', roleData);
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    return apiClient.patch<Role>(`/roles/${id}`, updates);
  },

  deleteRole: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/roles/${id}`);
  }
};