import { Router } from 'express';
import { requireAuth, optionalAuth, requireVerifiedEmail } from '../middleware/auth.js';
import {
  postsLimiter,
  commentsLimiter,
  likesLimiter,
  generalLimiter,
} from '../middleware/rateLimiter.js';
import * as post from '../controllers/postController.js';
import * as comment from '../controllers/commentController.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// User bookmarks (must precede :postId)
router.get('/saved', generalLimiter, requireAuth, wrap(post.getSavedPosts));

// Post CRUD
router.post('/', generalLimiter, requireAuth, requireVerifiedEmail, postsLimiter, wrap(post.createPost));
router.get('/:postId', generalLimiter, optionalAuth, wrap(post.getPost));
router.patch('/:postId', generalLimiter, requireAuth, wrap(post.updatePost));
router.delete('/:postId', generalLimiter, requireAuth, wrap(post.deletePost));

// Reactions (likes & saves)
router.post('/:postId/like', generalLimiter, requireAuth, likesLimiter, wrap(post.likePost));
router.delete('/:postId/like', generalLimiter, requireAuth, likesLimiter, wrap(post.unlikePost));
router.post('/:postId/save', generalLimiter, requireAuth, wrap(post.savePost));
router.delete('/:postId/save', generalLimiter, requireAuth, wrap(post.unsavePost));

// Comments
router.get('/:postId/comments', generalLimiter, optionalAuth, wrap(comment.getComments));
router.post('/:postId/comments', generalLimiter, requireAuth, requireVerifiedEmail, commentsLimiter, wrap(comment.createComment));
router.delete('/:postId/comments/:commentId', generalLimiter, requireAuth, wrap(comment.deleteComment));

export default router;
