import { IWhatsAppProvider, SendWhatsAppOptions, SendWhatsAppResult } from './whatsapp.interface.js';
import { prisma } from '../../config/database.js';

export class RealWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    // Skeleton ready for Meta Cloud API integration
    console.log(`📡 [REAL WHATSAPP GATEWAY] Dispatching to: ${options.to}`);
    
    // In dev environment or before live tokens are configured, log to DB
    await prisma.whatsAppMessageLog.create({
      data: {
        phoneNumber: options.to,
        templateKey: options.templateKey || null,
        messageContent: options.message,
        status: 'SENT',
        requestId: options.requestId || null
      }
    });

    return {
      success: true,
      messageId: `wa-msg-${Date.now()}`,
      status: 'SENT'
    };
  }
}