import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { adminLimiter, generalLimiter } from '../middleware/rateLimiter.js';
import * as admin from '../controllers/adminController.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Staff access (moderators & admins)
router.get('/stats',                       generalLimiter, requireAuth, requireRole('admin', 'moderator'), wrap(admin.getDashboardStats));
router.get('/reports',                     generalLimiter, requireAuth, requireRole('admin', 'moderator'), wrap(admin.getReports));
router.post('/reports/:reportId/resolve',  adminLimiter, requireAuth, requireRole('admin', 'moderator'), wrap(admin.resolveReport));

// Admin only
router.get('/users',                              generalLimiter, requireAuth, requireRole('admin'), wrap(admin.getUsers));
router.patch('/users/:userId/status',             adminLimiter, requireAuth, requireRole('admin'), wrap(admin.updateUserStatus));
router.get('/audit-events',                       generalLimiter, requireAuth, requireRole('admin'), wrap(admin.getAuditEvents));
router.post('/maintenance/orphan-cleanup',        adminLimiter, requireAuth, requireRole('admin'), wrap(admin.triggerOrphanCleanup));

export default router;
