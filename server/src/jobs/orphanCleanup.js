import UploadSession from '../models/UploadSession.js';
import MediaUsage from '../models/MediaUsage.js';
import AuditEvent from '../models/AuditEvent.js';
import { deleteObject } from '../services/r2Service.js';

/**
 * Clean up orphaned media:
 * 1. Expired upload sessions — R2 objects may or may not exist
 * 2. Media marked as pending_delete — remove from R2 and mark deleted
 *
 * Called by admin maintenance endpoint or GitHub Actions cron.
 */
export async function cleanOrphanMedia() {
  const results = { expiredSessions: 0, deletedMedia: 0, errors: [] };

  // 1. Clean expired upload sessions
  const expiredSessions = await UploadSession.find({
    status: 'pending',
    expiresAt: { $lt: new Date() },
  }).limit(100);

  for (const session of expiredSessions) {
    try {
      // Try to delete the R2 object (may not exist if upload never completed)
      await deleteObject(session.objectKey).catch(() => {});
      session.status = 'expired';
      await session.save();
      results.expiredSessions++;
    } catch (err) {
      results.errors.push(`Session ${session.uploadId}: ${err.message}`);
    }
  }

  // 2. Clean pending_delete media
  const pendingDelete = await MediaUsage.find({
    status: 'pending_delete',
  }).limit(100);

  for (const media of pendingDelete) {
    try {
      await deleteObject(media.objectKey);
      media.status = 'deleted';
      await media.save();
      results.deletedMedia++;
    } catch (err) {
      results.errors.push(`Media ${media.objectKey}: ${err.message}`);
    }
  }

  // Audit
  if (results.expiredSessions > 0 || results.deletedMedia > 0) {
    await AuditEvent.create({
      action: 'media_orphan_cleanup',
      targetType: 'system',
      metadata: {
        expiredSessions: results.expiredSessions,
        deletedMedia: results.deletedMedia,
        errors: results.errors.length,
      },
    });
  }

  return results;
}
