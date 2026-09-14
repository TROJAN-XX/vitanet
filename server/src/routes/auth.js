import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { signupLimiter, loginLimiter, passwordResetLimiter, generalLimiter } from '../middleware/rateLimiter.js';
import { verifyTurnstile } from '../middleware/turnstile.js';
import * as auth from '../controllers/authController.js';

const router = Router();

// Wrap async handlers
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/register',            signupLimiter, verifyTurnstile, wrap(auth.register));
router.post('/verify-email',        generalLimiter, wrap(auth.verifyEmail));
router.post('/resend-verification', generalLimiter, wrap(auth.resendVerification));
router.post('/login',               loginLimiter, wrap(auth.login));
router.post('/refresh',             generalLimiter, wrap(auth.refresh));
router.post('/logout',              generalLimiter, wrap(auth.logout));
router.post('/forgot-password',     passwordResetLimiter, verifyTurnstile, wrap(auth.forgotPassword));
router.post('/reset-password',      generalLimiter, wrap(auth.resetPassword));
router.get('/me',                   generalLimiter, requireAuth, wrap(auth.getMe));

export default router;
