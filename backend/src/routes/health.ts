import { Router } from 'express';
import { query } from '../db/pool';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let db = 'ok';
  try { await query('SELECT 1'); } catch { db = 'down'; }
  res.status(db === 'ok' ? 200 : 503).json({ status: db === 'ok' ? 'ok' : 'degraded', db, time: new Date().toISOString() });
});
