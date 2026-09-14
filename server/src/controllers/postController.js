import { z } from 'zod';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import Like from '../models/Like.js';
import Save from '../models/Save.js';
import MediaUsage from '../models/MediaUsage.js';
import Notification from '../models/Notification.js';
import AuditEvent from '../models/AuditEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { createPresignedGet } from '../services/r2Service.js';
import {
  CAPTION_MAX_CHARS,
  MEDIA_ITEMS_PER_POST,
  ALL_ACCEPTED_MIMES,
  POST_VISIBILITY,
  POSTS_PER_USER_TOTAL,
  POSTS_PER_USER_DAY,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../config/constants.js';

// ── Validation Schemas ──

const mediaItemInputSchema = z.object({
  mediaId: z.string().min(1),
  objectKey: z.string().min(1),
  mimeType: z.string().refine((val) => ALL_ACCEPTED_MIMES.includes(val), {
    message: 'Unsupported MIME type',
  }),
  bytes: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  durationSeconds: z.number().positive().nullable().optional(),
  order: z.number().int().min(0).default(0),
});

const createPostSchema = z.object({
  caption: z.string().max(CAPTION_MAX_CHARS).default(''),
  media: z.array(mediaItemInputSchema).min(1).max(MEDIA_ITEMS_PER_POST),
  visibility: z.enum(['public', 'followers_only']).default('public'),
  contentWarning: z.string().max(200).nullable().optional(),
  topics: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
});

const updatePostSchema = z.object({
  caption: z.string().max(CAPTION_MAX_CHARS).optional(),
  visibility: z.enum(['public', 'followers_only']).optional(),
  contentWarning: z.string().max(200).nullable().optional(),
  topics: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

// ── Helpers ──

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
        { createdAt: { $lt: date } },
        { createdAt: date, _id: { $lt: new mongoose.Types.ObjectId(id) } },
      ],
    };
  } catch {
    return {};
  }
}

/**
 * Attaches presigned download URLs to post media items and author avatar
 */
export async function populatePostPresignedUrls(post) {
  if (!post) return post;

  // Presign post media
  if (Array.isArray(post.media)) {
    const mediaWithUrls = await Promise.all(
      post.media.map(async (item) => {
        const url = await createPresignedGet(item.objectKey);
        return {
          ...item,
          url,
        };
      })
    );
    post.media = mediaWithUrls;
  }

  // Presign author avatar if present
  if (post.authorId && post.authorId.avatarMediaId) {
    const avatarMedia = await MediaUsage.findOne({
      _id: post.authorId.avatarMediaId,
      status: 'active',
    }).lean();
    if (avatarMedia) {
      post.authorId.avatarUrl = await createPresignedGet(avatarMedia.objectKey);
    }
  }

  return post;
}

// ── Controllers ──

/**
 * POST /posts
 * Creates a post with verified media and enforces hard limits.
 */
export async function createPost(req, res) {
  const data = createPostSchema.parse(req.body);
  const user = req.user;

  // 1. Check total post quota (100 per user)
  if (user.postsCount >= POSTS_PER_USER_TOTAL) {
    throw ApiError.badRequest(`Maximum post limit reached (${POSTS_PER_USER_TOTAL} posts).`);
  }

  // 2. Check daily post quota (10 per user per day)
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const postsToday = await Post.countDocuments({
    authorId: user._id,
    createdAt: { $gte: startOfDay },
  });

  if (postsToday >= POSTS_PER_USER_DAY) {
    throw ApiError.badRequest(`Daily post limit reached (${POSTS_PER_USER_DAY} posts per day).`);
  }

  // 3. Verify that each media item belongs to the user and is active in MediaUsage
  const objectKeys = data.media.map((m) => m.objectKey);
  const activeMedia = await MediaUsage.find({
    userId: user._id,
    objectKey: { $in: objectKeys },
    status: 'active',
  });

  if (activeMedia.length !== objectKeys.length) {
    throw ApiError.badRequest('One or more media items are invalid or not finalized');
  }

  // 4. Create Post
  const post = await Post.create({
    authorId: user._id,
    caption: data.caption,
    media: data.media,
    visibility: data.visibility,
    contentWarning: data.contentWarning || null,
    topics: data.topics,
  });

  // 5. Increment user postsCount
  await User.updateOne({ _id: user._id }, { $inc: { postsCount: 1 } });

  // 6. Audit log
  await AuditEvent.create({
    actorUserId: user._id,
    action: 'post_create',
    targetType: 'post',
    targetId: post._id,
    metadata: { mediaCount: post.media.length, visibility: post.visibility },
  });

  const postObj = post.toJSON();
  await populatePostPresignedUrls(postObj);

  res.status(201).json({
    success: true,
    data: { post: postObj },
    requestId: req.requestId,
  });
}

