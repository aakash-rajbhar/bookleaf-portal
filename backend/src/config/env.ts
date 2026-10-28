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
  GEMINI_API_KEY: z
    .string()
    .optional()
    .transform((val) => (val === '' || val === 'API_KEY_ADDED' ? undefined : val)),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  GEMINI_FALLBACK_MODEL: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  AI_RPM_LIMIT: z.coerce.number().default(5),
  AI_DAILY_LIMIT: z.coerce.number().default(200),
  AI_TIMEOUT_MS: z.coerce.number().default(20000),
  AI_TOTAL_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_MOCK_FAILURE: z
    .enum(['none', 'always', 'rate_limit', 'empty', 'invalid_json'])
    .default('none'),
  GEMINI_THINKING_BUDGET: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number().optional()
  ),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
