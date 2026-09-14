import { z } from 'zod';
import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Block from '../models/Block.js';
import MediaUsage from '../models/MediaUsage.js';
import Notification from '../models/Notification.js';
import AuditEvent from '../models/AuditEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { createPresignedGet } from '../services/r2Service.js';
import {
  COMMENT_MAX_CHARS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../config/constants.js';

const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(COMMENT_MAX_CHARS),
});

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function makeCursor(doc) {
  return `${doc.createdAt.getTime()}_${doc._id}`;
}

async function buildCursorQuery(cursor) {
  if (!cursor) return {};
  try {
    const [timestamp, id] = cursor.split('_');
    const date = new Date(parseInt(timestamp, 10));
    return {
      $or: [
        { createdAt: { $gt: date } },
        { createdAt: date, _id: { $gt: new mongoose.Types.ObjectId(id) } },
      ],
    };
  } catch {
    return {};
  }
}

/**
 * GET /posts/:postId/comments
 * List comments on a post in chronological order.
 */
export async function getComments(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const { cursor, limit } = paginationSchema.parse(req.query);

  const post = await Post.findOne({ _id: postId, deletedAt: null });
  if (!post) throw ApiError.notFound('Post not found');

  // Check block between viewer and post author
  if (req.user) {
    const blocked = await Block.exists({
      $or: [
        { blockerId: req.user._id, blockedId: post.authorId },
        { blockerId: post.authorId, blockedId: req.user._id },
      ],
    });
    if (blocked) throw ApiError.notFound('Post not found');
  }

  const cursorQuery = await buildCursorQuery(cursor);
  const rawComments = await Comment.find({
    postId,
    deletedAt: null,
    status: 'active',
    ...cursorQuery,
  })
    .sort({ createdAt: 1, _id: 1 })
    .limit(limit + 1)
    .populate('authorId', 'username displayName avatarMediaId')
    .lean();

  const hasMore = rawComments.length > limit;
  if (hasMore) rawComments.pop();

  const comments = await Promise.all(
    rawComments.map(async (c) => {
      let avatarUrl = null;
      if (c.authorId?.avatarMediaId) {
        const avatar = await MediaUsage.findOne({
          _id: c.authorId.avatarMediaId,
          status: 'active',
        }).lean();
        if (avatar) {
          avatarUrl = await createPresignedGet(avatar.objectKey);
        }
      }
      return {
        id: c._id,
        postId: c.postId,
        body: c.body,
        author: {
          id: c.authorId?._id,
          username: c.authorId?.username,
          displayName: c.authorId?.displayName,
          avatarUrl,
        },
        createdAt: c.createdAt,
      };
    })
  );

  const nextCursor = hasMore && rawComments.length > 0 ? makeCursor(rawComments[rawComments.length - 1]) : null;

  res.json({
    success: true,
    data: { comments, nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * POST /posts/:postId/comments
 * Add a comment to a post.
 */
export async function createComment(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const { body } = createCommentSchema.parse(req.body);
  const user = req.user;

  const post = await Post.findOne({ _id: postId, deletedAt: null });
  if (!post) throw ApiError.notFound('Post not found');

  if (post.moderationStatus === 'removed') {
    throw ApiError.badRequest('Cannot comment on removed post');
  }

  // Check block between commenter and post author
  const blocked = await Block.exists({
    $or: [
      { blockerId: user._id, blockedId: post.authorId },
      { blockerId: post.authorId, blockedId: user._id },
    ],
  });
  if (blocked) throw ApiError.notFound('Post not found');

  const comment = await Comment.create({
    postId: post._id,
    authorId: user._id,
    body,
  });

  // Increment commentCount
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

  // Notification for post author (if not self)
  if (post.authorId.toString() !== user._id.toString()) {
    await Notification.create({
      recipientId: post.authorId,
      actorId: user._id,
      type: 'comment',
      postId: post._id,
      commentId: comment._id,
    });
  }

  // Audit log
  await AuditEvent.create({
    actorUserId: user._id,
    action: 'comment_create',
    targetType: 'comment',
    targetId: comment._id,
  });

  const commentDoc = comment.toJSON();
  commentDoc.author = {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
  };

  res.status(201).json({
    success: true,
    data: { comment: commentDoc },
    requestId: req.requestId,
  });
}

/**
 * DELETE /posts/:postId/comments/:commentId
 * Remove a comment. Allowed by author of comment, author of post, or staff.
 */
export async function deleteComment(req, res) {
  const { postId, commentId } = req.params;
  if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
    throw ApiError.badRequest('Invalid IDs');
  }

  const comment = await Comment.findOne({ _id: commentId, postId, deletedAt: null });
  if (!comment) throw ApiError.notFound('Comment not found');

  const post = await Post.findById(postId);
  const isCommentAuthor = comment.authorId.toString() === req.user._id.toString();
  const isPostAuthor = post && post.authorId.toString() === req.user._id.toString();
  const isStaff = ['moderator', 'admin'].includes(req.user.role);

  if (!isCommentAuthor && !isPostAuthor && !isStaff) {
    throw ApiError.forbidden('Permission denied');
  }

  comment.status = 'removed';
  comment.deletedAt = new Date();
  await comment.save();

  if (post) {
    await Post.updateOne({ _id: post._id, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
  }

  await AuditEvent.create({
    actorUserId: req.user._id,
    action: 'comment_delete',
    targetType: 'comment',
    targetId: comment._id,
  });

  res.json({
    success: true,
    data: { deleted: true },
    requestId: req.requestId,
  });
}
