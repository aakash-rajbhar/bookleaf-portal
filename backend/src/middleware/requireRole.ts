import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Restricts access to users having one of the specified roles.
 * Must be preceded by `authenticate` middleware.
 */
export function requireRole(...roles: Array<'author' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
}
