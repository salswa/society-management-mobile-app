import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { env } from '../config/env';

/** 404 for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
}

/** Centralized error responder: { error: { code, message, details? } }. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);

  const message =
    env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err instanceof Error
        ? err.message
        : 'Unknown error';

  res.status(500).json({ error: { code: 'internal_error', message } });
}
