import { z } from 'zod';

/**
 * Zod schema for server environment variables.
 * Validates all required vars at startup and fails fast with clear messages.
 */
const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_ORIGIN: z.string().url(),
  API_ORIGIN: z.string().url(),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),

  // Turnstile
  TURNSTILE_SECRET_KEY: z.string().min(1, 'TURNSTILE_SECRET_KEY is required'),

  // R2
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required'),
  R2_ENDPOINT: z.string().url('R2_ENDPOINT must be a valid URL'),

  // Brevo
  BREVO_API_KEY: z.string().min(1, 'BREVO_API_KEY is required'),
  BREVO_SENDER_EMAIL: z.string().email('BREVO_SENDER_EMAIL must be valid email'),
  BREVO_SENDER_NAME: z.string().min(1).default('VitaNet'),

  // Admin
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be valid email'),
  MAINTENANCE_SECRET: z.string().min(16, 'MAINTENANCE_SECRET must be at least 16 characters'),

  // Optional
  ENABLE_EMAIL: z.string().transform(v => v === 'true').default('false'),
  ENABLE_TURNSTILE: z.string().transform(v => v === 'true').default('false'),
  GLOBAL_USER_CAP: z.coerce.number().int().positive().default(100),
  GLOBAL_MEDIA_CAP_BYTES: z.coerce.number().int().positive().default(7 * 1024 * 1024 * 1024), // 7 GB
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/**
 * Validated environment configuration.
 * Throws descriptive error at startup if validation fails.
 * @type {z.infer<typeof envSchema>}
 */
let env;

try {
  env = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    const messages = err.issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    console.error(`\n❌ Environment validation failed:\n${messages}\n`);
    console.error('Copy server/.env.example to server/.env and fill in all required values.\n');
  }
  process.exit(1);
}

export default env;
