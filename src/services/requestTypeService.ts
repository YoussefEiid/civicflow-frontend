import { apiClient } from './apiClient';
import { RequestTypeEntity } from '../types';

export interface RequestTypeFilters {
  search?: string;
  isActive?: boolean;
}

export const requestTypeService = {
  // Get all request types (admin/management)
  getAll: async (params?: RequestTypeFilters): Promise<RequestTypeEntity[]> => {
    const data = await apiClient.get<any>('/request-types', { params });
    const list = Array.isArray(data) ? data : data?.requestTypes || [];
    return list.map((rt: any) => ({
      id: rt.id,
      name: rt.name || '',
      code: rt.code || '',
      description: rt.description || '',
      isActive: rt.isActive !== undefined ? Boolean(rt.isActive) : rt.status === 'ACTIVE',
      status: rt.status || (rt.isActive ? 'ACTIVE' : 'INACTIVE'),
      requestsCount: rt.requestsCount || 0,
      createdAt: rt.createdAt,
      updatedAt: rt.updatedAt
    }));
  },

  // Get active request types for dropdowns / public forms
  getActive: async (): Promise<RequestTypeEntity[]> => {
    const data = await apiClient.get<any>('/request-types/active', { skipAuth: true });
    const list = Array.isArray(data) ? data : data?.requestTypes || [];
    return list.map((rt: any) => ({
      id: rt.id,
      name: rt.name || '',
      code: rt.code || '',
      isActive: true,
      status: 'ACTIVE'
    }));
  },

  // Get request type by ID
  getById: async (id: string): Promise<RequestTypeEntity> => {
    return apiClient.get<RequestTypeEntity>(`/request-types/${id}`);
  },

  // Create new request type
  create: async (data: { name: string; code?: string; description?: string; isActive?: boolean }): Promise<RequestTypeEntity> => {
    return apiClient.post<RequestTypeEntity>('/request-types', {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.isActive !== false ? 'ACTIVE' : 'INACTIVE'
    });
  },

  // Update request type
  update: async (id: string, data: { name?: string; code?: string; description?: string; isActive?: boolean }): Promise<RequestTypeEntity> => {
    return apiClient.put<RequestTypeEntity>(`/request-types/${id}`, {
      ...(data.name && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { status: data.isActive ? 'ACTIVE' : 'INACTIVE' })
    });
  },

  // Delete request type
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/request-types/${id}`);
  }
};
