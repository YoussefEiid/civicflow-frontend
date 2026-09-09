import { apiClient } from './apiClient';
import { Ministry } from '../types';

export const ministryService = {
  getMinistries: async (search?: string, status?: string): Promise<Ministry[]> => {
    return apiClient.get<Ministry[]>('/ministries', {
      params: { search, status }
    });
  },

  getMinistryById: async (id: string): Promise<Ministry> => {
    return apiClient.get<Ministry>(`/ministries/${id}`);
  },

  createMinistry: async (ministryData: Partial<Ministry>): Promise<Ministry> => {
    return apiClient.post<Ministry>('/ministries', ministryData);
  },

  updateMinistry: async (id: string, updates: Partial<Ministry>): Promise<Ministry> => {
    return apiClient.patch<Ministry>(`/ministries/${id}`, updates);
  },

  deleteMinistry: async (id: string): Promise<void> => {
    await apiClient.delete(`/ministries/${id}`);
  }
};