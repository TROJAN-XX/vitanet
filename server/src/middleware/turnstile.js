import env from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Cloudflare Turnstile server-side verification middleware.
 * Verifies the turnstile token from req.body.turnstileToken.
 * Skipped in development when ENABLE_TURNSTILE is false.
 */
export async function verifyTurnstile(req, res, next) {
  // Skip in development
  if (!env.ENABLE_TURNSTILE) {
    return next();
  }

  const token = req.body?.turnstileToken;
  if (!token) {
    throw ApiError.badRequest('Bot verification required');
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    formData.append('remoteip', req.ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await res.json();

    if (!data.success) {
      throw ApiError.badRequest('Bot verification failed');
    }

    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error('[TURNSTILE] Verification error:', err.message);
    throw ApiError.internal('Bot verification service unavailable');
  }
}
