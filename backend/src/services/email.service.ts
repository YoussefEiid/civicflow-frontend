import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';

interface SendOtpOptions {
  email: string;
  otp: string;
  purpose: 'reset_password' | 'verify_email' | 'account_activation';
  userName?: string;
  expiresInMinutes?: number;
}

export type OtpEmailPurpose = SendOtpOptions['purpose'];

const sanitizeSender = (rawFrom?: string, fallbackUser?: string): string => {
  const defaultSender = fallbackUser ? `"منظومة CivicFlow" <${fallbackUser}>` : '"منظومة CivicFlow" <no-reply@civicflow.gov>';
  if (!rawFrom) return defaultSender;

  const emailMatch = rawFrom.match(/<([^>]+)>/) || rawFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    const email = emailMatch[1] || emailMatch[0];
    return `"منظومة CivicFlow" <${email}>`;
  }

  return defaultSender;
};

const getTransporter = () => {
  const host = (env.SMTP_HOST || process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const port = Number(env.SMTP_PORT || process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = (env.SMTP_USER || process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || 'baszmat3@gmail.com').trim();
  let pass = (env.SMTP_PASS || process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || 'hquozwytjyfvmoni').trim();

  // Strip spaces from Google App Password (e.g. "hquo zwyt jyfv moni" -> "hquozwytjyfvmoni")
  if (pass) {
    pass = pass.replace(/\s+/g, '');
  }

  if (user && pass) {
    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: port || 587,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 6000
    });
  }

  return null;
};

