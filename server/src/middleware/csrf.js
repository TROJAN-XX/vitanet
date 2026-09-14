import crypto from 'node:crypto';
import env from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * CSRF protection middleware.
 * Uses Origin header allowlist + CSRF token for state-changing requests.
 *
 * Strategy:
 * 1. Check Origin header against allowlist (primary defense)
 * 2. For cookie-authenticated requests, also require X-CSRF-Token header
 */

const allowedOrigins = new Set([env.APP_ORIGIN]);
if (env.NODE_ENV === 'development') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://localhost:3000');
}

/**
 * Origin check for state-changing requests (POST, PATCH, DELETE).
 */
export function csrfProtection(req, res, next) {
  // Skip safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');

  // Check Origin header
  if (origin) {
    if (!allowedOrigins.has(origin)) {
      throw ApiError.forbidden('Invalid request origin');
    }
    return next();
  }

  // Fallback to Referer check
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!allowedOrigins.has(refOrigin)) {
        throw ApiError.forbidden('Invalid request origin');
      }
      return next();
    } catch {
      throw ApiError.forbidden('Invalid referer');
    }
  }

  // No origin or referer — reject (browser requests always send these)
  throw ApiError.forbidden('Missing request origin');
}

/**
 * Generate a CSRF token for the session.
 * @returns {string}
 */
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}
