import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import * as user from '../controllers/userController.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Current authenticated user management (must precede :username routes)
router.patch('/me',          generalLimiter, requireAuth, wrap(user.updateProfile));
router.get('/me/export',     generalLimiter, requireAuth, wrap(user.exportData));
router.delete('/me',         generalLimiter, requireAuth, wrap(user.deleteAccount));

// Social relationships (by user ID)
router.post('/:userId/follow',   generalLimiter, requireAuth, wrap(user.followUser));
router.delete('/:userId/follow', generalLimiter, requireAuth, wrap(user.unfollowUser));
router.post('/:userId/block',    generalLimiter, requireAuth, wrap(user.blockUser));
router.delete('/:userId/block',  generalLimiter, requireAuth, wrap(user.unblockUser));
router.post('/:userId/mute',     generalLimiter, requireAuth, wrap(user.muteUser));
router.delete('/:userId/mute',   generalLimiter, requireAuth, wrap(user.unmuteUser));

// Profiles and user feeds (by username)
router.get('/:username',           generalLimiter, optionalAuth, wrap(user.getProfile));
router.get('/:username/posts',     generalLimiter, optionalAuth, wrap(user.getUserPosts));
router.get('/:username/followers', generalLimiter, optionalAuth, wrap(user.getFollowers));
router.get('/:username/following', generalLimiter, optionalAuth, wrap(user.getFollowing));

export default router;
