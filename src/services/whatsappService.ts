import { apiClient } from './apiClient';
import { WhatsAppTemplate, WhatsAppSettings } from '../types';

export const whatsappService = {
  getTemplates: async (): Promise<WhatsAppTemplate[]> => {
    return apiClient.get<WhatsAppTemplate[]>('/whatsapp/templates');
  },

  createTemplate: async (data: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> => {
    return apiClient.post<WhatsAppTemplate>('/whatsapp/templates', data);
  },

  updateTemplate: async (id: string, updates: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> => {
    return apiClient.patch<WhatsAppTemplate>(`/whatsapp/templates/${id}`, updates);
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/whatsapp/templates/${id}`);
  },

  getLogs: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/whatsapp/logs');
  },

  sendWhatsApp: async (phoneNumber: string, message: string, templateKey?: string, requestId?: string) => {
    return apiClient.post('/whatsapp/send', {
      phoneNumber,
      message,
      templateKey,
      requestId
    });
  }
};