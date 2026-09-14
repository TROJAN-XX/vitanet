import { z } from 'zod';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import MediaUsage from '../models/MediaUsage.js';
import { ApiError } from '../utils/ApiError.js';
import { createPresignedGet } from '../services/r2Service.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants.js';

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
        { createdAt: { $lt: date } },
        { createdAt: date, _id: { $lt: new mongoose.Types.ObjectId(id) } },
      ],
    };
  } catch {
    return {};
  }
}

/**
 * GET /notifications
 */
export async function getNotifications(req, res) {
  const { cursor, limit } = paginationSchema.parse(req.query);
  const cursorQuery = await buildCursorQuery(cursor);

  const rawNotifications = await Notification.find({
    recipientId: req.user._id,
    ...cursorQuery,
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('actorId', 'username displayName avatarMediaId')
    .populate('postId', 'caption media')
    .populate('commentId', 'body')
    .lean();

  const hasMore = rawNotifications.length > limit;
  if (hasMore) rawNotifications.pop();

  const notifications = await Promise.all(
    rawNotifications.map(async (n) => {
      let actorAvatarUrl = null;
      if (n.actorId?.avatarMediaId) {
        const avatar = await MediaUsage.findOne({
          _id: n.actorId.avatarMediaId,
          status: 'active',
        }).lean();
        if (avatar) {
          actorAvatarUrl = await createPresignedGet(avatar.objectKey);
        }
      }

      return {
        id: n._id,
        type: n.type,
        actor: {
          id: n.actorId?._id,
          username: n.actorId?.username,
          displayName: n.actorId?.displayName,
          avatarUrl: actorAvatarUrl,
        },
        post: n.postId
          ? {
              id: n.postId._id,
              caption: n.postId.caption,
            }
          : null,
        comment: n.commentId
          ? {
              id: n.commentId._id,
              body: n.commentId.body,
            }
          : null,
        readAt: n.readAt,
        createdAt: n.createdAt,
      };
    })
  );

  const nextCursor = hasMore && rawNotifications.length > 0
    ? makeCursor(rawNotifications[rawNotifications.length - 1])
    : null;

  res.json({
    success: true,
    data: { notifications, nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * PATCH /notifications/read
 * Mark one or all notifications as read.
 */
export async function markAsRead(req, res) {
  const { notificationId } = req.body || {};

  if (notificationId) {
    if (!isValidObjectId(notificationId)) throw ApiError.badRequest('Invalid ID');
    await Notification.updateOne(
      { _id: notificationId, recipientId: req.user._id },
      { readAt: new Date() }
    );
  } else {
    // Mark all as read
    await Notification.updateMany(
      { recipientId: req.user._id, readAt: null },
      { readAt: new Date() }
    );
  }

  res.json({
    success: true,
    data: { marked: true },
    requestId: req.requestId,
  });
}

/**
 * GET /notifications/unread-count
 */
export async function getUnreadCount(req, res) {
  const count = await Notification.countDocuments({
    recipientId: req.user._id,
    readAt: null,
  });

  res.json({
    success: true,
    data: { unreadCount: count },
    requestId: req.requestId,
  });
}
