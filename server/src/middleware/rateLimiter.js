import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants.js';

/**
 * Create a rate limiter with consistent error shape.
 * @param {keyof typeof RATE_LIMITS} name
 * @param {{ keyGenerator?: Function }} [overrides]
 */
function createLimiter(name, overrides = {}) {
  const config = RATE_LIMITS[name];
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again later.`,
        },
        requestId: req.requestId,
      });
    },
    ...overrides,
  });
}

/** IP-based rate limiters */
export const signupLimiter = createLimiter('signup');
export const loginLimiter = createLimiter('login');
export const passwordResetLimiter = createLimiter('passwordReset');
export const generalLimiter = createLimiter('general');

/** User-based rate limiters (keyed by userId) */
const userKeyGenerator = (req) => req.user?.id || req.ip;

export const postsLimiter = createLimiter('posts', { keyGenerator: userKeyGenerator });
export const commentsLimiter = createLimiter('comments', { keyGenerator: userKeyGenerator });
export const likesLimiter = createLimiter('likes', { keyGenerator: userKeyGenerator });
export const followsLimiter = createLimiter('follows', { keyGenerator: userKeyGenerator });
export const reportsLimiter = createLimiter('reports', { keyGenerator: userKeyGenerator });
export const presignUploadLimiter = createLimiter('presignUpload', { keyGenerator: userKeyGenerator });

/** Admin rate limiter */
export const adminLimiter = createLimiter('admin', { keyGenerator: userKeyGenerator });
