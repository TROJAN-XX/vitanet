import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '../config/env.js';
import { PRESIGNED_PUT_EXPIRY_SECONDS, PRESIGNED_GET_EXPIRY_SECONDS } from '../config/constants.js';

/**
 * S3-compatible client for Cloudflare R2.
 * Browser never receives R2 credentials — only short-lived presigned URLs.
 */
const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;

/**
 * Generate a presigned PUT URL for direct browser upload.
 * @param {string} objectKey - R2 object key
 * @param {string} contentType - MIME type
 * @param {number} contentLength - Expected file size in bytes
 * @returns {Promise<string>} Presigned PUT URL (10-minute expiry)
 */
export async function createPresignedPut(objectKey, contentType, contentLength) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_PUT_EXPIRY_SECONDS });
}

/**
 * Generate a presigned GET URL for browser download.
 * @param {string} objectKey - R2 object key
 * @returns {Promise<string>} Presigned GET URL (15-minute expiry)
 */
export async function createPresignedGet(objectKey) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_GET_EXPIRY_SECONDS });
}

/**
 * Verify an uploaded object exists and matches expected properties.
 * @param {string} objectKey
 * @returns {Promise<{ contentLength: number, contentType: string } | null>}
 */
export async function headObject(objectKey) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    });

    const response = await s3Client.send(command);
    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Delete an object from R2.
 * @param {string} objectKey
 */
export async function deleteObject(objectKey) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  });

  await s3Client.send(command);
}

/**
 * Generate presigned GET URLs for a batch of object keys.
 * @param {string[]} objectKeys
 * @returns {Promise<Record<string, string>>} Map of objectKey -> presigned URL
 */
export async function batchPresignedGet(objectKeys) {
  const entries = await Promise.all(
    objectKeys.map(async (key) => {
      const url = await createPresignedGet(key);
      return [key, url];
    })
  );
  return Object.fromEntries(entries);
}
