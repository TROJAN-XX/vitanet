import { useState, useCallback } from 'react';
import api from '../api/client.js';

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;
const JPEG_QUALITY = 0.85;

/**
 * Resizes an image file in-browser using HTML5 Canvas and strips EXIF metadata.
 * @param {File} file
 * @returns {Promise<{ blob: Blob, width: number, height: number, mimeType: string }>}
 */
export async function processImageOnCanvas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let { width, height } = img;

        // Scale proportionally if larger than maximum constraints
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        // Draw image onto canvas (automatically strips EXIF/GPS metadata)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized blob
        const outputMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas export to blob failed'));
              return;
            }
            resolve({
              blob,
              width,
              height,
              mimeType: outputMime,
            });
          },
          outputMime,
          JPEG_QUALITY
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Hook to manage media processing, presigning, R2 direct upload, and finalization.
 */
export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [error, setError] = useState(null);

  /**
   * Upload a single media file directly to R2.
   * @param {File} file
   * @param {'post'|'avatar'|'header'} purpose
   */
  const uploadMedia = useCallback(async (file, purpose = 'post') => {
    setUploading(true);
    setProgress(5);
    setError(null);

    try {
      let uploadBlob = file;
      let mimeType = file.type;
      let width = null;
      let height = null;

      // 1. Client-side canvas resize & EXIF stripping for images
      if (file.type.startsWith('image/')) {
        setProgress(15);
        const processed = await processImageOnCanvas(file);
        uploadBlob = processed.blob;
        mimeType = processed.mimeType;
        width = processed.width;
        height = processed.height;
      }

      setProgress(30);

      // 2. Request presigned upload URL from backend
      const presignRes = await api.post('/media/presign-upload', {
        fileName: file.name,
        fileSizeBytes: uploadBlob.size,
        mimeType,
        purpose,
      });

      const { uploadToken, presignedUrl } = presignRes.data;
      setProgress(50);

      // 3. Upload directly to Cloudflare R2 using presigned PUT URL
      await api.uploadToPresignedUrl(presignedUrl, uploadBlob, mimeType);
      setProgress(85);

      // 4. Finalize upload with backend verification
      const finalizeRes = await api.post('/media/finalize-upload', {
        uploadToken,
        width,
        height,
      });

      setProgress(100);
      return {
        ...finalizeRes.data,
        previewUrl: URL.createObjectURL(uploadBlob),
      };
    } catch (err) {
      setError(err.message || 'Media upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploadMedia,
    uploading,
    progress,
    error,
  };
}
