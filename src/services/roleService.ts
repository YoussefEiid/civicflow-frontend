import { apiClient } from './apiClient';
import { Role } from '../types';

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    return apiClient.get<Role[]>('/roles');
  },

  getRoleById: async (id: string): Promise<Role> => {
    return apiClient.get<Role>(`/roles/${id}`);
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    return apiClient.patch<Role>(`/roles/${id}`, updates);
  }
};