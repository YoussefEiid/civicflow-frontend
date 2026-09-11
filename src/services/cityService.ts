import { apiClient } from './apiClient';
import { City } from '../types';

export interface CityFilters {
  search?: string;
  isActive?: boolean;
}

export const cityService = {
  // Get all cities (admin/management)
  getAll: async (params?: CityFilters): Promise<City[]> => {
    const data = await apiClient.get<any>('/cities', { params });
    const list = Array.isArray(data) ? data : data?.cities || [];
    return list.map((c: any) => ({
      id: c.id,
      name: c.name || '',
      code: c.code || '',
      isActive: c.isActive !== undefined ? Boolean(c.isActive) : c.status === 'ACTIVE',
      status: c.status || (c.isActive ? 'ACTIVE' : 'INACTIVE'),
      requestsCount: c.requestsCount || 0,
      customersCount: c.customersCount || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
  },

  // Get active cities for public/dropdown selection
  getActive: async (): Promise<City[]> => {
    const data = await apiClient.get<any>('/cities/active', { skipAuth: true });
    const list = Array.isArray(data) ? data : data?.cities || [];
    return list.map((c: any) => ({
      id: c.id,
      name: c.name || '',
      code: c.code || '',
      isActive: true,
      status: 'ACTIVE'
    }));
  },

  // Get city by ID
  getById: async (id: string): Promise<City> => {
    return apiClient.get<City>(`/cities/${id}`);
  },

  // Create new city
  create: async (data: { name: string; code?: string; isActive?: boolean }): Promise<City> => {
    return apiClient.post<City>('/cities', {
      name: data.name,
      code: data.code,
      status: data.isActive !== false ? 'ACTIVE' : 'INACTIVE'
    });
  },

  // Update city
  update: async (id: string, data: { name?: string; code?: string; isActive?: boolean }): Promise<City> => {
    return apiClient.put<City>(`/cities/${id}`, {
      ...(data.name && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.isActive !== undefined && { status: data.isActive ? 'ACTIVE' : 'INACTIVE' })
    });
  },

  // Delete city
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/cities/${id}`);
  }
};
