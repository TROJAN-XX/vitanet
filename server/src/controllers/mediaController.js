import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/ApiError.js';
import UploadSession from '../models/UploadSession.js';
import {
  ALL_ACCEPTED_MIMES, ACCEPTED_IMAGE_MIMES, ACCEPTED_VIDEO_MIMES,
  IMAGE_MAX_BYTES, VIDEO_MAX_BYTES, AVATAR_MAX_BYTES,
  PRESIGNED_PUT_EXPIRY_SECONDS, R2_KEY_PATTERNS,
} from '../config/constants.js';
import { createPresignedPut, headObject, createPresignedGet, batchPresignedGet } from '../services/r2Service.js';
import { checkUploadQuota, recordMediaUsage, markMediaPendingDelete } from '../services/quotaService.js';
import MediaUsage from '../models/MediaUsage.js';

// ── Validation ──

const presignSchema = z.object({
  mimeType: z.string().refine(m => ALL_ACCEPTED_MIMES.includes(m), 'Unsupported file type'),
  bytes: z.number().int().positive(),
  context: z.enum(['post', 'avatar']),
  postId: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().max(30).optional(),
});

const finalizeSchema = z.object({
  uploadId: z.string().min(1),
});

const batchDownloadSchema = z.object({
  objectKeys: z.array(z.string().min(1)).min(1).max(20),
});

// ── Helpers ──

function getExtFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
  };
  return map[mime] || 'bin';
}

function validateSizeForType(mimeType, bytes, context) {
  if (context === 'avatar') {
    if (bytes > AVATAR_MAX_BYTES) {
      throw ApiError.payloadTooLarge(`Avatar exceeds ${AVATAR_MAX_BYTES / (1024*1024)} MB limit`);
    }
    return;
  }

  if (ACCEPTED_IMAGE_MIMES.includes(mimeType) && bytes > IMAGE_MAX_BYTES) {
    throw ApiError.payloadTooLarge(`Image exceeds ${IMAGE_MAX_BYTES / (1024*1024)} MB limit`);
  }

  if (ACCEPTED_VIDEO_MIMES.includes(mimeType) && bytes > VIDEO_MAX_BYTES) {
    throw ApiError.payloadTooLarge(`Video exceeds ${VIDEO_MAX_BYTES / (1024*1024)} MB limit`);
  }
}

// ── Controllers ──

/**
 * POST /media/presign-upload
 * Validates, checks quotas, creates upload session, returns presigned PUT URL.
 */
export async function presignUpload(req, res) {
  const data = presignSchema.parse(req.body);
  const userId = req.user._id.toString();

  // Validate size limits
  validateSizeForType(data.mimeType, data.bytes, data.context);

  // Check quotas
  const quota = await checkUploadQuota(userId, data.bytes);
  if (!quota.allowed) {
    throw ApiError.quotaExceeded(quota.reason);
  }

  // Generate IDs and object key
  const uploadId = uuidv4();
  const mediaId = uuidv4();
  const ext = getExtFromMime(data.mimeType);

  let objectKey;
  if (data.context === 'avatar') {
    objectKey = R2_KEY_PATTERNS.avatar(userId, mediaId);
  } else if (data.postId) {
    objectKey = R2_KEY_PATTERNS.post(data.postId, mediaId, ext);
  } else {
    objectKey = R2_KEY_PATTERNS.temporary(userId, uploadId, ext);
  }

  // Create upload session
  await UploadSession.create({
    userId,
    uploadId,
    objectKey,
    mimeType: data.mimeType,
    expectedBytes: data.bytes,
    status: 'pending',
    expiresAt: new Date(Date.now() + PRESIGNED_PUT_EXPIRY_SECONDS * 1000),
  });

  // Generate presigned PUT URL
  const presignedUrl = await createPresignedPut(objectKey, data.mimeType, data.bytes);

  res.json({
    success: true,
    data: {
      uploadId,
      mediaId,
      objectKey,
      presignedUrl,
      expiresIn: PRESIGNED_PUT_EXPIRY_SECONDS,
    },
    requestId: req.requestId,
  });
}

/**
 * POST /media/finalize-upload
 * Verifies the upload via HeadObject and records media usage.
 */
export async function finalizeUpload(req, res) {
  const { uploadId } = finalizeSchema.parse(req.body);
  const userId = req.user._id.toString();

  const session = await UploadSession.findOne({
    uploadId,
    userId,
    status: 'pending',
  });

  if (!session) {
    throw ApiError.notFound('Upload session not found or already completed');
  }

  // Check if expired
  if (new Date() > session.expiresAt) {
    session.status = 'expired';
    await session.save();
    throw ApiError.badRequest('Upload session expired');
  }

  // Verify object exists in R2
  const head = await headObject(session.objectKey);
  if (!head) {
    session.status = 'failed';
    await session.save();
    throw ApiError.badRequest('File not found in storage. Upload may have failed.');
  }

  // Verify size matches (allow some tolerance for metadata)
  if (head.contentLength > session.expectedBytes * 1.05) {
    session.status = 'failed';
    await session.save();
    throw ApiError.badRequest('Uploaded file size does not match expected size');
  }

  // Record media usage
  const mediaType = ACCEPTED_VIDEO_MIMES.includes(session.mimeType) ? 'video' :
                     session.objectKey.includes('/avatar/') ? 'avatar' : 'image';

  await recordMediaUsage({
    userId,
    objectKey: session.objectKey,
    bytes: head.contentLength,
    mediaType,
  });

  // Mark session complete
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();

  res.json({
    success: true,
    data: {
      objectKey: session.objectKey,
      bytes: head.contentLength,
      mediaType,
    },
    requestId: req.requestId,
  });
}

/**
 * POST /media/presign-download-batch
 * Returns presigned GET URLs for a batch of object keys.
 */
export async function presignDownloadBatch(req, res) {
  const { objectKeys } = batchDownloadSchema.parse(req.body);

  const urls = await batchPresignedGet(objectKeys);

  res.json({
    success: true,
    data: { urls },
    requestId: req.requestId,
  });
}

/**
 * DELETE /media/:mediaId
 * Marks media as pending_delete. Actual R2 deletion happens in maintenance.
 */
export async function deleteMedia(req, res) {
  const { mediaId } = req.params;
  const userId = req.user._id.toString();

  const media = await MediaUsage.findOne({
    _id: mediaId,
    userId,
    status: 'active',
  });

  if (!media) {
    throw ApiError.notFound('Media not found');
  }

  await markMediaPendingDelete(media.objectKey);

  res.json({
    success: true,
    data: { message: 'Media marked for deletion' },
    requestId: req.requestId,
  });
}
