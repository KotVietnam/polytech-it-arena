import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(16).default('dev-super-secret-change-me-123456'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  AUTH_MODE: z.enum(['ad', 'mock']).default('mock'),
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

export { env }