/**
 * GET /posts/:postId
 * Retrieve a single post with author, relationship status, and presigned media.
 */
export async function getPost(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const postDoc = await Post.findOne({ _id: postId, deletedAt: null })
    .populate('authorId', 'username displayName avatarMediaId')
    .lean();

  if (!postDoc) throw ApiError.notFound('Post not found');

  // Check if removed by moderation
  if (postDoc.moderationStatus === 'removed') {
    const isStaff = req.user && ['moderator', 'admin'].includes(req.user.role);
    if (!isStaff) throw ApiError.notFound('Post not found');
  }

  // Check block between viewer and author
  if (req.user) {
    const blocked = await Block.exists({
      $or: [
        { blockerId: req.user._id, blockedId: postDoc.authorId._id },
        { blockerId: postDoc.authorId._id, blockedId: req.user._id },
      ],
    });
    if (blocked) throw ApiError.notFound('Post not found');
  }

  // Check visibility for followers_only
  if (postDoc.visibility === 'followers_only') {
    const isAuthor = req.user && req.user._id.toString() === postDoc.authorId._id.toString();
    if (!isAuthor) {
      const isFollowing = req.user
        ? await Follow.exists({ followerId: req.user._id, followingId: postDoc.authorId._id })
        : false;
      if (!isFollowing) throw ApiError.notFound('Post not found');
    }
  }

  const post = { ...postDoc, id: postDoc._id };
  await populatePostPresignedUrls(post);

  if (req.user) {
    const [likeExists, saveExists] = await Promise.all([
      Like.exists({ userId: req.user._id, postId: postDoc._id }),
      Save.exists({ userId: req.user._id, postId: postDoc._id }),
    ]);
    post.isLiked = !!likeExists;
    post.isSaved = !!saveExists;
  } else {
    post.isLiked = false;
    post.isSaved = false;
  }

  res.json({
    success: true,
    data: { post },
    requestId: req.requestId,
  });
}

/**
 * PATCH /posts/:postId
 * Update post caption, content warning, topics, or visibility.
 */
export async function updatePost(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const data = updatePostSchema.parse(req.body);
  const post = await Post.findOne({ _id: postId, deletedAt: null });

  if (!post) throw ApiError.notFound('Post not found');

  if (post.authorId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only edit your own posts');
  }

  if (data.caption !== undefined) post.caption = data.caption;
  if (data.visibility !== undefined) post.visibility = data.visibility;
  if (data.contentWarning !== undefined) post.contentWarning = data.contentWarning;
  if (data.topics !== undefined) post.topics = data.topics;

  await post.save();

  await AuditEvent.create({
    actorUserId: req.user._id,
    action: 'post_update',
    targetType: 'post',
    targetId: post._id,
  });

  const postObj = post.toJSON();
  await populatePostPresignedUrls(postObj);

  res.json({
    success: true,
    data: { post: postObj },
    requestId: req.requestId,
  });
}

/**
 * DELETE /posts/:postId
 * Soft deletes post and marks associated media as pending_delete.
 */
export async function deletePost(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const post = await Post.findOne({ _id: postId, deletedAt: null });
  if (!post) throw ApiError.notFound('Post not found');

  const isAuthor = post.authorId.toString() === req.user._id.toString();
  const isStaff = ['moderator', 'admin'].includes(req.user.role);

  if (!isAuthor && !isStaff) {
    throw ApiError.forbidden('Permission denied');
  }

  post.deletedAt = new Date();
  await post.save();

  // Decrement user postsCount
  await User.updateOne({ _id: post.authorId }, { $inc: { postsCount: -1 } });

  // Mark all media as pending_delete for orphan cleanup
  const objectKeys = post.media.map((m) => m.objectKey);
  if (objectKeys.length > 0) {
    await MediaUsage.updateMany(
      { objectKey: { $in: objectKeys }, status: 'active' },
      { status: 'pending_delete' }
    );
  }

  // Audit log
  await AuditEvent.create({
    actorUserId: req.user._id,
    action: isStaff && !isAuthor ? 'post_remove_moderation' : 'post_delete',
    targetType: 'post',
    targetId: post._id,
  });

  res.json({
    success: true,
    data: { deleted: true },
    requestId: req.requestId,
  });
}

