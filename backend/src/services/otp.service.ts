import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendOtpEmail, OtpEmailPurpose } from './email.service.js';

export type OtpPurpose = 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'ACCOUNT_ACTIVATION';

interface OtpConfig {
  length: number;
  ttlMs: number;
  maxAttempts: number;
  lockMs: number;
  resendCooldownMs: number;
  bcryptRounds: number;
}

export const OTP_CONFIG: OtpConfig = {
  length: env.OTP_LENGTH,
  ttlMs: env.OTP_TTL_MINUTES * 60 * 1000,
  maxAttempts: env.OTP_MAX_ATTEMPTS,
  lockMs: env.OTP_LOCK_MINUTES * 60 * 1000,
  resendCooldownMs: env.OTP_RESEND_COOLDOWN_SECONDS * 1000,
  bcryptRounds: env.OTP_BCRYPT_ROUNDS
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Cryptographically secure 6-digit OTP using the CSPRNG (crypto.randomInt).
 * Never use Math.random() for OTPs — it is predictable and not security-grade.
 */
export const generateOtp = (length: number = OTP_CONFIG.length): string => {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return crypto.randomInt(min, max).toString();
};

export const hashOtp = async (otp: string): Promise<string> =>
  bcrypt.hash(otp, OTP_CONFIG.bcryptRounds);

export const compareOtp = async (otp: string, otpHash: string): Promise<boolean> =>
  bcrypt.compare(otp, otpHash);

export const purposeToEmail = (purpose: OtpPurpose): OtpEmailPurpose => {
  switch (purpose) {
    case 'RESET_PASSWORD':
      return 'reset_password';
    case 'ACCOUNT_ACTIVATION':
      return 'account_activation';
    default:
      return 'verify_email';
  }
};

interface IssueOtpInput {
  email: string;
  purpose: OtpPurpose;
  userId?: string | null;
  userName?: string | null;
}

interface IssuedOtp {
  otp: string;
  email: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  cooldownSeconds: number;
}

const otpNotFoundError = () =>
  new AppError('رمز التحقق غير صالح أو لم يتم طلبه بعد', 400, 'INVALID_OTP');

const otpExpiredError = () =>
  new AppError('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد', 400, 'OTP_EXPIRED');

const otpLockedError = (retryAfterSeconds: number) =>
  new AppError(
    `تم تجاوز الحد الأقصى من المحاولات الخاطئة. تم قفل التحقق مؤقتاً، يمكنك المحاولة بعد ${Math.ceil(retryAfterSeconds / 60)} دقيقة`,
    429,
    'OTP_LOCKED',
    { retryAfterSeconds }
  );

/**
 * Generates a fresh OTP, hashes it, invalidates any previously active OTP
 * for the same email+purpose (upsert on the unique key), and dispatches it by email.
 * Does NOT enforce the resend cooldown (see resendOtp for that).
 */
export const issueOtp = async ({
  email,
  purpose,
  userId = null,
  userName = null
}: IssueOtpInput): Promise<IssuedOtp> => {
  const normalizedEmail = normalizeEmail(email);
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_CONFIG.ttlMs);

  // Upsert: replaces any previous active OTP for this email+purpose.
  // This implements the "invalidate previous unused OTPs" security requirement.
  await prisma.otpVerification.upsert({
    where: { email_purpose: { email: normalizedEmail, purpose } },
    create: {
      email: normalizedEmail,
      purpose,
      otpHash,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      isUsed: false,
      lockedUntil: null,
      userId: userId ?? null
    },
    update: {
      otpHash,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      isUsed: false,
      lockedUntil: null,
      userId: userId ?? null
    }
  });

  await sendOtpEmail({
    email: normalizedEmail,
    otp,
    purpose: purposeToEmail(purpose),
    userName: userName || 'المستخدم الكريم',
    expiresInMinutes: env.OTP_TTL_MINUTES
  });

  return {
    otp,
    email: normalizedEmail,
    purpose,
    expiresAt,
    cooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS
  };
};

/**
 * Enforces the resend cooldown (min interval between send requests), then issues a new OTP.
 */
