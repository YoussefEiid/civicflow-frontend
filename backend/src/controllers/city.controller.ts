import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

const citySchema = z.object({
  name: z.string().min(2, 'اسم المدينة مطلوب (حرفين على الأقل)'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

const updateCitySchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const getCities = async (req: Request, res: Response, next: NextFunction) => {
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

    const [total, cities] = await Promise.all([
      prisma.city.count({ where }),
      prisma.city.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { requests: true, customers: true }
          }
        }
      })
    ]);

    const formatted = cities.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      requestsCount: c._count.requests,
      customersCount: c._count.customers,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    }));

    return sendSuccess(res, {
      cities: formatted,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveCities = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await prisma.city.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });

    return sendSuccess(res, cities);
  } catch (error) {
    next(error);
  }
};

export const getCityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true, customers: true }
        }
      }
    });

    if (!city) {
      throw new AppError('المدينة غير موجودة في النظام', 404, 'CITY_NOT_FOUND');
    }

    return sendSuccess(res, {
      id: city.id,
      name: city.name,
      status: city.status,
      requestsCount: city._count.requests,
      customersCount: city._count.customers,
      createdAt: city.createdAt.toISOString(),
      updatedAt: city.updatedAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
};

export const createCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = citySchema.parse(req.body);

    const existing = await prisma.city.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new AppError('المدينة مسجلة بالفعل في المنظومة', 400, 'CITY_EXISTS');
    }

    const city = await prisma.$transaction(async (tx) => {
      const created = await tx.city.create({ data });

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'إضافة مدينة',
            entity: 'City',
            entityId: created.id,
            details: `إضافة مدينة جديدة (${created.name})`,
            afterValue: { name: created.name, status: created.status },
            ipAddress: req.ip
          }
        });
      }

      return created;
    });

    return sendSuccess(res, city, 'تمت إضافة المدينة بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateCitySchema.parse(req.body);

    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('المدينة غير موجودة', 404, 'CITY_NOT_FOUND');
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.city.findUnique({ where: { name: data.name } });
      if (duplicate) {
        throw new AppError('يوجد مدينة أخرى مسجلة بنفس الاسم', 400, 'CITY_NAME_EXISTS');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resUpdated = await tx.city.update({
        where: { id },
        data
      });

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'تعديل مدينة',
            entity: 'City',
            entityId: id,
            details: `تعديل بيانات المدينة (${existing.name})`,
            beforeValue: { name: existing.name, status: existing.status },
            afterValue: { name: resUpdated.name, status: resUpdated.status },
            ipAddress: req.ip
          }
        });
      }

      return resUpdated;
    });

    return sendSuccess(res, updated, 'تم تحديث بيانات المدينة بنجاح');
  } catch (error) {
    next(error);
  }
};

export const deleteCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true, customers: true }
        }
      }
    });

    if (!existing) {
      throw new AppError('المدينة غير موجودة', 404, 'CITY_NOT_FOUND');
    }

    if (existing._count.requests > 0 || existing._count.customers > 0) {
      throw new AppError(
        `لا يمكن حذف المدينة لوجود (${existing._count.requests}) معاملة و (${existing._count.customers}) مراجع مرتبط بها. يمكنك تعطيلها بدلاً من ذلك.`,
        400,
        'CITY_HAS_RELATIONS'
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.city.delete({ where: { id } });

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'حذف مدينة',
            entity: 'City',
            entityId: id,
            details: `حذف المدينة (${existing.name})`,
            beforeValue: { name: existing.name },
            ipAddress: req.ip
          }
        });
      }
    });

    return sendSuccess(res, null, 'تم حذف المدينة بنجاح');
  } catch (error) {
    next(error);
  }
};
