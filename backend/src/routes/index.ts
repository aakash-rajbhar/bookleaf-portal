import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { eventsRouter } from './events';
import { booksRouter } from './books';
import { ticketsRouter } from './tickets';
import { adminRouter } from './admin';
import { authenticate } from '../middleware/authenticate';

/** Mounted at /api/v1. Public routes first; `authenticate` is applied before protected routers. */
export const apiRouter = Router();

// Public / self-authenticated routes
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/events', eventsRouter);

// Protected routes: all routes registered below require a valid JWT
apiRouter.use(authenticate);

apiRouter.use('/books', booksRouter);
apiRouter.use('/tickets', ticketsRouter);
apiRouter.use('/admin', adminRouter);
