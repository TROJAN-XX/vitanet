import { z } from 'zod';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import Mute from '../models/Mute.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Save from '../models/Save.js';
import MediaUsage from '../models/MediaUsage.js';
import Session from '../models/Session.js';
import Notification from '../models/Notification.js';
import AuditEvent from '../models/AuditEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { createPresignedGet } from '../services/r2Service.js';
import { populatePostPresignedUrls } from './postController.js';
import {
  BIO_MAX_CHARS, DISPLAY_NAME_MAX_CHARS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE,
} from '../config/constants.js';

// ── Validation ──

const updateProfileSchema = z.object({
  displayName: z.string().max(DISPLAY_NAME_MAX_CHARS).optional(),
  bio: z.string().max(BIO_MAX_CHARS).optional(),
  avatarMediaId: z.string().optional().nullable(),
});

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

// ── Helpers ──

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function buildCursorQuery(cursor, sortDir = -1) {
  if (!cursor) return {};
  try {
    const [timestamp, id] = cursor.split('_');
    const date = new Date(parseInt(timestamp));
    if (sortDir === -1) {
      return { $or: [
        { createdAt: { $lt: date } },
        { createdAt: date, _id: { $lt: new mongoose.Types.ObjectId(id) } },
      ]};
    }
    return { $or: [
      { createdAt: { $gt: date } },
      { createdAt: date, _id: { $gt: new mongoose.Types.ObjectId(id) } },
    ]};
  } catch {
    return {};
  }
}

function makeCursor(doc) {
  return `${doc.createdAt.getTime()}_${doc._id}`;
}

// ── Controllers ──

/**
 * GET /users/:username
 */
export async function getProfile(req, res) {
  const { username } = req.params;

  const user = await User.findOne({
    usernameNormalized: username.toLowerCase(),
    accountStatus: { $nin: ['deleted'] },
  });

  if (!user) throw ApiError.notFound('User not found');

  // Check if blocked
  if (req.user) {
    const blocked = await Block.findOne({
      $or: [
        { blockerId: req.user._id, blockedId: user._id },
        { blockerId: user._id, blockedId: req.user._id },
      ],
    });
    if (blocked) throw ApiError.notFound('User not found');
  }

  const profile = user.toJSON();

  // Add relationship info for authenticated users
  if (req.user && req.user._id.toString() !== user._id.toString()) {
    const [isFollowing, isFollowedBy, isBlocked, isMuted] = await Promise.all([
      Follow.exists({ followerId: req.user._id, followingId: user._id }),
      Follow.exists({ followerId: user._id, followingId: req.user._id }),
      Block.exists({ blockerId: req.user._id, blockedId: user._id }),
      Mute.exists({ muterId: req.user._id, mutedId: user._id }),
    ]);
    profile.isFollowing = !!isFollowing;
    profile.isFollowedBy = !!isFollowedBy;
    profile.isBlocked = !!isBlocked;
    profile.isMuted = !!isMuted;
  }

  // Avatar URL
  if (user.avatarMediaId) {
    const { default: MediaUsage } = await import('../models/MediaUsage.js');
    const avatarMedia = await MediaUsage.findOne({ _id: user.avatarMediaId, status: 'active' });
    if (avatarMedia) {
      profile.avatarUrl = await createPresignedGet(avatarMedia.objectKey);
    }
  }

  res.json({
    success: true,
    data: { user: profile },
    requestId: req.requestId,
  });
}

/**
 * PATCH /users/me
 */
export async function updateProfile(req, res) {
  const data = updateProfileSchema.parse(req.body);
  const user = req.user;

  // Explicit field mapping — prevent mass assignment
  if (data.displayName !== undefined) user.displayName = data.displayName;
  if (data.bio !== undefined) user.bio = data.bio;
  if (data.avatarMediaId !== undefined) user.avatarMediaId = data.avatarMediaId;

  await user.save();

  res.json({
    success: true,
    data: { user: user.toJSON() },
    requestId: req.requestId,
  });
}

/**
 * GET /users/:username/posts
 */
