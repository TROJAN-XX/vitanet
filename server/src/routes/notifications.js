import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import * as notification from '../controllers/notificationController.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', generalLimiter, requireAuth, wrap(notification.getNotifications));
router.patch('/read', generalLimiter, requireAuth, wrap(notification.markAsRead));
router.post('/mark-read', generalLimiter, requireAuth, wrap(notification.markAsRead));
router.get('/unread-count', generalLimiter, requireAuth, wrap(notification.getUnreadCount));

export default router;
