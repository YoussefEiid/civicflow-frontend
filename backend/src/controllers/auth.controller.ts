import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken
} from '../utils/token.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

// Schemas
const loginSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يتكون من حرفين على الأقل').optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  avatarUrl: z.string().url('رابط الصورة غير صالح').optional().or(z.literal(''))
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('تم تعطيل هذا الحساب. يرجى التواصل مع إدارة النظام', 403, 'ACCOUNT_INACTIVE');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Persist refresh token in database (7 days expiry)
    const tokenHashStr = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenHashStr,
        expiresAt
      }
    });

    // Log Activity
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userRole: user.role.name,
        action: 'تسجيل دخول',
        entity: 'User',
        entityId: user.id,
        details: `تسجيل دخول ناجح للمستخدم (${user.name})`,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    // Set Refresh Token as HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.key);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      roleId: user.roleId,
      role: user.role.name,
      department: user.department || '',
      status: user.status === 'ACTIVE' ? 'نشط' : 'غير نشط',
      lastLogin: user.lastLogin ? user.lastLogin.toISOString().replace('T', ' ').substring(0, 16) : 'الآن',
      avatarUrl: user.avatarUrl || undefined,
      assignedRequestsCount: 0,
      permissions
    };

    return sendSuccess(
      res,
      {
        user: safeUser,
        accessToken,
        permissions
      },
      'تم تسجيل الدخول بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingToken) {
      throw new AppError('رمز التحديث (Refresh Token) مطلوب', 401, 'MISSING_REFRESH_TOKEN');
    }

    let payload;
    try {
      payload = verifyRefreshToken(incomingToken);
    } catch (err) {
      throw new AppError('رمز التحديث منتهي الصلاحية أو غير صالح', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokenHashStr = hashToken(incomingToken);

    // Look up token in DB
    const savedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: tokenHashStr,
        userId: payload.userId,
        expiresAt: { gt: new Date() }
      }
    });

    if (!savedToken) {
      throw new AppError('رمز التحديث غير مسجل أو تم إلغاؤه مسبقاً', 401, 'REVOKED_REFRESH_TOKEN');
    }

    // Token rotation: delete old token
    await prisma.refreshToken.delete({ where: { id: savedToken.id } });

    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('المستخدم غير موجود أو تم تعطيل الحساب', 403, 'USER_INACTIVE');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Save new refresh token
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: newExpiresAt
      }
    });

    // Set new cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.key);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      roleId: user.roleId,
      role: user.role.name,
      department: user.department || '',
      status: user.status === 'ACTIVE' ? 'نشط' : 'غير نشط',
      lastLogin: user.lastLogin ? user.lastLogin.toISOString().replace('T', ' ').substring(0, 16) : 'الآن',
      avatarUrl: user.avatarUrl || undefined,
      assignedRequestsCount: 0,
      permissions
    };

    return sendSuccess(
      res,
      {
        user: safeUser,
        accessToken: newAccessToken,
        permissions
      },
      'تم تجديد رمز الجلسة بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (incomingToken) {
      const tokenHashStr = hashToken(incomingToken);
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: tokenHashStr }
      });
    }

    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'تم تسجيل الخروج بنجاح');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        assignedRequests: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.key);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      roleId: user.roleId,
      role: user.role.name,
      department: user.department || '',
      status: user.status === 'ACTIVE' ? 'نشط' : 'غير نشط',
      lastLogin: user.lastLogin ? user.lastLogin.toISOString().replace('T', ' ').substring(0, 16) : 'الآن',
      avatarUrl: user.avatarUrl || undefined,
      assignedRequestsCount: user.assignedRequests.length,
      permissions
    };

    return sendSuccess(res, { user: safeUser, permissions });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED');
    }

    const data = updateProfileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null })
      },
      include: {
        role: true
      }
    });

    const safeUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone || '',
      roleId: updated.roleId,
      role: updated.role.name,
      department: updated.department || '',
      status: updated.status === 'ACTIVE' ? 'نشط' : 'غير نشط',
      avatarUrl: updated.avatarUrl || undefined
    };

    return sendSuccess(res, { user: safeUser }, 'تم تحديث الملف الشخصي بنجاح');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED');
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('كلمة المرور الحالية غير صحيحة', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    // Revoke all existing refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    return sendSuccess(res, null, 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مجدداً');
  } catch (error) {
    next(error);
  }
};

import { sendOtpEmail } from '../services/email.service.js';

