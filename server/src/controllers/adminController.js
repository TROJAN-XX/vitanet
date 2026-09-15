import { z } from 'zod';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import Session from '../models/Session.js';
import MediaUsage from '../models/MediaUsage.js';
import AuditEvent from '../models/AuditEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { getUsageSummary } from '../services/quotaService.js';
import { cleanOrphanMedia } from '../jobs/orphanCleanup.js';
import {
  GLOBAL_USER_CAP,
  MODERATION_ACTIONS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../config/constants.js';

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

const resolveReportSchema = z.object({
  resolution: z.enum(MODERATION_ACTIONS),
  status: z.enum(['resolved', 'dismissed']).default('resolved'),
  notes: z.string().max(1000).optional(),
});

const updateUserStatusSchema = z.object({
  accountStatus: z.enum(['active', 'suspended', 'banned']),
  reason: z.string().max(500).optional(),
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
        { createdAt: { $lt: date } },
        { createdAt: date, _id: { $lt: new mongoose.Types.ObjectId(id) } },
      ],
    };
  } catch {
    return {};
  }
}

/**
 * GET /admin/stats
 * Platform overview for admin dashboard.
 */
export async function getDashboardStats(req, res) {
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    bannedUsers,
    totalPosts,
    totalComments,
    pendingReports,
    storageSummary,
  ] = await Promise.all([
    User.countDocuments({ accountStatus: { $ne: 'deleted' } }),
    User.countDocuments({ accountStatus: 'active' }),
    User.countDocuments({ accountStatus: 'pending_verification' }),
    User.countDocuments({ accountStatus: 'suspended' }),
    User.countDocuments({ accountStatus: 'banned' }),
    Post.countDocuments({ deletedAt: null }),
    Comment.countDocuments({ deletedAt: null }),
    Report.countDocuments({ status: 'pending' }),
    getUsageSummary(),
  ]);

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
        banned: bannedUsers,
        globalCap: GLOBAL_USER_CAP,
        capacityUsedPercent: ((totalUsers / GLOBAL_USER_CAP) * 100).toFixed(1),
      },
      content: {
        posts: totalPosts,
        comments: totalComments,
      },
      moderation: {
        pendingReports,
      },
      storage: storageSummary,
    },
    requestId: req.requestId,
  });
}

/**
 * GET /admin/reports
 * List moderation reports with optional status filtering.
 */
