import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

const requestTypeSchema = z.object({
  name: z.string().min(2, 'اسم نوع المعاملة مطلوب (حرفين على الأقل)'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

const updateRequestTypeSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const getRequestTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, page = '1', limit = '100' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit as string, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.name = { contains: (search as string).trim(), mode: 'insensitive' };
    }

    if (status && status !== 'all') {
      where.status = status as string;
    }

    const [total, requestTypes] = await Promise.all([
      prisma.requestType.count({ where }),
      prisma.requestType.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { requests: true }
          }
        }
      })
    ]);

    const formatted = requestTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      status: rt.status,
      requestsCount: rt._count.requests,
      createdAt: rt.createdAt.toISOString(),
      updatedAt: rt.updatedAt.toISOString()
    }));

    return sendSuccess(res, {
      requestTypes: formatted,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveRequestTypes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requestTypes = await prisma.requestType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });

    return sendSuccess(res, requestTypes);
  } catch (error) {
    next(error);
  }
};

export const getRequestTypeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const requestType = await prisma.requestType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    });

    if (!requestType) {
      throw new AppError('نوع المعاملة غير موجود في النظام', 404, 'REQUEST_TYPE_NOT_FOUND');
    }

    return sendSuccess(res, {
      id: requestType.id,
      name: requestType.name,
      status: requestType.status,
      requestsCount: requestType._count.requests,
      createdAt: requestType.createdAt.toISOString(),
      updatedAt: requestType.updatedAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
};

export const createRequestType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = requestTypeSchema.parse(req.body);

    const existing = await prisma.requestType.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new AppError('نوع المعاملة مسجل بالفعل في المنظومة', 400, 'REQUEST_TYPE_EXISTS');
    }

    const requestType = await prisma.$transaction(async (tx) => {
      const created = await tx.requestType.create({ data });

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'إضافة نوع معاملة',
            entity: 'RequestType',
            entityId: created.id,
            details: `إضافة نوع معاملة جديد (${created.name})`,
            afterValue: { name: created.name, status: created.status },
            ipAddress: req.ip
          }
        });
      }

      return created;
    });

    return sendSuccess(res, requestType, 'تمت إضافة نوع المعاملة بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

export const updateRequestType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateRequestTypeSchema.parse(req.body);

    const existing = await prisma.requestType.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('نوع المعاملة غير موجود', 404, 'REQUEST_TYPE_NOT_FOUND');
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.requestType.findUnique({ where: { name: data.name } });
      if (duplicate) {
        throw new AppError('يوجد نوع معاملة آخر مسجل بنفس الاسم', 400, 'REQUEST_TYPE_NAME_EXISTS');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resUpdated = await tx.requestType.update({
        where: { id },
        data
      });

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'تعديل نوع معاملة',
            entity: 'RequestType',
            entityId: id,
            details: `تعديل نوع المعاملة (${existing.name})`,
            beforeValue: { name: existing.name, status: existing.status },
            afterValue: { name: resUpdated.name, status: resUpdated.status },
            ipAddress: req.ip
          }
        });
      }

      return resUpdated;
    });

    return sendSuccess(res, updated, 'تم تحديث نوع المعاملة بنجاح');
  } catch (error) {
    next(error);
  }
};

export const deleteRequestType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.requestType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    });

    if (!existing) {
      throw new AppError('نوع المعاملة غير موجود', 404, 'REQUEST_TYPE_NOT_FOUND');
    }

    if (existing._count.requests > 0) {
      throw new AppError(
        `لا يمكن حذف نوع المعاملة لوجود (${existing._count.requests}) معاملة مرتبطة به. يمكنك تعطيله بدلاً من ذلك.`,
        400,
        'REQUEST_TYPE_HAS_RELATIONS'
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.requestType.delete({ where: { id } });

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'حذف نوع معاملة',
            entity: 'RequestType',
            entityId: id,
            details: `حذف نوع المعاملة (${existing.name})`,
            beforeValue: { name: existing.name },
            ipAddress: req.ip
          }
        });
      }
    });

    return sendSuccess(res, null, 'تم حذف نوع المعاملة بنجاح');
  } catch (error) {
    next(error);
  }
};
