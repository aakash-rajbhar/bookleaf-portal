import { Router } from 'express';
import { healthRouter } from './health';

/** Mounted at /api/v1. Public routes first; `authenticate` is applied before protected routers (T04). */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
// T04: apiRouter.use('/auth', authRouter);
// T04: apiRouter.use(authenticate);
// T05+: books, tickets, events, admin