// --- In-Memory OTP Store with 15-Minute Expiry ---
interface OTPRecord {
  otp: string;
  expiresAt: number;
}
const otpStore = new Map<string, OTPRecord>();

const forgotPasswordOtpSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة')
});

const verifyResetOtpSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  otp: z.string().min(4, 'رمز التحقق مطلوب')
});

const resetPasswordOtpSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  otp: z.string().min(4, 'رمز التحقق مطلوب'),
  newPassword: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
});

export const requestPasswordResetOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordOtpSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });

    if (!user) {
      throw new AppError('لا يوجد حساب مسجل بهذا البريد الإلكتروني', 404, 'USER_NOT_FOUND');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    // Send real email via SMTP / Email Service
    await sendOtpEmail({
      email: normalizedEmail,
      otp,
      purpose: 'reset_password',
      userName: user.name
    });

    return sendSuccess(
      res,
      {
        email: normalizedEmail
      },
      'تم إرسال رمز التحقق (OTP) بنجاح إلى بريدك الإلكتروني.'
    );
  } catch (error) {
    next(error);
  }
};

export const verifyResetOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = verifyResetOtpSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const record = otpStore.get(normalizedEmail);
    if (!record) {
      throw new AppError('لم يتم طلب رمز تحقق لهذا البريد أو انتهت صلاحيته', 400, 'OTP_EXPIRED');
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      throw new AppError('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد', 400, 'OTP_EXPIRED');
    }

    if (record.otp !== otp.trim()) {
      throw new AppError('رمز التحقق غير صحيح', 400, 'INVALID_OTP');
    }

    return sendSuccess(res, { verified: true }, 'رمز التحقق صحيح');
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = resetPasswordOtpSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const record = otpStore.get(normalizedEmail);
    if (!record || Date.now() > record.expiresAt || record.otp !== otp.trim()) {
      throw new AppError('رمز التحقق غير صالح أو انتهت صلاحيته', 400, 'INVALID_OTP');
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    // Delete OTP once used
    otpStore.delete(normalizedEmail);

    // Revoke all existing sessions
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userRole: 'User',
        action: 'استعادة كلمة المرور',
        entity: 'User',
        entityId: user.id,
        details: `تم إعادة تعيين كلمة المرور بنجاح عبر رمز التحقق (OTP) للمستخدم (${user.email})`,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    return sendSuccess(res, null, 'تم تعيين كلمة المرور الجديدة بنجاح. يمكنك الآن تسجيل الدخول');
  } catch (error) {
    next(error);
  }
};

export const sendVerificationOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let targetEmail = '';
    let targetName = 'المستخدم الكريم';

    if (req.body?.email) {
      targetEmail = req.body.email.trim().toLowerCase();
    } else if (req.user?.email) {
      targetEmail = req.user.email.toLowerCase();
      targetName = req.user.name;
    }

    if (!targetEmail) {
      throw new AppError('البريد الإلكتروني مطلوب لإرسال رمز التحقق', 400, 'EMAIL_REQUIRED');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(`verify_${targetEmail}`, {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    // Send real email via SMTP / Email Service
    await sendOtpEmail({
      email: targetEmail,
      otp,
      purpose: 'verify_email',
      userName: targetName
    });

    return sendSuccess(
      res,
      {
        email: targetEmail
      },
      'تم إرسال رمز التحقق لتأكيد الحساب بنجاح إلى بريدك الإلكتروني.'
    );
  } catch (error) {
    next(error);
  }
};

export const verifyEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = verifyResetOtpSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const record = otpStore.get(`verify_${normalizedEmail}`) || otpStore.get(normalizedEmail);
    if (!record) {
      throw new AppError('لم يتم طلب رمز تحقق لهذا البريد أو انتهت صلاحيته', 400, 'OTP_EXPIRED');
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(`verify_${normalizedEmail}`);
      throw new AppError('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد', 400, 'OTP_EXPIRED');
    }

    if (record.otp !== otp.trim()) {
      throw new AppError('رمز التحقق غير صحيح', 400, 'INVALID_OTP');
    }

    // Clean up
    otpStore.delete(`verify_${normalizedEmail}`);
    otpStore.delete(normalizedEmail);

    return sendSuccess(
      res,
      { email: normalizedEmail, verified: true },
      'تم التحقق من البريد الإلكتروني وتأكيد الحساب بنجاح!'
    );
  } catch (error) {
    next(error);
  }
};