export async function getUserPosts(req, res) {
  const { username } = req.params;
  const { cursor, limit } = paginationSchema.parse(req.query);

  const user = await User.findOne({ usernameNormalized: username.toLowerCase() });
  if (!user) throw ApiError.notFound('User not found');

  // Block check
  if (req.user) {
    const blocked = await Block.exists({
      $or: [
        { blockerId: req.user._id, blockedId: user._id },
        { blockerId: user._id, blockedId: req.user._id },
      ],
    });
    if (blocked) throw ApiError.notFound('User not found');
  }

  const cursorQuery = await buildCursorQuery(cursor);
  const filter = {
    authorId: user._id,
    moderationStatus: { $ne: 'removed' },
    deletedAt: null,
    ...cursorQuery,
  };

  // Only show followers_only posts if following or own profile
  if (!req.user || req.user._id.toString() !== user._id.toString()) {
    const isFollowing = req.user ? await Follow.exists({ followerId: req.user._id, followingId: user._id }) : false;
    if (!isFollowing) {
      filter.visibility = 'public';
    }
  }

  const posts = await Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  const nextCursor = hasMore && posts.length > 0 ? makeCursor(posts[posts.length - 1]) : null;

  const postsWithUrls = await Promise.all(
    posts.map(async (p) => {
      const populated = await populatePostPresignedUrls(p);
      return { ...populated, id: populated._id };
    })
  );

  res.json({
    success: true,
    data: {
      posts: postsWithUrls,
      nextCursor,
      hasMore,
    },
    requestId: req.requestId,
  });
}

/**
 * POST /users/:userId/follow
 */
export async function followUser(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest('Invalid user ID');
  if (userId === req.user._id.toString()) throw ApiError.badRequest('Cannot follow yourself');

  const target = await User.findOne({ _id: userId, accountStatus: 'active' });
  if (!target) throw ApiError.notFound('User not found');

  // Check block
  const blocked = await Block.exists({
    $or: [
      { blockerId: req.user._id, blockedId: target._id },
      { blockerId: target._id, blockedId: req.user._id },
    ],
  });
  if (blocked) throw ApiError.notFound('User not found');

  const existing = await Follow.findOne({ followerId: req.user._id, followingId: target._id });
  if (existing) {
    return res.json({ success: true, data: { following: true }, requestId: req.requestId });
  }

  await Follow.create({ followerId: req.user._id, followingId: target._id });

  // Update counters
  await User.updateOne({ _id: req.user._id }, { $inc: { followingCount: 1 } });
  await User.updateOne({ _id: target._id }, { $inc: { followersCount: 1 } });

  // Notification
  await Notification.create({
    recipientId: target._id,
    actorId: req.user._id,
    type: 'follow',
  });

  res.json({ success: true, data: { following: true }, requestId: req.requestId });
}

/**
 * DELETE /users/:userId/follow
 */
export async function unfollowUser(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest('Invalid user ID');

  const deleted = await Follow.findOneAndDelete({
    followerId: req.user._id,
    followingId: userId,
  });

  if (deleted) {
    await User.updateOne({ _id: req.user._id }, { $inc: { followingCount: -1 } });
    await User.updateOne({ _id: userId }, { $inc: { followersCount: -1 } });
  }

  res.json({ success: true, data: { following: false }, requestId: req.requestId });
}

/**
 * POST /users/:userId/block
 */
export async function blockUser(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest('Invalid user ID');
  if (userId === req.user._id.toString()) throw ApiError.badRequest('Cannot block yourself');

  await Block.findOneAndUpdate(
    { blockerId: req.user._id, blockedId: userId },
    { blockerId: req.user._id, blockedId: userId },
    { upsert: true }
  );

  // Remove follows in both directions
  const [f1, f2] = await Promise.all([
    Follow.findOneAndDelete({ followerId: req.user._id, followingId: userId }),
    Follow.findOneAndDelete({ followerId: userId, followingId: req.user._id }),
  ]);

  if (f1) {
    await User.updateOne({ _id: req.user._id }, { $inc: { followingCount: -1 } });
    await User.updateOne({ _id: userId }, { $inc: { followersCount: -1 } });
  }
  if (f2) {
    await User.updateOne({ _id: userId }, { $inc: { followingCount: -1 } });
    await User.updateOne({ _id: req.user._id }, { $inc: { followersCount: -1 } });
  }

  res.json({ success: true, data: { blocked: true }, requestId: req.requestId });
}

/**
 * DELETE /users/:userId/block
 */
export async function unblockUser(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest('Invalid user ID');

  await Block.findOneAndDelete({ blockerId: req.user._id, blockedId: userId });

  res.json({ success: true, data: { blocked: false }, requestId: req.requestId });
}

/**
 * POST /users/:userId/mute
 */
export async function muteUser(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest('Invalid user ID');
  if (userId === req.user._id.toString()) throw ApiError.badRequest('Cannot mute yourself');

  await Mute.findOneAndUpdate(
    { muterId: req.user._id, mutedId: userId },
    { muterId: req.user._id, mutedId: userId },
    { upsert: true }
  );

  res.json({ success: true, data: { muted: true }, requestId: req.requestId });
}

/**
 * DELETE /users/:userId/mute
 */
