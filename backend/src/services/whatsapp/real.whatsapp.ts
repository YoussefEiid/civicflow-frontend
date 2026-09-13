import { IWhatsAppProvider, SendWhatsAppOptions, SendWhatsAppResult } from './whatsapp.interface.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

export class RealWhatsAppProvider implements IWhatsAppProvider {
  /**
   * Normalizes phone number into international standard (digits only without leading zeros or +)
   */
  private formatPhoneNumber(rawPhone: string): string {
    let cleaned = rawPhone.replace(/[^\d+]/g, '');

    // Remove leading + or 00
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }

    // Iraq formats:
    // 96407... -> 9647...
    if (cleaned.startsWith('96407')) {
      cleaned = '964' + cleaned.substring(4);
    }
    // 07... (11 digits) -> 9647...
    else if (cleaned.startsWith('07') && cleaned.length === 11) {
      cleaned = '964' + cleaned.substring(1);
    }
    // 7... (10 digits, Iraq mobile prefix without 0) -> 9647...
    else if (/^7[5789]\d{8}$/.test(cleaned)) {
      cleaned = '964' + cleaned;
    }

    // Egypt: 010..., 011..., 012..., 015... -> 2010...
    else if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '2' + cleaned;
    }

    // Saudi Arabia: 05... -> 9665...
    else if (cleaned.startsWith('05') && cleaned.length === 10) {
      cleaned = '966' + cleaned.substring(1);
    } else if (/^5\d{8}$/.test(cleaned)) {
      cleaned = '966' + cleaned;
    }

    return cleaned;
  }

  async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    const formattedPhone = this.formatPhoneNumber(options.to);
    const apiUrl = process.env.WHATSAPP_API_URL || env.WHATSAPP_API_URL || 'https://backendapi.wpsenderx.com/api/messages/send';
    const apiKey = (process.env.WHATSAPP_API_KEY || env.WHATSAPP_API_KEY || 'wps_7b5db2a829ff4377ad0c6c42ea7fe4af991c191992305e70eab136c8bb89f7d2').trim();

    const senderPhone = this.formatPhoneNumber(process.env.WHATSAPP_SENDER_PHONE || env.WHATSAPP_SENDER_PHONE || '9647874120325');

    console.log(`📡 [WP SENDER DISPATCH] Sending WhatsApp message from ${senderPhone} to: ${formattedPhone} via ${apiUrl}`);

    try {
      const payload = {
        api_key: apiKey,
        to: formattedPhone,
        phone: formattedPhone,
        number: formattedPhone,
        recipient: formattedPhone,
        sender: senderPhone,
        from: senderPhone,
        account: senderPhone,
        sender_phone: senderPhone,
        message: options.message
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));
      const isSuccess =
        response.ok &&
        (responseData.status === 'success' ||
          responseData.success === true ||
          responseData.data?.success === true ||
          responseData.status === 'sent');

      const messageId =
        responseData.data?.messageLogId ||
        responseData.messageLogId ||
        responseData.messageId ||
        responseData.id ||
        `wps-${Date.now()}`;
      const status: 'SENT' | 'FAILED' = isSuccess ? 'SENT' : (response.ok ? 'SENT' : 'FAILED');
      const errorMessage = !isSuccess ? (responseData.message || responseData.error || `HTTP ${response.status}`) : undefined;

      // Log dispatch to database
      await prisma.whatsAppMessageLog.create({
        data: {
          phoneNumber: formattedPhone,
          templateKey: options.templateKey || null,
          messageContent: options.message,
          status: status,
          requestId: options.requestId || null
        }
      });

      if (!isSuccess) {
        console.warn(`⚠️ [WP SENDER WARNING] API response:`, responseData);
      } else {
        console.log(`✅ [WP SENDER SUCCESS] Message dispatched: ${messageId}`);
      }

      return {
        success: isSuccess || response.ok,
        messageId,
        status,
        errorMessage
      };
    } catch (err: any) {
      console.error(`💥 [WP SENDER ERROR] Failed to dispatch WhatsApp:`, err);

      await prisma.whatsAppMessageLog.create({
        data: {
          phoneNumber: formattedPhone,
          templateKey: options.templateKey || null,
          messageContent: options.message,
          status: 'FAILED',
          requestId: options.requestId || null
        }
      }).catch(() => {});

      return {
        success: false,
        status: 'FAILED',
        errorMessage: err.message || 'فشل الاتصال بخدمة واتساب'
      };
    }
  }
}