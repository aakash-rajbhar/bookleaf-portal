import { Pool } from 'pg';
import { env } from '../config/env';

/** Single shared connection pool. Use `query` for simple calls, `pool.connect()` for transactions. */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

export const query = <T = any>(text: string, params?: unknown[]) => pool.query(text, params as any[]).then((r) => r.rows as T[]);