export async function getReports(req, res) {
  const { status = 'pending' } = req.query;
  const { cursor, limit } = paginationSchema.parse(req.query);

  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  const cursorQuery = await buildCursorQuery(cursor);

  const rawReports = await Report.find({ ...filter, ...cursorQuery })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('reporterId', 'username displayName')
    .populate('reviewedBy', 'username displayName')
    .lean();

  const hasMore = rawReports.length > limit;
  if (hasMore) rawReports.pop();

  // Populate target details
  const reports = await Promise.all(
    rawReports.map(async (r) => {
      let target = null;
      if (r.targetType === 'post') {
        target = await Post.findById(r.targetId)
          .select('caption media authorId moderationStatus deletedAt')
          .populate('authorId', 'username displayName')
          .lean();
      } else if (r.targetType === 'comment') {
        target = await Comment.findById(r.targetId)
          .select('body authorId postId status deletedAt')
          .populate('authorId', 'username displayName')
          .lean();
      } else if (r.targetType === 'user') {
        target = await User.findById(r.targetId)
          .select('username displayName accountStatus role')
          .lean();
      }

      return {
        ...r,
        id: r._id,
        target,
      };
    })
  );

  const nextCursor = hasMore && rawReports.length > 0
    ? makeCursor(rawReports[rawReports.length - 1])
    : null;

  res.json({
    success: true,
    data: { reports, nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * POST /admin/reports/:reportId/resolve
 * Resolve or dismiss a moderation report and execute enforcement.
 */
export async function resolveReport(req, res) {
  const { reportId } = req.params;
  if (!isValidObjectId(reportId)) throw ApiError.badRequest('Invalid report ID');

  const { resolution, status, notes } = resolveReportSchema.parse(req.body);

  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found');

  // Perform moderation enforcement action
  if (resolution === 'remove_content') {
    if (report.targetType === 'post') {
      const post = await Post.findById(report.targetId);
      if (post) {
        post.moderationStatus = 'removed';
        await post.save();

        // Mark media pending deletion
        const keys = post.media.map((m) => m.objectKey);
        if (keys.length > 0) {
          await MediaUsage.updateMany(
            { objectKey: { $in: keys }, status: 'active' },
            { status: 'pending_delete' }
          );
        }
      }
    } else if (report.targetType === 'comment') {
      await Comment.updateOne(
        { _id: report.targetId },
        { status: 'removed', deletedAt: new Date() }
      );
    }
  } else if (resolution === 'suspend_user') {
    let targetUserId = report.targetId;
    if (report.targetType === 'post') {
      const p = await Post.findById(report.targetId);
      if (p) targetUserId = p.authorId;
    } else if (report.targetType === 'comment') {
      const c = await Comment.findById(report.targetId);
      if (c) targetUserId = c.authorId;
    }

    if (targetUserId) {
      await User.updateOne({ _id: targetUserId }, { accountStatus: 'suspended' });
      await Session.updateMany({ userId: targetUserId, revokedAt: null }, { revokedAt: new Date() });
    }
  } else if (resolution === 'ban_user') {
    let targetUserId = report.targetId;
    if (report.targetType === 'post') {
      const p = await Post.findById(report.targetId);
      if (p) targetUserId = p.authorId;
    } else if (report.targetType === 'comment') {
      const c = await Comment.findById(report.targetId);
      if (c) targetUserId = c.authorId;
    }

    if (targetUserId) {
      await User.updateOne({ _id: targetUserId }, { accountStatus: 'banned' });
      await Session.updateMany({ userId: targetUserId, revokedAt: null }, { revokedAt: new Date() });
    }
  }

  report.status = status;
  report.resolution = resolution;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  await report.save();

  await AuditEvent.create({
    actorUserId: req.user._id,
    action: 'report_resolve',
    targetType: 'report',
    targetId: report._id,
    metadata: { resolution, status, notes, targetType: report.targetType, targetId: report.targetId },
  });

  res.json({
    success: true,
    data: { report: report.toJSON() },
    requestId: req.requestId,
  });
}

/**
 * GET /admin/users
 * Search and list users with pagination.
 */
export async function getUsers(req, res) {
  const { cursor, limit } = paginationSchema.parse(req.query);
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.accountStatus = status;
  if (search) {
    filter.$or = [
      { usernameNormalized: { $regex: search.toLowerCase(), $options: 'i' } },
      { emailNormalized: { $regex: search.toLowerCase(), $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
    ];
  }

  const cursorQuery = await buildCursorQuery(cursor);

  const users = await User.find({ ...filter, ...cursorQuery })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .select('-passwordHash')
    .lean();

  const hasMore = users.length > limit;
  if (hasMore) users.pop();

  const nextCursor = hasMore && users.length > 0 ? makeCursor(users[users.length - 1]) : null;

  res.json({
    success: true,
    data: { users: users.map((u) => ({ ...u, id: u._id })), nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * PATCH /admin/users/:userId/status
 * Suspend, ban, or reactivate a user account.
 */
export async function updateUserStatus(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw ApiError.badRequest('Invalid user ID');

  if (userId === req.user._id.toString()) {
    throw ApiError.badRequest('Cannot change your own account status');
  }

  const { accountStatus, reason } = updateUserStatusSchema.parse(req.body);

  const targetUser = await User.findById(userId);
  if (!targetUser) throw ApiError.notFound('User not found');

  if (targetUser.role === 'admin') {
    throw ApiError.forbidden('Cannot modify status of an admin account');
  }

  targetUser.accountStatus = accountStatus;
  await targetUser.save();

  // If suspended or banned, invalidate all sessions immediately
  if (['suspended', 'banned'].includes(accountStatus)) {
    await Session.updateMany({ userId: targetUser._id, revokedAt: null }, { revokedAt: new Date() });
  }

  const actionName =
    accountStatus === 'banned'
      ? 'user_ban'
      : accountStatus === 'suspended'
      ? 'user_suspend'
      : 'user_unsuspend';

  await AuditEvent.create({
    actorUserId: req.user._id,
    action: actionName,
    targetType: 'user',
    targetId: targetUser._id,
    metadata: { reason, newStatus: accountStatus },
  });

  res.json({
    success: true,
    data: { user: targetUser.toJSON() },
    requestId: req.requestId,
  });
}

/**
 * GET /admin/audit-events
 * Audit log viewer for platform governance.
 */
export async function getAuditEvents(req, res) {
  const { cursor, limit } = paginationSchema.parse(req.query);
  const { action, targetType } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;

  const cursorQuery = await buildCursorQuery(cursor);

  const events = await AuditEvent.find({ ...filter, ...cursorQuery })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('actorUserId', 'username displayName')
    .lean();

  const hasMore = events.length > limit;
  if (hasMore) events.pop();

  const nextCursor = hasMore && events.length > 0 ? makeCursor(events[events.length - 1]) : null;

  res.json({
    success: true,
    data: { events: events.map((e) => ({ ...e, id: e._id })), nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * POST /admin/maintenance/orphan-cleanup
 * Trigger orphaned media cleanup job.
 */
export async function triggerOrphanCleanup(req, res) {
  const results = await cleanOrphanMedia();

  res.json({
    success: true,
    data: results,
    requestId: req.requestId,
  });
}

/**
 * GET /admin/usage
 * Detailed storage ledger for media objects and per-user consumption.
 */
export async function getPlatformUsage(req, res) {
  const [activeStats, pendingDeleteCount, userAgg] = await Promise.all([
    MediaUsage.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalBytes: { $sum: '$bytes' }, count: { $sum: 1 } } },
    ]),
    MediaUsage.countDocuments({ status: 'pending_delete' }),
    MediaUsage.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$userId', totalBytes: { $sum: '$bytes' } } },
      { $sort: { totalBytes: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          totalBytes: 1,
        },
      },
    ]),
  ]);

  const totalActiveBytes = activeStats[0]?.totalBytes || 0;
  const totalObjectsCount = activeStats[0]?.count || 0;

  res.json({
    success: true,
    data: {
      totalActiveBytes,
      totalObjectsCount,
      pendingDeleteCount,
      userUsages: userAgg.map((u) => ({
        userId: u.userId,
        username: u.username || 'unknown',
        totalBytes: u.totalBytes,
      })),
    },
    requestId: req.requestId,
  });
}

/**
 * POST /admin/posts/:postId/remove
 * Force take down post with media cascade.
 */
export async function removePost(req, res) {
  const { postId } = req.params;
  const { reason = 'Violated community guidelines' } = req.body || {};

  if (!isValidObjectId(postId)) throw ApiError.badRequest('Invalid post ID');

  const post = await Post.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');

  post.moderationStatus = 'removed';
  post.deletedAt = new Date();
  await post.save();

  // Mark all referenced media as pending_delete
  const objectKeys = post.media.map((m) => m.objectKey);
  if (objectKeys.length > 0) {
    await MediaUsage.updateMany(
      { objectKey: { $in: objectKeys }, status: 'active' },
      { status: 'pending_delete', deletedAt: new Date() }
    );
  }

  // Record immutable audit event
  await AuditEvent.create({
    actorUserId: req.user._id,
    action: 'post_remove',
    targetType: 'post',
    targetId: post._id,
    metadata: { reason, authorId: post.authorId },
  });

  res.json({
    success: true,
    data: { message: 'Post successfully removed by moderation' },
    requestId: req.requestId,
  });
}
