import { apiClient } from './apiClient';
import { City } from '../types';

export interface CityFilters {
  search?: string;
  isActive?: boolean;
}

export const cityService = {
  // Get all cities (admin/management)
  getAll: async (params?: CityFilters): Promise<City[]> => {
    return apiClient.get<City[]>('/cities', { params });
  },

  // Get active cities for public/dropdown selection
  getActive: async (): Promise<City[]> => {
    return apiClient.get<City[]>('/cities/active', { skipAuth: true });
  },

  // Get city by ID
  getById: async (id: string): Promise<City> => {
    return apiClient.get<City>(`/cities/${id}`);
  },

  // Create new city
  create: async (data: { name: string; code?: string; isActive?: boolean }): Promise<City> => {
    return apiClient.post<City>('/cities', data);
  },

  // Update city
  update: async (id: string, data: { name?: string; code?: string; isActive?: boolean }): Promise<City> => {
    return apiClient.put<City>(`/cities/${id}`, data);
  },

  // Delete city
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/cities/${id}`);
  }
};
