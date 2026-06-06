import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  TRUST_PROXY: z.coerce.boolean().default(false),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(20),
  JWT_REFRESH_SECRET: z.string().min(20),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  REFRESH_COOKIE_NAME: z.string().default('tiatru_refresh'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).default(12),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  REDIS_URL: z.string().optional().default(''),
  DEFAULT_CURRENCY: z.string().default('TRY'),
  IYZICO_API_KEY: z.string().optional().default(''),
  IYZICO_SECRET_KEY: z.string().optional().default(''),
  IYZICO_BASE_URL: z.string().optional().default('https://sandbox-api.iyzipay.com'),
  PAYMENT_WEBHOOK_SECRET: z.string().default('change_me_webhook_secret'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('Tiatru <noreply@tiatru.com>'),
  SMS_PROVIDER: z.string().optional().default(''),
  SMS_API_KEY: z.string().optional().default(''),
  UPLOAD_DIR: z.string().default('uploads'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:5000'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(5)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
