import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Sanitize NODE_ENV safely
const rawNodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
const nodeEnv = (rawNodeEnv === 'test' || rawNodeEnv === 'development') ? rawNodeEnv : 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().default('civicflow_jwt_access_secret_key_super_secure_12345'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('civicflow_jwt_refresh_secret_key_super_secure_67890'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  WHATSAPP_PROVIDER: z.enum(['mock', 'cloud_api', 'wpsender']).default('wpsender'),
  WHATSAPP_API_URL: z.string().default('https://backendapi.wpsenderx.com/api/messages/send'),
  WHATSAPP_API_KEY: z.string().default('wps_7b5db2a829ff4377ad0c6c42ea7fe4af991c191992305e70eab136c8bb89f7d2')
});

const parsed = envSchema.safeParse({
  ...process.env,
  NODE_ENV: nodeEnv
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