/**
 * POST /posts/:postId/like
 */
export async function likePost(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const post = await Post.findOne({ _id: postId, deletedAt: null });
  if (!post) throw ApiError.notFound('Post not found');

  // Check block
  const blocked = await Block.exists({
    $or: [
      { blockerId: req.user._id, blockedId: post.authorId },
      { blockerId: post.authorId, blockedId: req.user._id },
    ],
  });
  if (blocked) throw ApiError.notFound('Post not found');

  const existingLike = await Like.findOne({ userId: req.user._id, postId: post._id });
  if (existingLike) {
    return res.json({
      success: true,
      data: { liked: true, likeCount: post.likeCount },
      requestId: req.requestId,
    });
  }

  await Like.create({ userId: req.user._id, postId: post._id });
  await Post.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });

  // Notification for author (if not self)
  if (post.authorId.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipientId: post.authorId,
      actorId: req.user._id,
      type: 'like',
      postId: post._id,
    });
  }

  res.json({
    success: true,
    data: { liked: true, likeCount: post.likeCount + 1 },
    requestId: req.requestId,
  });
}

/**
 * DELETE /posts/:postId/like
 */
export async function unlikePost(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const post = await Post.findOne({ _id: postId, deletedAt: null });
  if (!post) throw ApiError.notFound('Post not found');

  const deleted = await Like.findOneAndDelete({ userId: req.user._id, postId: post._id });
  if (deleted) {
    await Post.updateOne({ _id: post._id, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
  }

  const updatedCount = deleted ? Math.max(0, post.likeCount - 1) : post.likeCount;

  res.json({
    success: true,
    data: { liked: false, likeCount: updatedCount },
    requestId: req.requestId,
  });
}

/**
 * POST /posts/:postId/save
 */
export async function savePost(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const post = await Post.findOne({ _id: postId, deletedAt: null });
  if (!post) throw ApiError.notFound('Post not found');

  const existingSave = await Save.findOne({ userId: req.user._id, postId: post._id });
  if (existingSave) {
    return res.json({
      success: true,
      data: { saved: true, saveCount: post.saveCount },
      requestId: req.requestId,
    });
  }

  await Save.create({ userId: req.user._id, postId: post._id });
  await Post.updateOne({ _id: post._id }, { $inc: { saveCount: 1 } });

  res.json({
    success: true,
    data: { saved: true, saveCount: post.saveCount + 1 },
    requestId: req.requestId,
  });
}

/**
 * DELETE /posts/:postId/save
 */
export async function unsavePost(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const post = await Post.findOne({ _id: postId, deletedAt: null });
  if (!post) throw ApiError.notFound('Post not found');

  const deleted = await Save.findOneAndDelete({ userId: req.user._id, postId: post._id });
  if (deleted) {
    await Post.updateOne({ _id: post._id, saveCount: { $gt: 0 } }, { $inc: { saveCount: -1 } });
  }

  const updatedCount = deleted ? Math.max(0, post.saveCount - 1) : post.saveCount;

  res.json({
    success: true,
    data: { saved: false, saveCount: updatedCount },
    requestId: req.requestId,
  });
}

/**
 * GET /posts/saved
 * Retrieves bookmarks of the authenticated user.
 */
export async function getSavedPosts(req, res) {
  const { cursor, limit } = paginationSchema.parse(req.query);

  const cursorQuery = cursor ? await buildCursorQuery(cursor) : {};
  const saves = await Save.find({ userId: req.user._id, ...cursorQuery })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate({
      path: 'postId',
      match: { deletedAt: null, moderationStatus: { $ne: 'removed' } },
      populate: { path: 'authorId', select: 'username displayName avatarMediaId' },
    })
    .lean();

  const hasMore = saves.length > limit;
  if (hasMore) saves.pop();

  // Filter out any deleted posts that were null from populate
  const validSaves = saves.filter((s) => s.postId != null);

  const posts = await Promise.all(
    validSaves.map(async (s) => {
      const p = { ...s.postId, id: s.postId._id, savedAt: s.createdAt, isSaved: true };
      return populatePostPresignedUrls(p);
    })
  );

  const nextCursor = hasMore && saves.length > 0 ? makeCursor(saves[saves.length - 1]) : null;

  res.json({
    success: true,
    data: { posts, nextCursor, hasMore },
    requestId: req.requestId,
  });
}
