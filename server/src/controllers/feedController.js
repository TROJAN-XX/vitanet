import { z } from 'zod';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import Mute from '../models/Mute.js';
import Like from '../models/Like.js';
import Save from '../models/Save.js';
import { populatePostPresignedUrls } from './postController.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  EXPLORE_SCORE_WEIGHTS,
} from '../config/constants.js';

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

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
 * GET /feed/following
 * Chronological feed of posts from accounts the user follows.
 * Excludes muted, blocked, removed, or deleted posts.
 */
export async function getFollowingFeed(req, res) {
  const { cursor, limit } = paginationSchema.parse(req.query);
  const userId = req.user._id;

  // 1. Get followed user IDs
  const follows = await Follow.find({ followerId: userId }).select('followingId').lean();
  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return res.json({
      success: true,
      data: { posts: [], nextCursor: null, hasMore: false },
      requestId: req.requestId,
    });
  }

  // 2. Get blocked and muted IDs
  const [blocks, mutes] = await Promise.all([
    Block.find({
      $or: [{ blockerId: userId }, { blockedId: userId }],
    }).lean(),
    Mute.find({ muterId: userId }).lean(),
  ]);

  const excludedIdSet = new Set();
  blocks.forEach((b) => {
    excludedIdSet.add(b.blockerId.toString());
    excludedIdSet.add(b.blockedId.toString());
  });
  mutes.forEach((m) => {
    excludedIdSet.add(m.mutedId.toString());
  });

  const validAuthorIds = followingIds.filter(
    (id) => !excludedIdSet.has(id.toString())
  );

  if (validAuthorIds.length === 0) {
    return res.json({
      success: true,
      data: { posts: [], nextCursor: null, hasMore: false },
      requestId: req.requestId,
    });
  }

  // 3. Query chronological feed
  const cursorQuery = await buildCursorQuery(cursor);
  const filter = {
    authorId: { $in: validAuthorIds },
    deletedAt: null,
    moderationStatus: { $ne: 'removed' },
    ...cursorQuery,
  };

  const rawPosts = await Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('authorId', 'username displayName avatarMediaId')
    .lean();

  const hasMore = rawPosts.length > limit;
  if (hasMore) rawPosts.pop();

  const postIds = rawPosts.map((p) => p._id);

  // 4. Batch lookup like and save status
  const [userLikes, userSaves] = await Promise.all([
    Like.find({ userId, postId: { $in: postIds } }).select('postId').lean(),
    Save.find({ userId, postId: { $in: postIds } }).select('postId').lean(),
  ]);

  const likedPostIds = new Set(userLikes.map((l) => l.postId.toString()));
  const savedPostIds = new Set(userSaves.map((s) => s.postId.toString()));

  // 5. Presign URLs and format response
  const posts = await Promise.all(
    rawPosts.map(async (p) => {
      const formatted = {
        ...p,
        id: p._id,
        isLiked: likedPostIds.has(p._id.toString()),
        isSaved: savedPostIds.has(p._id.toString()),
      };
      return populatePostPresignedUrls(formatted);
    })
  );

  const nextCursor = hasMore && rawPosts.length > 0 ? makeCursor(rawPosts[rawPosts.length - 1]) : null;

  res.json({
    success: true,
    data: { posts, nextCursor, hasMore },
    requestId: req.requestId,
  });
}

/**
 * GET /feed/explore
 * Transparent algorithm explore feed ranked by:
 * score = (2*likes + 3*saves + 2*comments + 1) / pow(ageHours + 2, 1.2)
 */
export async function getExploreFeed(req, res) {
  const { cursor, limit } = paginationSchema.parse(req.query);

  // Blocked user exclusion if viewer is authenticated
  const excludedAuthorIds = [];
  if (req.user) {
    const blocks = await Block.find({
      $or: [{ blockerId: req.user._id }, { blockedId: req.user._id }],
    }).lean();

    blocks.forEach((b) => {
      if (b.blockerId.toString() !== req.user._id.toString()) {
        excludedAuthorIds.push(b.blockerId);
      }
      if (b.blockedId.toString() !== req.user._id.toString()) {
        excludedAuthorIds.push(b.blockedId);
      }
    });
  }

  const matchFilter = {
    visibility: 'public',
    deletedAt: null,
    moderationStatus: 'approved',
  };

  if (excludedAuthorIds.length > 0) {
    matchFilter.authorId = { $nin: excludedAuthorIds };
  }

  // Parse explore cursor (score_id) or fallback to offset
  let skip = 0;
  if (cursor && !cursor.includes('_')) {
    skip = parseInt(cursor, 10) || 0;
  }

  const {
    likeWeight,
    saveWeight,
    commentWeight,
    baseOffset,
    ageOffsetHours,
    decayExponent,
  } = EXPLORE_SCORE_WEIGHTS;

  const now = new Date();

  // MongoDB Aggregation Pipeline for Explore Scoring
  const pipeline = [
    { $match: matchFilter },
    {
      $addFields: {
        ageHours: {
          $divide: [{ $subtract: [now, '$createdAt'] }, 1000 * 60 * 60],
        },
      },
    },
    {
      $addFields: {
        rankingScore: {
          $divide: [
            {
              $add: [
                { $multiply: ['$likeCount', likeWeight] },
                { $multiply: ['$saveCount', saveWeight] },
                { $multiply: ['$commentCount', commentWeight] },
                baseOffset,
              ],
            },
            {
              $pow: [
                { $add: ['$ageHours', ageOffsetHours] },
                decayExponent,
              ],
            },
          ],
        },
      },
    },
    { $sort: { rankingScore: -1, createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $project: {
        _id: 1,
        caption: 1,
        media: 1,
        visibility: 1,
        contentWarning: 1,
        topics: 1,
        likeCount: 1,
        saveCount: 1,
        commentCount: 1,
        createdAt: 1,
        updatedAt: 1,
        rankingScore: 1,
        authorId: {
          _id: '$author._id',
          username: '$author.username',
          displayName: '$author.displayName',
          avatarMediaId: '$author.avatarMediaId',
        },
      },
    },
  ];

  const rawPosts = await Post.aggregate(pipeline);

  const hasMore = rawPosts.length > limit;
  if (hasMore) rawPosts.pop();

  const postIds = rawPosts.map((p) => p._id);

  // Check liked and saved for viewer
  let likedPostIds = new Set();
  let savedPostIds = new Set();

  if (req.user && postIds.length > 0) {
    const [userLikes, userSaves] = await Promise.all([
      Like.find({ userId: req.user._id, postId: { $in: postIds } }).select('postId').lean(),
      Save.find({ userId: req.user._id, postId: { $in: postIds } }).select('postId').lean(),
    ]);
    likedPostIds = new Set(userLikes.map((l) => l.postId.toString()));
    savedPostIds = new Set(userSaves.map((s) => s.postId.toString()));
  }

  const posts = await Promise.all(
    rawPosts.map(async (p) => {
      const formatted = {
        ...p,
        id: p._id,
        isLiked: likedPostIds.has(p._id.toString()),
        isSaved: savedPostIds.has(p._id.toString()),
      };
      return populatePostPresignedUrls(formatted);
    })
  );

  const nextCursor = hasMore ? String(skip + limit) : null;

  res.json({
    success: true,
    data: { posts, nextCursor, hasMore },
    requestId: req.requestId,
  });
}
