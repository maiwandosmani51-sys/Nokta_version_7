import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { createError } from '../helpers/response';
import { sanitizePayload } from '../utils/requestSanitizer';

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

export function requestSanitizationMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.body = sanitizePayload(req.body);
  req.query = sanitizePayload(req.query);
  req.params = sanitizePayload(req.params);
  next();
}

export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  if (!stateChanging || !req.headers.cookie) {
    return next();
  }

  const csrfToken = req.get(config.csrfHeaderName);
  if (!csrfToken || csrfToken !== config.csrfSecret) {
    return res.status(403).json(createError('CSRF token invalid'));
  }

  next();
}
