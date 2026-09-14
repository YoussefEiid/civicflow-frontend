import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';

export interface SendOtpOptions {
  email: string;
  otp: string;
  purpose?: 'reset_password' | 'verify_email' | 'account_activation';
  userName?: string;
  expiresInMinutes?: number;
}

export type OtpEmailPurpose = NonNullable<SendOtpOptions['purpose']>;

/**
 * Mask email address for secure production logging
 * Example: "youssef.eid@gmail.com" -> "y***d@gmail.com"
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

/**
 * Clean and format the sender string
 */
const getSenderAddress = (rawFrom?: string, userEmail?: string): string => {
  if (rawFrom && rawFrom.trim()) {
    return rawFrom.trim();
  }
  if (userEmail && userEmail.trim()) {
    return `"منظومة CivicFlow" <${userEmail.trim()}>`;
  }
  return '"منظومة CivicFlow" <no-reply@civicflow.gov>';
};

/**
 * Initializes and caches the Nodemailer transporter for Gmail SMTP
 */
let cachedTransporter: Transporter | null = null;

export const getTransporter = (): Transporter | null => {
  const host = (env.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(env.SMTP_PORT || process.env.SMTP_PORT || 587);
  const user = (env.SMTP_USER || process.env.SMTP_USER || '').trim();
  let pass = (env.SMTP_PASS || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Gmail SMTP port 587 uses STARTTLS (secure: false), port 465 uses SSL/TLS (secure: true)
  const isSecure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: port || 587,
    secure: isSecure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000
  });

  return cachedTransporter;
};

/**
 * Safely verify SMTP connectivity without exposing any secrets
 */
