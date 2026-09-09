import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { UserStatus } from '@prisma/client';

const ministrySchema = z.object({
  name: z.string().min(2, 'اسم الجهة/الوزارة مطلوب'),
  code: z.string().min(2, 'رمز الجهة مطلوب'),
  slaDays: z.coerce.number().min(1, 'مدة الإنجاز يجب أن تكون يوماً واحداً على الأقل').default(7),
  status: z.enum(['ACTIVE', 'INACTIVE', 'نشط', 'غير نشط']).optional().default('ACTIVE'),
  notes: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email('البريد الإلكتروني غير صالح').optional().nullable().or(z.literal(''))
});

const updateMinistrySchema = ministrySchema.partial();

export const getMinistries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status } = req.query;

    const where: any = {};

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { contactPerson: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'all') {
      where.status = status === 'نشط' || status === 'ACTIVE' ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    }

    const rawMinistries = await prisma.ministry.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        requests: {
          select: {
            id: true,
            status: true,
            deadlineStatus: true
          }
        },
        slaSetting: true
      }
    });

    const terminalStatuses = ['تم التسليم', 'مغلق'];
    const completedStatuses = ['تم التسليم', 'مغلق', 'الإجابة جاهزة'];

    const ministries = rawMinistries.map((m) => {
      const activeCount = m.requests.filter((r) => !terminalStatuses.includes(r.status)).length;
      const completedCount = m.requests.filter((r) => completedStatuses.includes(r.status)).length;
      const overdueCount = m.requests.filter(
        (r) => r.deadlineStatus === 'متأخر' && !completedStatuses.includes(r.status)
      ).length;

      return {
        id: m.id,
        name: m.name,
        code: m.code,
        slaDays: m.slaDays,
        activeRequestsCount: activeCount,
        completedRequestsCount: completedCount,
        overdueRequestsCount: overdueCount,
        status: m.status === UserStatus.ACTIVE ? 'نشط' : 'غير نشط',
        notes: m.notes || undefined,
        contactPerson: m.contactPerson || undefined,
        contactPhone: m.contactPhone || undefined,
        contactEmail: m.contactEmail || undefined
      };
    });

    return sendSuccess(res, ministries);
  } catch (error) {
    next(error);
  }
};

export const getMinistryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ministry = await prisma.ministry.findUnique({
      where: { id },
      include: {
        requests: {
          include: {
            customer: { select: { name: true, phone: true } },
            assignedEmployee: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        slaSetting: true
      }
    });

    if (!ministry) {
      throw new AppError('الجهة أو الوزارة غير موجودة في النظام', 404, 'MINISTRY_NOT_FOUND');
    }

    const terminalStatuses = ['تم التسليم', 'مغلق'];
    const completedStatuses = ['تم التسليم', 'مغلق', 'الإجابة جاهزة'];

    const activeCount = ministry.requests.filter((r) => !terminalStatuses.includes(r.status)).length;
    const completedCount = ministry.requests.filter((r) => completedStatuses.includes(r.status)).length;
    const overdueCount = ministry.requests.filter(
      (r) => r.deadlineStatus === 'متأخر' && !completedStatuses.includes(r.status)
    ).length;

    const formattedRequests = ministry.requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      customerId: r.customerId,
      customerName: r.customer.name,
      customerPhone: r.customer.phone,
      title: r.title,
      details: r.details,
      requestType: r.requestType,
      ministryId: ministry.id,
      ministryName: ministry.name,
      status: r.status,
      priority: r.priority === 'URGENT' ? 'عاجل' : r.priority === 'IMPORTANT' ? 'مهم' : 'عادي',
      assignedEmployeeId: r.assignedEmployeeId || '',
      assignedEmployeeName: r.assignedEmployee?.name || 'غير معين',
      receiveDate: r.receiveDate.toISOString().split('T')[0],
      expectedCompletionDate: r.expectedCompletionDate.toISOString().split('T')[0],
      completedDate: r.completedDate ? r.completedDate.toISOString().split('T')[0] : undefined,
      deadlineStatus: r.deadlineStatus,
      daysRemainingOrOverdue: r.daysRemainingOrOverdue,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));

    const formatted = {
      id: ministry.id,
      name: ministry.name,
      code: ministry.code,
      slaDays: ministry.slaDays,
      activeRequestsCount: activeCount,
      completedRequestsCount: completedCount,
      overdueRequestsCount: overdueCount,
      status: ministry.status === UserStatus.ACTIVE ? 'نشط' : 'غير نشط',
      notes: ministry.notes || undefined,
      contactPerson: ministry.contactPerson || undefined,
      contactPhone: ministry.contactPhone || undefined,
      contactEmail: ministry.contactEmail || undefined,
      requests: formattedRequests
    };

    return sendSuccess(res, formatted);
  } catch (error) {
    next(error);
  }
};

