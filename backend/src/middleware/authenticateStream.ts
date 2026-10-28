import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import type { RequestUser } from '../types/express';

interface StreamJwtPayload {
  sub: string;
  role: 'author' | 'admin';
  authorId: string | null;
  purpose: string;
}

/**
 * Validates short-lived stream token from query string (?token=...).
 * Strictly verifies HS256 algorithm and purpose === 'sse'.
 * Rejects regular login JWTs.
 */
export function authenticateStream(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

  if (!token) {
    return next(AppError.unauthorized('Stream token required'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as StreamJwtPayload;

    if (!payload.sub || !payload.role || payload.purpose !== 'sse') {
      return next(AppError.unauthorized('Invalid stream token'));
    }

    const user: RequestUser = {
      id: payload.sub,
      role: payload.role,
      authorId: payload.authorId ?? null,
    };

    req.user = user;
    next();
  } catch (_err) {
    return next(AppError.unauthorized('Invalid or expired stream token'));
  }
}
