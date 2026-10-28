import 'dotenv/config';
import { z } from 'zod';

/** All configuration comes from validated environment variables. Fail fast on bad config. */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  AI_PROVIDER: z.enum(['gemini', 'mock']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_RPM_LIMIT: z.coerce.number().default(10),
  AI_TIMEOUT_MS: z.coerce.number().default(15000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
