import crypto from 'node:crypto';

/**
 * Generates a unique request ID (UUID v4) and attaches it to the request.
 * Used for structured logging and error tracking.
 */
export function requestIdMiddleware(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