export const resendOtp = async (input: IssueOtpInput): Promise<IssuedOtp> => {
  const normalizedEmail = normalizeEmail(input.email);
  const existing = await prisma.otpVerification.findUnique({
    where: { email_purpose: { email: normalizedEmail, purpose: input.purpose } }
  });

  const now = Date.now();

  if (existing) {
    const cooldownReachedAt = existing.lastSentAt.getTime() + OTP_CONFIG.resendCooldownMs;
    if (now < cooldownReachedAt && !existing.isUsed) {
      const remainingSeconds = Math.ceil((cooldownReachedAt - now) / 1000);
      throw new AppError(
        `يرجى الانتظار ${remainingSeconds} ثانية قبل طلب رمز جديد`,
        429,
        'OTP_COOLDOWN',
        { retryAfterSeconds: remainingSeconds }
      );
    }
  }

  return issueOtp(input);
};

const loadActiveRecord = async (email: string, purpose: OtpPurpose) => {
  const record = await prisma.otpVerification.findUnique({
    where: { email_purpose: { email, purpose } }
  });

  if (!record || record.isUsed) {
    throw otpNotFoundError();
  }

  const now = Date.now();

  // Temporary lockout after repeated failed attempts
  if (record.lockedUntil && now < record.lockedUntil.getTime()) {
    const remainingMs = record.lockedUntil.getTime() - now;
    throw otpLockedError(Math.ceil(remainingMs / 1000));
  }

  if (now > record.expiresAt.getTime()) {
    throw otpExpiredError();
  }

  return record;
};

const recordFailedAttempt = async (recordId: string, attempts: number) => {
  const nextAttempts = attempts + 1;

  if (nextAttempts >= OTP_CONFIG.maxAttempts) {
    const lockedUntil = new Date(Date.now() + OTP_CONFIG.lockMs);
    await prisma.otpVerification.update({
      where: { id: recordId },
      data: { attempts: nextAttempts, lockedUntil }
    });
    throw otpLockedError(OTP_CONFIG.lockMs / 1000);
  }

  await prisma.otpVerification.update({
    where: { id: recordId },
    data: { attempts: nextAttempts }
  });

  throw new AppError(
    `رمز التحقق غير صحيح. لديك ${OTP_CONFIG.maxAttempts - nextAttempts} محاولات متبقية`,
    401,
    'INVALID_OTP',
    { attemptsRemaining: OTP_CONFIG.maxAttempts - nextAttempts }
  );
};

interface VerifyOtpInput {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  markUsed: boolean;
}

/**
 * Core verification logic shared by all OTP flows.
 * - Checks existence, single-use, expiry, temporary lockout.
 * - Increments the attempt counter on wrong codes; locks after OTP_MAX_ATTEMPTS.
 * - When markUsed is true, consumes the OTP (single-use policy) and marks the
 *   linked user email as verified when the purpose is VERIFY_EMAIL.
 */
export const verifyOtp = async ({
  email,
  otp,
  purpose,
  markUsed
}: VerifyOtpInput): Promise<{ email: string; purpose: OtpPurpose; userId: string | null }> => {
  const normalizedEmail = normalizeEmail(email);
  const record = await loadActiveRecord(normalizedEmail, purpose);
  const trimmedOtp = otp.trim();

  if (record.attempts >= OTP_CONFIG.maxAttempts) {
    const lockedUntil = record.lockedUntil || new Date(Date.now() + OTP_CONFIG.lockMs);
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { lockedUntil }
    });
    throw otpLockedError(OTP_CONFIG.lockMs / 1000);
  }

  const isMatch = await compareOtp(trimmedOtp, record.otpHash);

  if (!isMatch) {
    await recordFailedAttempt(record.id, record.attempts);
  }

  if (markUsed) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { isUsed: true, attempts: 0 }
    });

    if (purpose === 'VERIFY_EMAIL' && record.userId) {
      await prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true }
      });
    }
  }

  return { email: normalizedEmail, purpose, userId: record.userId };
};