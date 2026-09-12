import { IWhatsAppProvider } from './whatsapp.interface.js';
import { MockWhatsAppProvider } from './mock.whatsapp.js';
import { RealWhatsAppProvider } from './real.whatsapp.js';
import { env } from '../../config/env.js';

export const whatsAppProvider: IWhatsAppProvider =
  env.WHATSAPP_PROVIDER === 'mock'
    ? new MockWhatsAppProvider()
    : new RealWhatsAppProvider();

export * from './whatsapp.interface.js';