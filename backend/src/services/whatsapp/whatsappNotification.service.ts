import { whatsAppProvider } from './index.js';
import { env } from '../../config/env.js';

const getBaseTrackingUrl = (): string => {
  const frontUrl = env.FRONTEND_URL || 'https://civicflow-frontend-4.onrender.com';
  return frontUrl.replace(/\/+$/, '');
};

export const whatsappNotificationService = {
  /**
   * إرسال رسالة ترحيب وتأكيد استلام الطلب مع رقم المعاملة ورابط التتبع
   */
  sendRequestReceivedWhatsApp: async (params: {
    to: string;
    customerName: string;
    requestNumber: string;
    ministryName: string;
    expectedDate?: string;
    requestId?: string;
  }) => {
    if (!params.to) return;
    try {
      const trackingUrl = `${getBaseTrackingUrl()}/track/${params.requestNumber}`;
      const message = [
        `مرحباً بك عزيزي المراجع ${params.customerName}،`,
        `تم استلام طلبكم وقيده في منظومة CivicFlow بنجاح.`,
        `📋 رقم المعاملة: ${params.requestNumber}`,
        `🏛️ الجهة المعنية: ${params.ministryName}`,
        params.expectedDate ? `📅 تاريخ الإنجاز المتوقع: ${params.expectedDate}` : '',
        `🔗 لمتابعة حالة المعاملة لحظة بلحظة:`,
        `${trackingUrl}`
      ]
        .filter(Boolean)
        .join('\n');

      return await whatsAppProvider.sendMessage({
        to: params.to,
        message,
        templateKey: 'request_received',
        requestId: params.requestId
      });
    } catch (err) {
      console.warn('⚠️ WhatsApp request received notification skipped:', err);
    }
  },

  /**
   * إرسال إشعار تحديث حالة المعاملة
   */
  sendStatusChangeWhatsApp: async (params: {
    to: string;
    customerName: string;
    requestNumber: string;
    ministryName: string;
    newStatus: string;
    note?: string | null;
    requestId?: string;
  }) => {
    if (!params.to) return;
    try {
      const trackingUrl = `${getBaseTrackingUrl()}/track/${params.requestNumber}`;
      const message = [
        `عزيزي المراجع ${params.customerName}،`,
        `نود إحاطتكم بتحديث جديد على معاملتكم رقم ${params.requestNumber} لدى ${params.ministryName}:`,
        `🔄 الحالة الحالية: ${params.newStatus}`,
        params.note ? `📝 ملاحظات: ${params.note}` : '',
        `🔗 للاطلاع على المستندات ومسار المعاملة:`,
        `${trackingUrl}`
      ]
        .filter(Boolean)
        .join('\n');

      return await whatsAppProvider.sendMessage({
        to: params.to,
        message,
        templateKey: 'status_updated',
        requestId: params.requestId
      });
    } catch (err) {
      console.warn('⚠️ WhatsApp status update notification skipped:', err);
    }
  },

  /**
   * إرسال إشعار صدور الإجابة والقرار النهائي
   */
  sendFinalResponseWhatsApp: async (params: {
    to: string;
    customerName: string;
    requestNumber: string;
    ministryName: string;
    decision: string;
    summary?: string;
    requestId?: string;
  }) => {
    if (!params.to) return;
    try {
      const trackingUrl = `${getBaseTrackingUrl()}/track/${params.requestNumber}`;
      const message = [
        `عزيزي المراجع ${params.customerName}،`,
        `يسعدنا إبلاغكم بصدور الإجابة والقرار النهائي لمعاملتكم رقم ${params.requestNumber}:`,
        `📜 القرار: ${params.decision}`,
        params.summary ? `📄 الملخص: ${params.summary}` : '',
        `🔗 لتحميل الوثيقة الرسمية المعتمدة:`,
        `${trackingUrl}`
      ]
        .filter(Boolean)
        .join('\n');

      return await whatsAppProvider.sendMessage({
        to: params.to,
        message,
        templateKey: 'final_response_ready',
        requestId: params.requestId
      });
    } catch (err) {
      console.warn('⚠️ WhatsApp final response notification skipped:', err);
    }
  },

  /**
   * إرسال رمز التحقق (OTP) عبر واتساب
   */
  sendOtpWhatsApp: async (params: {
    to: string;
    userName: string;
    otp: string;
    purpose: 'verify_email' | 'reset_password' | 'account_activation';
    expiresInMinutes?: number;
  }) => {
    if (!params.to) return { success: false };
    try {
      const isReset = params.purpose === 'reset_password';
      const actionTitle = isReset ? 'استعادة وتعيين كلمة المرور' : 'تأكيد وتفعيل الحساب';
      const message = [
        `🔒 *منظومة CivicFlow - رمز التحقق (OTP)*`,
        `مرحباً بك ${params.userName || 'عزيزنا المستخدم'}،`,
        `طلبكم لـ: *${actionTitle}*`,
        ``,
        `🔑 رمز التحقق الخاص بك هو: *${params.otp}*`,
        `⏳ الرمز صالح لمدة ${params.expiresInMinutes || 10} دقائق فقط.`,
        ``,
        `⚠️ تنبيه أمني: لا تشارك هذا الرمز مع أي شخص لحماية حسابك.`
      ].join('\n');

      return await whatsAppProvider.sendMessage({
        to: params.to,
        message,
        templateKey: 'otp_verification'
      });
    } catch (err) {
      console.warn('⚠️ WhatsApp OTP notification skipped:', err);
      return { success: false };
    }
  }
};

