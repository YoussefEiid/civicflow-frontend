import { apiClient } from './apiClient';
import { RequestTypeEntity } from '../types';

export interface RequestTypeFilters {
  search?: string;
  isActive?: boolean;
}

export const requestTypeService = {
  // Get all request types (admin/management)
  getAll: async (params?: RequestTypeFilters): Promise<RequestTypeEntity[]> => {
    return apiClient.get<RequestTypeEntity[]>('/request-types', { params });
  },

  // Get active request types for dropdowns / public forms
  getActive: async (): Promise<RequestTypeEntity[]> => {
    return apiClient.get<RequestTypeEntity[]>('/request-types/active', { skipAuth: true });
  },

  // Get request type by ID
  getById: async (id: string): Promise<RequestTypeEntity> => {
    return apiClient.get<RequestTypeEntity>(`/request-types/${id}`);
  },

  // Create new request type
  create: async (data: { name: string; code?: string; description?: string; isActive?: boolean }): Promise<RequestTypeEntity> => {
    return apiClient.post<RequestTypeEntity>('/request-types', data);
  },

  // Update request type
  update: async (id: string, data: { name?: string; code?: string; description?: string; isActive?: boolean }): Promise<RequestTypeEntity> => {
    return apiClient.put<RequestTypeEntity>(`/request-types/${id}`, data);
  },

  // Delete request type
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/request-types/${id}`);
  }
};