export const createMinistry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ministrySchema.parse(req.body);

    const existingCode = await prisma.ministry.findUnique({ where: { code: data.code } });
    if (existingCode) {
      throw new AppError('رمز الوزارة/الجهة موجود مسبقاً في النظام', 409, 'DUPLICATE_MINISTRY_CODE');
    }

    const statusVal =
      data.status === 'غير نشط' || data.status === 'INACTIVE'
        ? UserStatus.INACTIVE
        : UserStatus.ACTIVE;

    const newMin = await prisma.$transaction(async (tx) => {
      const min = await tx.ministry.create({
        data: {
          name: data.name,
          code: data.code,
          slaDays: data.slaDays,
          status: statusVal,
          notes: data.notes || null,
          contactPerson: data.contactPerson || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null
        }
      });

      // Default SLA parameters
      await tx.sLASetting.create({
        data: {
          ministryId: min.id,
          defaultDays: data.slaDays,
          urgentDays: Math.max(2, Math.floor(data.slaDays / 2)),
          importantDays: Math.max(3, Math.floor(data.slaDays * 0.75)),
          autoAlertBeforeDays: 2
        }
      });

      return min;
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'تعديل إعدادات',
          entity: 'Ministry',
          entityId: newMin.id,
          details: `إضافة وزارة/جهة حكومية جديدة: ${newMin.name} بمدة إنجاز ${newMin.slaDays} أيام`,
          ipAddress: req.ip
        }
      });
    }

    const formatted = {
      id: newMin.id,
      name: newMin.name,
      code: newMin.code,
      slaDays: newMin.slaDays,
      activeRequestsCount: 0,
      completedRequestsCount: 0,
      overdueRequestsCount: 0,
      status: newMin.status === UserStatus.ACTIVE ? 'نشط' : 'غير نشط',
      notes: newMin.notes || undefined,
      contactPerson: newMin.contactPerson || undefined,
      contactPhone: newMin.contactPhone || undefined,
      contactEmail: newMin.contactEmail || undefined
    };

    return sendSuccess(res, formatted, 'تم تسجيل الجهة الحكومية بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

export const updateMinistry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateMinistrySchema.parse(req.body);

    const existing = await prisma.ministry.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('الجهة غير موجودة في النظام', 404, 'MINISTRY_NOT_FOUND');
    }

    let statusVal: UserStatus | undefined;
    if (data.status) {
      statusVal =
        data.status === 'غير نشط' || data.status === 'INACTIVE'
          ? UserStatus.INACTIVE
          : UserStatus.ACTIVE;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const min = await tx.ministry.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code }),
          ...(data.slaDays !== undefined && { slaDays: data.slaDays }),
          ...(statusVal && { status: statusVal }),
          ...(data.notes !== undefined && { notes: data.notes || null }),
          ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson || null }),
          ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone || null }),
          ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null })
        }
      });

      if (data.slaDays !== undefined) {
        await tx.sLASetting.upsert({
          where: { ministryId: id },
          create: {
            ministryId: id,
            defaultDays: data.slaDays,
            urgentDays: Math.max(2, Math.floor(data.slaDays / 2)),
            importantDays: Math.max(3, Math.floor(data.slaDays * 0.75)),
            autoAlertBeforeDays: 2
          },
          update: {
            defaultDays: data.slaDays
          }
        });
      }

      return min;
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'تعديل إعدادات',
          entity: 'Ministry',
          entityId: updated.id,
          details: `تحديث بيانات الوزارة/الجهة: ${updated.name}`,
          ipAddress: req.ip
        }
      });
    }

    const formatted = {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      slaDays: updated.slaDays,
      activeRequestsCount: 0,
      completedRequestsCount: 0,
      overdueRequestsCount: 0,
      status: updated.status === UserStatus.ACTIVE ? 'نشط' : 'غير نشط',
      notes: updated.notes || undefined,
      contactPerson: updated.contactPerson || undefined,
      contactPhone: updated.contactPhone || undefined,
      contactEmail: updated.contactEmail || undefined
    };

    return sendSuccess(res, formatted, 'تم تحديث بيانات الجهة بنجاح');
  } catch (error) {
    next(error);
  }
};

export const deleteMinistry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.ministry.findUnique({
      where: { id },
      include: { requests: { select: { id: true } } }
    });

    if (!existing) {
      throw new AppError('الجهة غير موجودة في النظام', 404, 'MINISTRY_NOT_FOUND');
    }

    if (existing.requests.length > 0) {
      // Deactivate rather than delete to preserve request history
      await prisma.ministry.update({
        where: { id },
        data: { status: UserStatus.INACTIVE }
      });

      return sendSuccess(
        res,
        null,
        'تم تعطيل الجهة بدلاً من الحذف لوجود معاملات سابقة تابعة لها'
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.sLASetting.deleteMany({ where: { ministryId: id } });
      await tx.ministry.delete({ where: { id } });
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'تعديل إعدادات',
          entity: 'Ministry',
          entityId: id,
          details: `حذف الوزارة/الجهة: ${existing.name}`,
          ipAddress: req.ip
        }
      });
    }

    return sendSuccess(res, null, 'تم حذف الجهة بنجاح');
  } catch (error) {
    next(error);
  }
};