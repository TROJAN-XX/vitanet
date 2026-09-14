import { z } from 'zod';
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import AuditEvent from '../models/AuditEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { REPORT_REASONS } from '../config/constants.js';

const submitReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid target ID',
  }),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(1000).default(''),
});

/**
 * POST /reports
 * Submit a report against a post, comment, or user.
 */
export async function submitReport(req, res) {
  const data = submitReportSchema.parse(req.body);
  const reporterId = req.user._id;

  // Prevent reporting self
  if (data.targetType === 'user' && data.targetId === reporterId.toString()) {
    throw ApiError.badRequest('Cannot report yourself');
  }

  // Verify target existence
  let targetExists = false;
  if (data.targetType === 'post') {
    targetExists = await Post.exists({ _id: data.targetId, deletedAt: null });
  } else if (data.targetType === 'comment') {
    targetExists = await Comment.exists({ _id: data.targetId, deletedAt: null });
  } else if (data.targetType === 'user') {
    targetExists = await User.exists({ _id: data.targetId, accountStatus: { $ne: 'deleted' } });
  }

  if (!targetExists) {
    throw ApiError.notFound('Target content or user not found');
  }

  // Check duplicate pending report from same reporter
  const existing = await Report.findOne({
    reporterId,
    targetType: data.targetType,
    targetId: data.targetId,
    status: 'pending',
  });

  if (existing) {
    return res.json({
      success: true,
      data: { message: 'You have already reported this item.', reportId: existing._id },
      requestId: req.requestId,
    });
  }

  const report = await Report.create({
    reporterId,
    targetType: data.targetType,
    targetId: data.targetId,
    reason: data.reason,
    details: data.details,
    status: 'pending',
  });

  await AuditEvent.create({
    actorUserId: reporterId,
    action: 'report_create',
    targetType: 'report',
    targetId: report._id,
    metadata: { reason: data.reason, targetType: data.targetType },
  });

  res.status(201).json({
    success: true,
    data: {
      message: 'Report submitted successfully for review.',
      reportId: report._id,
    },
    requestId: req.requestId,
  });
}
