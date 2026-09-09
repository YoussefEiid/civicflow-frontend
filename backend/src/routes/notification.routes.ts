import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createManualNotification
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', requirePermission('notifications.view'), getNotifications);
notificationRouter.patch('/read-all', requirePermission('notifications.view'), markAllNotificationsAsRead);
notificationRouter.patch('/mark-all-read', requirePermission('notifications.view'), markAllNotificationsAsRead);
notificationRouter.patch('/:id/read', requirePermission('notifications.view'), markNotificationAsRead);
notificationRouter.post('/', requirePermission('notifications.view'), createManualNotification);