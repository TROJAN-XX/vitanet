import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import * as feed from '../controllers/feedController.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/following', generalLimiter, requireAuth, wrap(feed.getFollowingFeed));
router.get('/explore', generalLimiter, optionalAuth, wrap(feed.getExploreFeed));

export default router;
