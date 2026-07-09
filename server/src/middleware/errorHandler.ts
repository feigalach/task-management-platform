import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const context = { method: req.method, path: req.originalUrl };

  if (err instanceof AppError) {
    // Expected, handled failures (validation/workflow-rule violations,
    // not-found, etc.) - worth knowing about but not an application bug,
    // so this logs at warn rather than error.
    logger.warn(`${err.statusCode} ${err.message}`, context);
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    // Zod v4: the issues array is `err.issues` (the old `err.errors` alias was removed).
    const details = err.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(body)';
      return `${path}: ${issue.message}`;
    });
    logger.warn('400 Validation failed', { ...context, details });
    return res.status(400).json({ error: 'Validation failed', details });
  }

  logger.error('Unhandled error', { ...context, error: err instanceof Error ? err.stack ?? err.message : String(err) });
  return res.status(500).json({ error: 'Internal server error' });
}
