import type { Request, Response, NextFunction } from 'express';
import { createError } from '../helpers/response';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled server error:', err);

  const message = err instanceof Error ? err.message : 'Server error';
  const status = (() => {
    if (err instanceof Error && err.message.startsWith('CORS blocked:')) return 403;
    if ((err as any)?.statusCode && typeof (err as any).statusCode === 'number') return (err as any).statusCode;
    return 500;
  })();

  res.status(status).json({ ...createError(message), requestId: req.requestId ?? null });
}
