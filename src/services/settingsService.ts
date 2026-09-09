import { apiClient } from './apiClient';
import { SystemSettings } from '../types';

export const settingsService = {
  getSystemSettings: async (): Promise<SystemSettings> => {
    return apiClient.get<SystemSettings>('/settings');
  },

  updateSystemSettings: async (updates: Partial<SystemSettings>): Promise<SystemSettings> => {
    return apiClient.put<SystemSettings>('/settings', updates);
  }
};