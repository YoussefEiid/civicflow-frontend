import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';

export const requirePermission = (permissionKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED'));
    }

    // Super Admin role bypasses granular checks
    if (req.user.role === 'مدير النظام') {
      return next();
    }

    const hasPermission = req.user.permissions.includes(permissionKey);

    if (!hasPermission) {
      return next(
        new AppError(
          `ليس لديك الصلاحية الكافية لإتمام هذه العملية (${permissionKey})`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

export const requireAnyPermission = (permissionKeys: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED'));
    }

    if (req.user.role === 'مدير النظام') {
      return next();
    }

    const hasAny = permissionKeys.some((k) => req.user?.permissions.includes(k));

    if (!hasAny) {
      return next(
        new AppError(
          `ليس لديك أي من الصلاحيات المطلوبة لإتمام هذه العملية: [${permissionKeys.join(', ')}]`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `هذا الإجراء مخصص للأدوار التالية فقط: [${allowedRoles.join(', ')}]`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};