import { apiClient } from './apiClient';
import { NotificationItem } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const data = await apiClient.get<any>('/notifications');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.notifications)) return data.notifications;
    return [];
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  createNotification: async (
    title: string,
    message: string,
    type: NotificationItem['type'],
    requestId?: string,
    requestNumber?: string
  ): Promise<NotificationItem> => {
    return apiClient.post<NotificationItem>('/notifications', {
      title,
      message,
      type,
      requestId,
      requestNumber
    });
  }
};