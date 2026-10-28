import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

/** 404 for any route that did not match. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/** Central error handler: every error leaves the API in the same JSON shape. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Something went wrong' : String((err as Error)?.message ?? err),
    },
  });
}
