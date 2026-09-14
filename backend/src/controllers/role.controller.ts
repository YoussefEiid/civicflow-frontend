import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

const MODULES_LIST = ['الطلبات', 'المراجعون', 'الوزارات', 'الموظفون', 'التقارير', 'الإشعارات', 'الإعدادات', 'سجل العمليات'];

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        users: { select: { id: true } },
        rolePermissions: {
          include: { permission: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formattedRoles = roles.map((role) => {
      const permKeys = role.rolePermissions.map((rp) => rp.permission.key);

      const matrix = MODULES_LIST.map((mod) => {
        let prefix = 'requests';
        if (mod === 'المراجعون') prefix = 'customers';
        if (mod === 'الوزارات') prefix = 'ministries';
        if (mod === 'الموظفون') prefix = 'users';
        if (mod === 'التقارير') prefix = 'reports';
        if (mod === 'الإشعارات') prefix = 'notifications';
        if (mod === 'الإعدادات') prefix = 'settings';
        if (mod === 'سجل العمليات') prefix = 'audit_logs';

        return {
          module: mod,
          view: permKeys.includes(`${prefix}.view`) || permKeys.includes(`${prefix}.manage`),
          create: permKeys.includes(`${prefix}.create`) || permKeys.includes(`${prefix}.manage`),
          edit: permKeys.includes(`${prefix}.update`) || permKeys.includes(`${prefix}.manage`),
          delete: permKeys.includes(`${prefix}.delete`) || permKeys.includes(`${prefix}.manage`)
        };
      });

      const extraPermissions = {
        changeStatus: permKeys.includes('requests.change_status'),
        uploadAttachments: permKeys.includes('requests.attachments'),
        exportExcel: permKeys.includes('reports.export'),
        sendNotifications: permKeys.includes('notifications.view') || permKeys.includes('whatsapp.send'),
        manageWhatsapp: permKeys.includes('whatsapp.manage'),
        viewAuditLogs: permKeys.includes('audit_logs.view')
      };

      return {
        id: role.id,
        name: role.name,
        description: role.description || '',
        usersCount: role.users.length,
        permissions: matrix,
        extraPermissions
      };
    });

    return sendSuccess(res, formattedRoles);
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: { select: { id: true } },
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    if (!role) {
      throw new AppError('الدور غير موجود', 404, 'ROLE_NOT_FOUND');
    }

    const permKeys = role.rolePermissions.map((rp) => rp.permission.key);

    const matrix = MODULES_LIST.map((mod) => {
      let prefix = 'requests';
      if (mod === 'المراجعون') prefix = 'customers';
      if (mod === 'الوزارات') prefix = 'ministries';
      if (mod === 'الموظفون') prefix = 'users';
      if (mod === 'التقارير') prefix = 'reports';
      if (mod === 'الإشعارات') prefix = 'notifications';
      if (mod === 'الإعدادات') prefix = 'settings';
      if (mod === 'سجل العمليات') prefix = 'audit_logs';

      return {
        module: mod,
        view: permKeys.includes(`${prefix}.view`) || permKeys.includes(`${prefix}.manage`),
        create: permKeys.includes(`${prefix}.create`) || permKeys.includes(`${prefix}.manage`),
        edit: permKeys.includes(`${prefix}.update`) || permKeys.includes(`${prefix}.manage`),
        delete: permKeys.includes(`${prefix}.delete`) || permKeys.includes(`${prefix}.manage`)
      };
    });

    const extraPermissions = {
      changeStatus: permKeys.includes('requests.change_status'),
      uploadAttachments: permKeys.includes('requests.attachments'),
      exportExcel: permKeys.includes('reports.export'),
      sendNotifications: permKeys.includes('notifications.view') || permKeys.includes('whatsapp.send'),
      manageWhatsapp: permKeys.includes('whatsapp.manage'),
      viewAuditLogs: permKeys.includes('audit_logs.view')
    };

    const formatted = {
      id: role.id,
      name: role.name,
      description: role.description || '',
      usersCount: role.users.length,
      permissions: matrix,
      extraPermissions
    };

    return sendSuccess(res, formatted);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissions, extraPermissions, description } = req.body;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new AppError('الدور غير موجود', 404, 'ROLE_NOT_FOUND');
    }

    // Collect all requested permission keys
    const requestedKeys: string[] = [];

    if (Array.isArray(permissions)) {
      permissions.forEach((p: any) => {
        let prefix = 'requests';
        if (p.module === 'المراجعون') prefix = 'customers';
        if (p.module === 'الوزارات') prefix = 'ministries';
        if (p.module === 'الموظفون') prefix = 'users';
        if (p.module === 'التقارير') prefix = 'reports';
        if (p.module === 'الإشعارات') prefix = 'notifications';
        if (p.module === 'الإعدادات') prefix = 'settings';
        if (p.module === 'سجل العمليات') prefix = 'audit_logs';

        if (p.view) requestedKeys.push(`${prefix}.view`);
        if (p.create) requestedKeys.push(`${prefix}.create`);
        if (p.edit) requestedKeys.push(`${prefix}.update`);
        if (p.delete) requestedKeys.push(`${prefix}.delete`);
      });
    }

    if (extraPermissions) {
      if (extraPermissions.changeStatus) requestedKeys.push('requests.change_status');
      if (extraPermissions.uploadAttachments) requestedKeys.push('requests.attachments');
      if (extraPermissions.exportExcel) requestedKeys.push('reports.export');
      if (extraPermissions.sendNotifications) requestedKeys.push('notifications.view', 'whatsapp.send');
      if (extraPermissions.manageWhatsapp) requestedKeys.push('whatsapp.manage', 'whatsapp.view');
      if (extraPermissions.viewAuditLogs) requestedKeys.push('audit_logs.view');
    }

    const dbPermissions = await prisma.permission.findMany({
      where: { key: { in: requestedKeys } }
    });

    await prisma.$transaction(async (tx) => {
      // Clear existing permissions
      await tx.rolePermission.deleteMany({ where: { roleId: id } });

      // Assign new permissions
      if (dbPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: dbPermissions.map((p) => ({
            roleId: id,
            permissionId: p.id
          }))
        });
      }

      if (description !== undefined) {
        await tx.role.update({
          where: { id },
          data: { description }
        });
      }

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'تعديل إعدادات',
            entity: 'Role',
            entityId: id,
            details: `تحديث مصفوفة صلاحيات الدور: ${role.name}`,
            ipAddress: req.ip
          }
        });
      }
    });

    return sendSuccess(res, null, 'تم تحديث صلاحيات الدور بنجاح');
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, permissions, extraPermissions } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('اسم الدور مطلوب', 400, 'ROLE_NAME_REQUIRED');
    }

    const trimmedName = name.trim();

    const existing = await prisma.role.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } }
    });

    if (existing) {
      throw new AppError(`الدور (${trimmedName}) موجود بالفعل`, 400, 'ROLE_ALREADY_EXISTS');
    }

    // Collect requested permissions
    const requestedKeys: string[] = [];

    if (Array.isArray(permissions)) {
      permissions.forEach((p: any) => {
        let prefix = 'requests';
        if (p.module === 'المراجعون') prefix = 'customers';
        if (p.module === 'الوزارات') prefix = 'ministries';
        if (p.module === 'الموظفون') prefix = 'users';
        if (p.module === 'التقارير') prefix = 'reports';
        if (p.module === 'الإشعارات') prefix = 'notifications';
        if (p.module === 'الإعدادات') prefix = 'settings';
        if (p.module === 'سجل العمليات') prefix = 'audit_logs';

        if (p.view) requestedKeys.push(`${prefix}.view`);
        if (p.create) requestedKeys.push(`${prefix}.create`);
        if (p.edit) requestedKeys.push(`${prefix}.update`);
        if (p.delete) requestedKeys.push(`${prefix}.delete`);
      });
    }

    if (extraPermissions) {
      if (extraPermissions.changeStatus) requestedKeys.push('requests.change_status');
      if (extraPermissions.uploadAttachments) requestedKeys.push('requests.attachments');
      if (extraPermissions.exportExcel) requestedKeys.push('reports.export');
      if (extraPermissions.sendNotifications) requestedKeys.push('notifications.view', 'whatsapp.send');
      if (extraPermissions.manageWhatsapp) requestedKeys.push('whatsapp.manage', 'whatsapp.view');
      if (extraPermissions.viewAuditLogs) requestedKeys.push('audit_logs.view');
    }

    const dbPermissions = await prisma.permission.findMany({
      where: { key: { in: requestedKeys } }
    });

    const newRole = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name: trimmedName,
          description: description?.trim() || ''
        }
      });

      if (dbPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: dbPermissions.map((p) => ({
            roleId: created.id,
            permissionId: p.id
          }))
        });
      }

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'إضافة جديد',
            entity: 'Role',
            entityId: created.id,
            details: `إنشاء دور جديد: ${trimmedName}`,
            ipAddress: req.ip
          }
        });
      }

      return created;
    });

    // Format output
    const matrix = MODULES_LIST.map((mod) => {
      let prefix = 'requests';
      if (mod === 'المراجعون') prefix = 'customers';
      if (mod === 'الوزارات') prefix = 'ministries';
      if (mod === 'الموظفون') prefix = 'users';
      if (mod === 'التقارير') prefix = 'reports';
      if (mod === 'الإشعارات') prefix = 'notifications';
      if (mod === 'الإعدادات') prefix = 'settings';
      if (mod === 'سجل العمليات') prefix = 'audit_logs';

      return {
        module: mod,
        view: requestedKeys.includes(`${prefix}.view`),
        create: requestedKeys.includes(`${prefix}.create`),
        edit: requestedKeys.includes(`${prefix}.update`),
        delete: requestedKeys.includes(`${prefix}.delete`)
      };
    });

    const formatted = {
      id: newRole.id,
      name: newRole.name,
      description: newRole.description || '',
      usersCount: 0,
      permissions: matrix,
      extraPermissions: extraPermissions || {
        changeStatus: false,
        uploadAttachments: false,
        exportExcel: false,
        sendNotifications: false,
        manageWhatsapp: false,
        viewAuditLogs: false
      }
    };

    return sendSuccess(res, formatted, 'تم إنشاء الدور بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { users: { select: { id: true } } }
    });

    if (!role) {
      throw new AppError('الدور غير موجود', 404, 'ROLE_NOT_FOUND');
    }

    if (role.users.length > 0) {
      throw new AppError(
        `لا يمكن حذف هذا الدور لوجود (${role.users.length}) مستخدمين معينين به حالياً`,
        400,
        'ROLE_IN_USE'
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.role.delete({ where: { id } });

      if (req.user) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            action: 'حذف',
            entity: 'Role',
            entityId: id,
            details: `حذف الدور: ${role.name}`,
            ipAddress: req.ip
          }
        });
      }
    });

    return sendSuccess(res, null, 'تم حذف الدور بنجاح');
  } catch (error) {
    next(error);
  }
};