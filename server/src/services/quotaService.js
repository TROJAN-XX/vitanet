import MediaUsage from '../models/MediaUsage.js';
import env from '../config/env.js';
import {
  PER_USER_MEDIA_QUOTA_BYTES,
  GLOBAL_MEDIA_CAP_BYTES,
} from '../config/constants.js';

/**
 * Get total active media bytes for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUserMediaBytes(userId) {
  const result = await MediaUsage.aggregate([
    { $match: { userId: userId, status: 'active' } },
    { $group: { _id: null, totalBytes: { $sum: '$bytes' } } },
  ]);
  return result[0]?.totalBytes || 0;
}

/**
 * Get total active media bytes globally.
 * @returns {Promise<number>}
 */
export async function getGlobalMediaBytes() {
  const result = await MediaUsage.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, totalBytes: { $sum: '$bytes' } } },
  ]);
  return result[0]?.totalBytes || 0;
}

/**
 * Check if a user can upload the given number of bytes.
 * @param {string} userId
 * @param {number} bytes - Size of proposed upload
 * @returns {Promise<{ allowed: boolean, reason?: string, userUsed?: number, globalUsed?: number }>}
 */
export async function checkUploadQuota(userId, bytes) {
  const [userBytes, globalBytes] = await Promise.all([
    getUserMediaBytes(userId),
    getGlobalMediaBytes(),
  ]);

  const userLimit = PER_USER_MEDIA_QUOTA_BYTES;
  const globalLimit = env.GLOBAL_MEDIA_CAP_BYTES || GLOBAL_MEDIA_CAP_BYTES;

  if (userBytes + bytes > userLimit) {
    return {
      allowed: false,
      reason: `Per-user storage quota exceeded. Used: ${formatBytes(userBytes)}, limit: ${formatBytes(userLimit)}`,
      userUsed: userBytes,
      globalUsed: globalBytes,
    };
  }

  if (globalBytes + bytes > globalLimit) {
    return {
      allowed: false,
      reason: 'Global media storage cap reached. The platform cannot accept new uploads at this time.',
      userUsed: userBytes,
      globalUsed: globalBytes,
    };
  }

  return {
    allowed: true,
    userUsed: userBytes,
    globalUsed: globalBytes,
  };
}

/**
 * Record media usage after a finalized upload.
 * @param {{ userId: string, objectKey: string, bytes: number, mediaType: string }} data
 */
export async function recordMediaUsage({ userId, objectKey, bytes, mediaType }) {
  await MediaUsage.create({
    userId,
    objectKey,
    bytes,
    mediaType,
    status: 'active',
  });
}

/**
 * Mark media as pending deletion.
 * @param {string} objectKey
 */
export async function markMediaPendingDelete(objectKey) {
  await MediaUsage.updateOne(
    { objectKey, status: 'active' },
    { status: 'pending_delete', deletedAt: new Date() }
  );
}

/**
 * Get usage summary for admin dashboard.
 */
export async function getUsageSummary() {
  const [globalBytes, userCount, mediaCount] = await Promise.all([
    getGlobalMediaBytes(),
    MediaUsage.distinct('userId', { status: 'active' }).then(ids => ids.length),
    MediaUsage.countDocuments({ status: 'active' }),
  ]);

  return {
    globalBytesUsed: globalBytes,
    globalBytesLimit: env.GLOBAL_MEDIA_CAP_BYTES || GLOBAL_MEDIA_CAP_BYTES,
    globalPercentUsed: ((globalBytes / (env.GLOBAL_MEDIA_CAP_BYTES || GLOBAL_MEDIA_CAP_BYTES)) * 100).toFixed(1),
    activeUsersWithMedia: userCount,
    activeMediaFiles: mediaCount,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