export const verifySmtpConnection = async (): Promise<boolean> => {
  const user = (env.SMTP_USER || process.env.SMTP_USER || '').trim();
  if (!user) {
    console.warn('⚠️ [EMAIL] SMTP configuration is incomplete: SMTP_USER / SMTP_PASS is missing.');
    return false;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('⚠️ [EMAIL] SMTP transporter could not be initialized.');
    return false;
  }

  try {
    console.log(`[EMAIL] SMTP configuration detected: ${env.SMTP_HOST}:${env.SMTP_PORT} (${maskEmail(user)})`);
    await transporter.verify();
    console.log('✅ [EMAIL] SMTP connection verified successfully.');
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [EMAIL] SMTP connection check warning: ${err?.message || 'Verification failed'}`);
    return false;
  }
};

/**
 * Generate professional Arabic RTL CivicFlow email template
 */
export const buildOtpEmailHtml = ({
  otp,
  purpose = 'verify_email',
  userName = 'المستخدم الكريم',
  expiresInMinutes = 5
}: {
  otp: string;
  purpose?: OtpEmailPurpose;
  userName?: string;
  expiresInMinutes?: number;
}): { subject: string; html: string; text: string } => {
  const isReset = purpose === 'reset_password';
  const subject = isReset
    ? 'رمز تعيين كلمة المرور - منظومة CivicFlow'
    : 'رمز التحقق - منظومة CivicFlow';

  const actionText = isReset
    ? 'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منظومة CivicFlow.'
    : 'يرجى استخدام رمز التحقق أدناه لتأكيد وتفعيل بريدك الإلكتروني في منظومة CivicFlow.';

  const text = `منظومة CivicFlow\n\nمرحباً ${userName}،\n${actionText}\n\nرمز التحقق الخاص بك هو:\n${otp}\n\nهذا الرمز صالح لمدة ${expiresInMinutes} دقائق فقط.\nإذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.\n\nتنبيه أمني: لا تشارك هذا الرمز مع أي شخص.`;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; direction: rtl; text-align: right; }
        .wrapper { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .logo-box { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
        .logo-title { color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px; }
        .logo-sub { color: #64748b; font-size: 13px; margin: 0; font-weight: 500; }
        .greeting { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .description { font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 24px; }
        .otp-container { text-align: center; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 900; font-family: 'Courier New', Courier, monospace; letter-spacing: 10px; color: #15803d; margin: 0; }
        .otp-expiry { font-size: 12px; color: #166534; margin-top: 8px; font-weight: 600; }
        .security-notice { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; line-height: 1.6; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="logo-box">
          <h1 class="logo-title">منظومة CivicFlow</h1>
          <p class="logo-sub">${subject}</p>
        </div>
        <p class="greeting">مرحباً ${userName}،</p>
        <p class="description">${actionText}</p>
        
        <div class="otp-container">
          <p class="otp-code">${otp}</p>
          <p class="otp-expiry">⏳ صالح لمدة ${expiresInMinutes} دقائق فقط — لا تشاركه مع أي شخص</p>
        </div>

        <p class="description">إذا لم تكن أنت من قام بهذا الطلب، يُرجى تجاهل هذه الرسالة أو إبلاغ المشرف فوراً لحماية حسابك.</p>
        
        <div class="security-notice">
          <strong>تنبيه أمني:</strong> لا تشارك رمز التحقق هذا مع أي شخص إطلاقاً. فريق الدعم في CivicFlow لن يطلب منك رمز التحقق الخاص بك أبداً.
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} CivicFlow. جميع الحقوق محفوظة.
      </div>
    </body>
    </html>
  `;

  return { subject, html, text };
};

/**
 * Sends a real OTP email.
 * Priority:
 * 1. Gmail SMTP (Nodemailer via Port 587/465)
 * 2. HTTP HTTPS APIs (Resend / Brevo / Google Apps Script Relay) as safe fallback on restricted networks.
 */
export const sendOTPEmail = async ({
  email,
  otp,
  purpose = 'verify_email',
  userName = 'المستخدم الكريم',
  expiresInMinutes = 5
}: SendOtpOptions): Promise<{ success: boolean; messageId: string }> => {
  const masked = maskEmail(email);
  const { subject, html, text } = buildOtpEmailHtml({ otp, purpose, userName, expiresInMinutes });

  console.log(`[EMAIL] Sending OTP email to user (${masked})`);

  let lastError: any = null;

  // 1. Primary: Direct Gmail SMTP
  const transporter = getTransporter();
  const smtpUser = (env.SMTP_USER || process.env.SMTP_USER || '').trim();

  if (transporter && smtpUser) {
    try {
      const sender = getSenderAddress(env.SMTP_FROM || process.env.SMTP_FROM, smtpUser);
      const info = await transporter.sendMail({
        from: sender,
        to: email,
        subject,
        text,
        html
      });

      console.log(`[EMAIL] OTP email sent successfully via SMTP (${masked})`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr: any) {
      lastError = smtpErr;
      console.warn(`⚠️ [EMAIL] SMTP dispatch failed for (${masked}): ${smtpErr?.message || 'SMTP error'}`);
    }
  }

  // 2. Secondary Fallback: Resend HTTPS API (Port 443)
  const resendApiKey = (process.env.RESEND_API_KEY || (env as any).RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      console.log(`[EMAIL] Attempting dispatch via Resend API (${masked})`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.SMTP_FROM || 'CivicFlow <onboarding@resend.dev>',
          to: [email],
          subject,
          html,
          text
        })
      });
      const data: any = await res.json();
      if (res.ok && data?.id) {
        console.log(`[EMAIL] OTP email sent successfully via Resend API (${masked})`);
        return { success: true, messageId: data.id };
      }
      console.warn('⚠️ [EMAIL] Resend API response error:', data?.message || data);
    } catch (apiErr: any) {
      lastError = apiErr;
      console.warn(`⚠️ [EMAIL] Resend API error for (${masked}): ${apiErr?.message || apiErr}`);
    }
  }

  // 3. Secondary Fallback: Brevo HTTPS API (Port 443)
  const brevoApiKey = (process.env.BREVO_API_KEY || (env as any).BREVO_API_KEY || '').trim();
  if (brevoApiKey) {
    try {
      const senderEmail = (process.env.BREVO_SENDER_EMAIL || env.SMTP_USER || process.env.SMTP_USER || 'no-reply@civicflow.gov').trim();
      console.log(`[EMAIL] Attempting dispatch via Brevo API (${masked})`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'منظومة CivicFlow', email: senderEmail },
          to: [{ email }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      const data: any = await res.json();
      if (res.ok && data?.messageId) {
        console.log(`[EMAIL] OTP email sent successfully via Brevo API (${masked})`);
        return { success: true, messageId: data.messageId };
      }
      console.warn('⚠️ [EMAIL] Brevo API response error:', data);
    } catch (brevoErr: any) {
      lastError = brevoErr;
      console.warn(`⚠️ [EMAIL] Brevo API error for (${masked}): ${brevoErr?.message || brevoErr}`);
    }
  }

  // 4. Secondary Fallback: Google Apps Script Webhook Relay (Port 443)
  const webhookUrl = (process.env.GMAIL_WEBHOOK_URL || (env as any).GMAIL_WEBHOOK_URL || '').trim();
  if (webhookUrl) {
    try {
      console.log(`[EMAIL] Attempting dispatch via Google Webhook Relay (${masked})`);
      const res = await fetch(webhookUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject,
          text,
          html
        })
      });
      if (res.ok || res.status === 200 || res.status === 302) {
        console.log(`[EMAIL] OTP email sent successfully via Webhook Relay (${masked})`);
        return { success: true, messageId: `webhook-${Date.now()}` };
      }
    } catch (whErr: any) {
      lastError = whErr;
      console.warn(`⚠️ [EMAIL] Webhook Relay error for (${masked}): ${whErr?.message || whErr}`);
    }
  }

  // If all channels failed
  console.error(`❌ [EMAIL] All email dispatch channels failed for user (${masked})`);
  if (!transporter && !resendApiKey && !brevoApiKey && !webhookUrl) {
    throw new AppError('خدمة إرسال البريد الإلكتروني غير مهيأة بالشكل الصحيح في الخادم', 500, 'SMTP_CONFIG_ERROR');
  }

  throw new AppError(
    'تعذر إرسال رسالة البريد الإلكتروني المحتوية على رمز التحقق، يرجى التحقق من صحة البريد والمحاولة لاحقاً',
    500,
    'EMAIL_SEND_FAILED'
  );
};

// Backward-compatible alias
export const sendOtpEmail = sendOTPEmail;