export const sendOtpEmail = async ({
  email,
  otp,
  purpose,
  userName = 'المستخدم الكريم',
  expiresInMinutes = 10
}: SendOtpOptions): Promise<{ success: boolean; messageId: string }> => {
  const isReset = purpose === 'reset_password';
  const title = isReset ? 'رمز استعادة وتعيين كلمة المرور' : 'رمز تأكيد البريد الإلكتروني';
  const actionText = isReset
    ? 'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منظومة CivicFlow.'
    : 'يرجى استخدام رمز التحقق أدناه لتأكيد وتفعيل بريدك الإلكتروني في منظومة CivicFlow.';

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; direction: rtl; text-align: right; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
        .title { color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 6px 0; }
        .subtitle { color: #64748b; font-size: 13px; margin: 0; }
        .body-text { font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 20px; }
        .otp-box { text-align: center; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 16px; padding: 20px; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 900; font-family: monospace; letter-spacing: 8px; color: #15803d; margin: 0; }
        .otp-expiry { font-size: 12px; color: #166534; margin-top: 8px; font-weight: 600; }
        .warning { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; line-height: 1.6; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">منظومة CivicFlow</h1>
          <p class="subtitle">${title}</p>
        </div>
        <p class="body-text">مرحباً <strong>${userName}</strong>،</p>
        <p class="body-text">${actionText}</p>
        
        <div class="otp-box">
          <p class="otp-code">${otp}</p>
          <p class="otp-expiry">⏳ صالح لمدة ${expiresInMinutes} دقيقة فقط — لا تشاركه مع أي شخص</p>
        </div>

        <p class="body-text">إذا لم تكن أنت من قام بهذا الطلب، يُرجى تجاهل هذه الرسالة أو إبلاغ المشرف فوراً لحماية حسابك.</p>
        
        <div class="warning">
          <strong>ملاحظة أمنية:</strong> لا تشارك رمز التحقق هذا مع أي شخص إطلاقاً. فريق الدعم في CivicFlow لن يطلب منك رمز التحقق الخاص بك.
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} CivicFlow Request Management System. جميع الحقوق محفوظة.
      </div>
    </body>
    </html>
  `;

  const resendApiKey = (process.env.RESEND_API_KEY || (env as any).RESEND_API_KEY || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || (env as any).BREVO_API_KEY || '').trim();

  // 1. Try Resend HTTP API (Port 443 HTTPS - Never blocked by Cloud Providers)
  if (resendApiKey) {
    try {
      console.log(`📡 [HTTP EMAIL DISPATCH] Dispatching OTP via Resend API to: ${email}`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.SMTP_FROM || 'CivicFlow <onboarding@resend.dev>',
          to: [email],
          subject: `[CivicFlow] ${title}: ${otp}`,
          html: htmlContent
        })
      });
      const data: any = await res.json();
      if (res.ok && data?.id) {
        console.log(`✅ [RESEND SUCCESS] OTP email dispatched via Resend API. ID: ${data.id}`);
        return { success: true, messageId: data.id };
      }
      console.warn('⚠️ [RESEND WARNING] Resend API returned non-200:', data);
    } catch (apiErr) {
      console.warn('⚠️ [RESEND ERROR] Failed sending via Resend API, falling back to SMTP:', apiErr);
    }
  }

  // 2. Try Brevo HTTP API (Port 443 HTTPS)
  if (brevoApiKey) {
    try {
      console.log(`📡 [HTTP EMAIL DISPATCH] Dispatching OTP via Brevo API to: ${email}`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'منظومة CivicFlow', email: 'baszmat3@gmail.com' },
          to: [{ email }],
          subject: `[CivicFlow] ${title}: ${otp}`,
          htmlContent: htmlContent
        })
      });
      const data: any = await res.json();
      if (res.ok && data?.messageId) {
        console.log(`✅ [BREVO SUCCESS] OTP email dispatched via Brevo API. ID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      }
      console.warn('⚠️ [BREVO WARNING] Brevo API returned error:', data);
    } catch (brevoErr) {
      console.warn('⚠️ [BREVO ERROR] Failed sending via Brevo API, falling back to SMTP:', brevoErr);
    }
  }

  // 3. Try Webhook / Google Script Relay (Port 443 HTTPS)
  const webhookUrl = (process.env.GMAIL_WEBHOOK_URL || (env as any).GMAIL_WEBHOOK_URL || '').trim();
  if (webhookUrl) {
    try {
      console.log(`📡 [HTTP WEBHOOK DISPATCH] Dispatching OTP via Webhook to: ${email}`);
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `[CivicFlow] ${title}: ${otp}`,
          text: `رمز التحقق الخاص بك في منظومة CivicFlow هو: ${otp} (صالح لمدة ${expiresInMinutes} دقيقة)`,
          html: htmlContent
        })
      });
      if (res.ok) {
        console.log(`✅ [WEBHOOK SUCCESS] OTP email dispatched via Webhook.`);
        return { success: true, messageId: `webhook-${Date.now()}` };
      }
    } catch (whErr) {
      console.warn('⚠️ [WEBHOOK ERROR] Webhook dispatch failed:', whErr);
    }
  }

  // 4. Fallback to Standard SMTP Transport
  const user = (env.SMTP_USER || process.env.SMTP_USER || process.env.EMAIL_USER || 'baszmat3@gmail.com').trim();
  const transporter = getTransporter();

  if (!transporter) {
    console.error('[EMAIL SERVICE ERROR] SMTP Transporter could not be initialized.');
    throw new AppError('خدمة إرسال البريد الإلكتروني غير مهيأة بالشكل الصحيح في الخادم', 500, 'SMTP_CONFIG_ERROR');
  }

  try {
    const sender = sanitizeSender(env.SMTP_FROM || process.env.SMTP_FROM, user);
    console.log(`📡 [EMAIL DISPATCH] Dispatching OTP email to: ${email}`);
    const info = await transporter.sendMail({
      from: sender,
      to: email,
      subject: `[CivicFlow] ${title}: ${otp}`,
      text: `رمز التحقق الخاص بك في منظومة CivicFlow هو: ${otp} (صالح لمدة ${expiresInMinutes} دقيقة)`,
      html: htmlContent
    });
    console.log(`✅ [EMAIL SUCCESS] Real OTP email dispatched successfully. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`❌ [EMAIL SERVICE ERROR] Failed to send email to ${email}:`, err?.message || err);
    throw new AppError('تعذر إرسال رسالة البريد الإلكتروني المحتوية على رمز التحقق، يرجى المحاولة لاحقاً', 500, 'EMAIL_SEND_FAILED');
  }
};
