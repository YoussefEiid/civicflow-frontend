import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [generalSet, notifSet, waSet, statuses, slaList, waTemplates] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'general' } }),
      prisma.systemSetting.findUnique({ where: { key: 'notificationPreferences' } }),
      prisma.systemSetting.findUnique({ where: { key: 'whatsapp' } }),
      prisma.requestStatus.findMany({ orderBy: { order: 'asc' } }),
      prisma.sLASetting.findMany({
        include: { ministry: { select: { name: true } } }
      }),
      prisma.whatsAppTemplate.findMany({ orderBy: { createdAt: 'asc' } })
    ]);

    const formattedStatuses = statuses.map((s) => ({
      id: s.id,
      name: s.name as any,
      color: s.color,
      order: s.order,
      isActive: s.isActive,
      isInitial: s.isInitial,
      isTerminal: s.isTerminal,
      requiresNotes: s.requiresNotes
    }));

    const formattedSla = slaList.map((s) => ({
      id: s.id,
      ministryId: s.ministryId,
      ministryName: s.ministry.name,
      defaultDays: s.defaultDays,
      urgentDays: s.urgentDays,
      importantDays: s.importantDays,
      autoAlertBeforeDays: s.autoAlertBeforeDays
    }));

    const formattedTemplates = waTemplates.map((t) => ({
      id: t.id,
      key: t.key,
      title: t.title,
      content: t.content,
      variables: Array.isArray(t.variables) ? (t.variables as string[]) : [],
      lastUpdated: t.updatedAt.toISOString().split('T')[0]
    }));

    const general = (generalSet?.value as any) || {
      systemName: 'CivicFlow',
      systemSubName: 'منظومة إدارة وتتبع معاملات المراجعين الحكومية',
      officePhone: '+966 11 800 2000',
      officeAddress: 'المملكة العربية السعودية - الرياض',
      officeEmail: 'support@civicflow.gov.sa',
      workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      workingHours: '08:00 ص - 04:00 م'
    };

    const notificationPreferences = (notifSet?.value as any) || {
      enableInApp: true,
      enableOverdueAlerts: true,
      enableStatusAlerts: true,
      enableWhatsApp: true,
      autoNotifyCustomerOnStatusChange: true
    };

    const whatsapp = (waSet?.value as any) || {
      isConnected: true,
      phoneNumber: '+966 50 123 9988',
      instanceName: 'CivicFlow-Gov-Gateway-01',
      lastSync: '2026-09-04 10:00',
      triggers: []
    };

    const fullSettings = {
      general,
      statuses: formattedStatuses,
      sla: formattedSla,
      whatsapp,
      whatsappTemplates: formattedTemplates,
      notificationPreferences
    };

    return sendSuccess(res, fullSettings);
  } catch (error) {
    next(error);
  }
};

export const updateSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    await prisma.$transaction(async (tx) => {
      if (data.general) {
        await tx.systemSetting.upsert({
          where: { key: 'general' },
          create: { key: 'general', value: data.general },
          update: { value: data.general }
        });
      }

      if (data.notificationPreferences) {
        await tx.systemSetting.upsert({
          where: { key: 'notificationPreferences' },
          create: { key: 'notificationPreferences', value: data.notificationPreferences },
          update: { value: data.notificationPreferences }
        });
      }

      if (data.whatsapp) {
        await tx.systemSetting.upsert({
          where: { key: 'whatsapp' },
          create: { key: 'whatsapp', value: data.whatsapp },
          update: { value: data.whatsapp }
        });
      }

      if (Array.isArray(data.statuses)) {
        for (const s of data.statuses) {
          if (s.id) {
            await tx.requestStatus.update({
              where: { id: s.id },
              data: {
                ...(s.name && { name: s.name }),
                ...(s.color && { color: s.color }),
                ...(s.order !== undefined && { order: s.order }),
                ...(s.isActive !== undefined && { isActive: s.isActive }),
                ...(s.isInitial !== undefined && { isInitial: s.isInitial }),
                ...(s.isTerminal !== undefined && { isTerminal: s.isTerminal }),
                ...(s.requiresNotes !== undefined && { requiresNotes: s.requiresNotes })
              }
            });
          }
        }
      }

      if (Array.isArray(data.sla)) {
        for (const sla of data.sla) {
          if (sla.ministryId) {
            await tx.sLASetting.upsert({
              where: { ministryId: sla.ministryId },
              create: {
                ministryId: sla.ministryId,
                defaultDays: sla.defaultDays || 7,
                urgentDays: sla.urgentDays || 3,
                importantDays: sla.importantDays || 5,
                autoAlertBeforeDays: sla.autoAlertBeforeDays || 2
              },
              update: {
                defaultDays: sla.defaultDays,
                urgentDays: sla.urgentDays,
                importantDays: sla.importantDays,
                autoAlertBeforeDays: sla.autoAlertBeforeDays
              }
            });
          }
        }
      }

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'تعديل إعدادات',
            entity: 'SystemSetting',
            details: 'تحديث الإعدادات العامة للمنظومة',
            ipAddress: req.ip
          }
        });
      }
    });

    return sendSuccess(res, data, 'تم تحديث الإعدادات بنجاح');
  } catch (error) {
    next(error);
  }
};