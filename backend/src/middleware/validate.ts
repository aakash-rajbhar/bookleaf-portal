import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Validates request components against Zod schemas.
 * Replaces req.body, req.query, or req.params with parsed (and transformed/stripped) values.
 * Catches ZodError and forwards to errorHandler.
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        try {
          req.query = parsed;
        } catch {
          Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
        }
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        try {
          req.params = parsed;
        } catch {
          Object.defineProperty(req, 'params', { value: parsed, writable: true, configurable: true });
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