export async function unmuteUser(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest('Invalid user ID');

  await Mute.findOneAndDelete({ muterId: req.user._id, mutedId: userId });

  res.json({ success: true, data: { muted: false }, requestId: req.requestId });
}

/**
 * GET /users/:username/followers
 */
export async function getFollowers(req, res) {
  const { username } = req.params;
  const { cursor, limit } = paginationSchema.parse(req.query);

  const user = await User.findOne({ usernameNormalized: username.toLowerCase() });
  if (!user) throw ApiError.notFound('User not found');

  const cursorQuery = cursor ? await buildCursorQuery(cursor) : {};
  const follows = await Follow.find({ followingId: user._id, ...cursorQuery })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('followerId', 'username displayName avatarMediaId')
    .lean();

  const hasMore = follows.length > limit;
  if (hasMore) follows.pop();

  const followers = follows.map(f => ({
    ...f.followerId,
    id: f.followerId._id,
    followedAt: f.createdAt,
  }));

  const nextCursor = hasMore && follows.length > 0 ? makeCursor(follows[follows.length - 1]) : null;

  res.json({
    success: true,
    data: { users: followers, nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * GET /users/:username/following
 */
export async function getFollowing(req, res) {
  const { username } = req.params;
  const { cursor, limit } = paginationSchema.parse(req.query);

  const user = await User.findOne({ usernameNormalized: username.toLowerCase() });
  if (!user) throw ApiError.notFound('User not found');

  const cursorQuery = cursor ? await buildCursorQuery(cursor) : {};
  const follows = await Follow.find({ followerId: user._id, ...cursorQuery })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('followingId', 'username displayName avatarMediaId')
    .lean();

  const hasMore = follows.length > limit;
  if (hasMore) follows.pop();

  const following = follows.map(f => ({
    ...f.followingId,
    id: f.followingId._id,
    followedAt: f.createdAt,
  }));

  const nextCursor = hasMore && follows.length > 0 ? makeCursor(follows[follows.length - 1]) : null;

  res.json({
    success: true,
    data: { users: following, nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * GET /users/me/export
 * Exports all user data per DPDP / GDPR data portability.
 */
export async function exportData(req, res) {
  const userId = req.user._id;

  const [userData, posts, comments, followers, following, likes, saves] = await Promise.all([
    User.findById(userId).lean(),
    Post.find({ authorId: userId, deletedAt: null }).lean(),
    Comment.find({ authorId: userId, deletedAt: null }).lean(),
    Follow.find({ followingId: userId }).populate('followerId', 'username displayName').lean(),
    Follow.find({ followerId: userId }).populate('followingId', 'username displayName').lean(),
    Like.find({ userId }).populate('postId', 'caption createdAt').lean(),
    Save.find({ userId }).populate('postId', 'caption createdAt').lean(),
  ]);

  if (!userData) throw ApiError.notFound('User not found');

  // Strip sensitive internal fields
  delete userData.passwordHash;
  delete userData.__v;

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    profile: userData,
    posts: posts.map(p => ({
      id: p._id,
      caption: p.caption,
      media: p.media,
      topics: p.topics,
      visibility: p.visibility,
      likeCount: p.likeCount,
      saveCount: p.saveCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt,
    })),
    comments: comments.map(c => ({
      id: c._id,
      postId: c.postId,
      body: c.body,
      createdAt: c.createdAt,
    })),
    followers: followers.map(f => f.followerId),
    following: following.map(f => f.followingId),
    likes: likes.map(l => ({ postId: l.postId?._id, createdAt: l.createdAt })),
    saves: saves.map(s => ({ postId: s.postId?._id, createdAt: s.createdAt })),
  };

  res.json({
    success: true,
    data: exportPayload,
    requestId: req.requestId,
  });
}

/**
 * DELETE /users/me
 * Soft deletes user account, revokes all sessions, and marks media for cleanup.
 */
export async function deleteAccount(req, res) {
  const { password } = z.object({ password: z.string().min(1) }).parse(req.body);

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) throw ApiError.badRequest('Incorrect password');

  // Mark user as deleted
  user.accountStatus = 'deleted';
  user.deletedAt = new Date();
  await user.save();

  // Soft delete posts
  await Post.updateMany({ authorId: user._id }, { deletedAt: new Date() });

  // Mark all active media usage as pending_delete for orphan cleanup
  await MediaUsage.updateMany({ userId: user._id, status: 'active' }, { status: 'pending_delete' });

  // Invalidate all active sessions
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });

  // Clear refresh token cookie
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });

  // Audit log
  await AuditEvent.create({
    actorUserId: user._id,
    action: 'user_delete',
    targetType: 'user',
    targetId: user._id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: { message: 'Your account has been scheduled for deletion.' },
    requestId: req.requestId,
  });
}

