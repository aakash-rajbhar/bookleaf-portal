import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import type { RequestUser } from '../types/express';

interface JwtPayload {
  sub: string;
  role: 'author' | 'admin';
  authorId: string | null;
}

/**
 * Validates the Bearer JWT token from Authorization header.
 * Attaches decoded user identity to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Authentication token required'));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(AppError.unauthorized('Authentication token required'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (!payload.sub || !payload.role) {
      return next(AppError.unauthorized('Invalid authentication token'));
    }

    const user: RequestUser = {
      id: payload.sub,
      role: payload.role,
      authorId: payload.authorId ?? null,
    };

    req.user = user;
    next();
  } catch (_err) {
    return next(AppError.unauthorized('Invalid or expired authentication token'));
  }
}
