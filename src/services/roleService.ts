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

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    return apiClient.patch<Role>(`/roles/${id}`, updates);
  }
};