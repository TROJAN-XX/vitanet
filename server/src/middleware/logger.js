/**
 * Structured request logger.
 * Logs: requestId, method, route, status, durationMs.
 * NEVER logs credentials, tokens, or request bodies.
 */
export function loggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 200),
    };

    // Add userId if authenticated (never log the actual token)
    if (req.user?.id) {
      logEntry.userId = req.user.id;
    }

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    // Structured JSON log line
    console[level](JSON.stringify(logEntry));
  });

  next();
}
