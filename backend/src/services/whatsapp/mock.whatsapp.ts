import { IWhatsAppProvider, SendWhatsAppOptions, SendWhatsAppResult } from './whatsapp.interface.js';
import { prisma } from '../../config/database.js';

export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    console.log(`📱 [MOCK WHATSAPP] To: ${options.to} | Template: ${options.templateKey || 'N/A'}`);
    console.log(`📩 Message Content: ${options.message}\n`);

    try {
      await prisma.whatsAppMessageLog.create({
        data: {
          phoneNumber: options.to,
          templateKey: options.templateKey || null,
          messageContent: options.message,
          status: 'MOCK_DISPATCHED',
          requestId: options.requestId || null
        }
      });

      return {
        success: true,
        messageId: `mock-wa-${Date.now()}`,
        status: 'MOCK_DISPATCHED'
      };
    } catch (err: any) {
      console.error('Failed to log mock whatsapp message:', err);
      return {
        success: false,
        status: 'FAILED',
        errorMessage: err.message
      };
    }
  }
}