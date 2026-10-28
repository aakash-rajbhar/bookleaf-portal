import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

/** Mounted at /api/v1. Public routes first; `authenticate` is applied before protected routers. */
export const apiRouter = Router();

// Public routes
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);

// Protected routes: all routes registered below require a valid JWT
apiRouter.use(authenticate);

// Temporary debug route to test role guard
// TODO: remove in T08
apiRouter.get('/_debug/admin-only', requireRole('admin'), (req, res) => {
  res.status(200).json({
    message: 'admin access granted',
    user: req.user,
  });
});
