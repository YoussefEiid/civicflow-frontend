import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

const createNotificationSchema = z.object({
  title: z.string().min(2, 'عنوان الإشعار مطلوب'),
  message: z.string().min(2, 'نص الإشعار مطلوب'),
  type: z.enum(['status_change', 'overdue', 'final_response', 'docs_required', 'system', 'whatsapp']).default('system'),
  requestId: z.string().optional().nullable(),
  requestNumber: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  link: z.string().optional().nullable()
});

const calculateTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return date.toISOString().split('T')[0];
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const rawNotifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: null },
          { userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const notifications = rawNotifications.map((n) => {
      const d = new Date(n.createdAt);
      const dateStr = `${d.toISOString().split('T')[0]} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return {
        id: n.id,
        title: n.title,
        message: n.message,
        requestId: n.requestId || undefined,
        requestNumber: n.requestNumber || undefined,
        type: n.type,
        read: n.read,
        createdAt: dateStr,
        timeAgo: calculateTimeAgo(d),
        link: n.link || (n.requestId ? `/requests/${n.requestId}` : undefined)
      };
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return sendSuccess(res, { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      throw new AppError('الإشعار غير موجود', 404, 'NOTIFICATION_NOT_FOUND');
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return sendSuccess(res, null, 'تم تعليم الإشعار كمقروء');
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: null },
          { userId }
        ],
        read: false
      },
      data: { read: true }
    });

    return sendSuccess(res, null, 'تم تعليم كافة الإشعارات كمقروءة');
  } catch (error) {
    next(error);
  }
};

export const createManualNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createNotificationSchema.parse(req.body);

    const created = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        requestId: data.requestId || null,
        requestNumber: data.requestNumber || null,
        userId: data.userId || null,
        link: data.link || (data.requestId ? `/requests/${data.requestId}` : null)
      }
    });

    return sendSuccess(res, created, 'تم إرسال الإشعار بنجاح', 201);
  } catch (error) {
    next(error);
  }
};