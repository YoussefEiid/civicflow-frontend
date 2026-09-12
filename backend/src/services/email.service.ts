import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

interface SendOtpOptions {
  email: string;
  otp: string;
  purpose: 'reset_password' | 'verify_email' | 'account_activation';
  userName?: string;
}

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
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || '').trim();
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || '').trim();
  let pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();

  // Strip spaces from Google App Password (e.g. "hquo zwyt jyfv moni" -> "hquozwytjyfvmoni")
  if (pass) {
    pass = pass.replace(/\s+/g, '');
  }

  if (user && pass) {
    // If Gmail host or gmail address, use optimized Gmail service
    if (host.includes('gmail') || user.includes('@gmail.com') || host === 'smtp.gmail.com') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
  }

  return null;
};

export const sendOtpEmail = async ({
  email,
  otp,
  purpose,
  userName = 'المستخدم الكريم'
}: SendOtpOptions): Promise<{ success: boolean; mode: 'smtp' | 'dev' }> => {
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
          <p class="otp-expiry">⏳ صالح لمدة 15 دقيقة فقط</p>
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

  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || '').trim();
  const transporter = getTransporter();

  if (transporter) {
    try {
      const sender = sanitizeSender(process.env.SMTP_FROM || process.env.EMAIL_FROM, user);
      await transporter.sendMail({
        from: sender,
        to: email,
        subject: `[CivicFlow] ${title}: ${otp}`,
        text: `رمز التحقق الخاص بك هو: ${otp} (صالح لمدة 15 دقيقة)`,
        html: htmlContent
      });
      console.log(`[EMAIL SERVICE] OTP successfully dispatched to ${email} via SMTP.`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[EMAIL SERVICE ERROR] Failed to send email via SMTP:`, err);
    }
  }

  // Fallback to console logging when SMTP is not yet set up
  console.log('================================================================');
  console.log(`[CIVICFLOW OTP DISPATCH] To: ${email}`);
  console.log(`[CIVICFLOW OTP CODE]     ==> ${otp} <==`);
  console.log(`[CIVICFLOW PURPOSE]      ${purpose}`);
  console.log('================================================================');

  return { success: true, mode: 'dev' };
};
