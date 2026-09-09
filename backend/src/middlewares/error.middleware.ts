import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/apiResponse.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('💥 Error caught in handler:', err);

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(
      res,
      422,
      'فشل التحقق من صحة البيانات المرسلة',
      'VALIDATION_ERROR',
      err.errors
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'الحقل';
      return sendError(
        res,
        409,
        `القيمة المدخلة في (${target}) موجودة مسبقاً في النظام ومكررة`,
        'UNIQUE_CONSTRAINT_VIOLATION',
        err.meta
      );
    }
    if (err.code === 'P2025') {
      return sendError(
        res,
        404,
        'السجل المطلوب غير موجود في قاعدة البيانات',
        'NOT_FOUND',
        err.meta
      );
    }
  }

  return sendError(
    res,
    500,
    process.env.NODE_ENV === 'production'
      ? 'حدث خطأ داخلي في الخادم'
      : err.message || 'Internal Server Error',
    'INTERNAL_SERVER_ERROR'
  );
};
