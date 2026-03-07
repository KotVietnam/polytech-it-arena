import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  FRONTEND_EXTRA_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(16).default('dev-super-secret-change-me-123456'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  AUTH_MODE: z.enum(['ad', 'mock', 'keycloak']).default('mock'),
  AD_URL: z.string().optional(),
  AD_BASE_DN: z.string().optional(),
  AD_BIND_DN: z.string().optional(),
  AD_BIND_PASSWORD: z.string().optional(),
  AD_USER_FILTER: z.string().default('(sAMAccountName={{username}})'),
  AD_ADMIN_GROUP_DN: z.string().optional(),
  AD_SKIP_TLS_VERIFY: z
    .string()
    .default('false')
    .transform((value) => value.toLowerCase() === 'true'),
  MOCK_ADMIN_USERNAME: z.string().default('admin'),
  MOCK_ADMIN_PASSWORD: z.string().default('admin123'),
  MOCK_USER_PASSWORD: z.string().default('user123'),
  KEYCLOAK_ISSUER_URL: z.string().url().optional(),
  KEYCLOAK_BASE_URL: z.string().url().optional(),
  KEYCLOAK_REALM: z.string().default('master'),
  KEYCLOAK_CLIENT_ID: z.string().optional(),
  KEYCLOAK_CLIENT_SECRET: z.string().optional(),
  KEYCLOAK_ADMIN_ROLE: z.string().default('admin'),
  APP_PUBLIC_URL: z.string().url().default('https://itarena.kotvietnam.kz'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_API_URL: z.string().url().default('https://api.telegram.org'),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_IDS: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_API_BASE_URL: z.string().url().default('https://graph.facebook.com'),
  WHATSAPP_API_VERSION: z.string().default('v22.0'),
  EVENT_REMINDER_INTERVAL_MS: z.coerce.number().int().positive().default(300000),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment variables:\n${message}`)
}

const env = parsed.data

if (env.AUTH_MODE === 'ad') {
  if (!env.AD_URL || !env.AD_BASE_DN) {
    throw new Error('AUTH_MODE=ad requires AD_URL and AD_BASE_DN')
  }
}

if (env.AUTH_MODE === 'keycloak') {
  if (
    (!env.KEYCLOAK_ISSUER_URL && !env.KEYCLOAK_BASE_URL) ||
    !env.KEYCLOAK_CLIENT_ID ||
    !env.KEYCLOAK_CLIENT_SECRET
  ) {
    throw new Error(
      'AUTH_MODE=keycloak requires KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET and one of KEYCLOAK_ISSUER_URL/KEYCLOAK_BASE_URL',
    )
  }
}

export { env }
