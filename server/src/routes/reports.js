import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { reportsLimiter, generalLimiter } from '../middleware/rateLimiter.js';
import * as report from '../controllers/reportController.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', generalLimiter, requireAuth, reportsLimiter, wrap(report.submitReport));

export default router;
