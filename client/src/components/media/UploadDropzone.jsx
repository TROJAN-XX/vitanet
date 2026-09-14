import { useState, useRef } from 'react';
import { useMediaUpload } from '../../hooks/useMediaUpload.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function UploadDropzone({ onMediaUploaded, maxFiles = 4, currentCount = 0, purpose = 'post' }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadMedia, uploading, progress } = useMediaUpload();
  const { error: toastError } = useToast();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    if (currentCount + files.length > maxFiles) {
      toastError(`You can only upload up to ${maxFiles} media items.`);
      return;
    }

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toastError(`Unsupported file format: ${file.name}`);
        continue;
      }

      // Check raw file size limit: 25MB for video, 15MB for image before resize
      const maxRawBytes = file.type.startsWith('video/') ? 25 * 1024 * 1024 : 15 * 1024 * 1024;
      if (file.size > maxRawBytes) {
        toastError(`File exceeds maximum size (${file.type.startsWith('video/') ? '25MB' : '15MB'})`);
        continue;
      }

      try {
        const item = await uploadMedia(file, purpose);
        onMediaUploaded?.(item);
      } catch (err) {
        toastError(err.message || `Failed to upload ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        textAlign: 'center',
        background: isDragOver ? 'rgba(124, 92, 252, 0.08)' : 'var(--color-glass)',
        cursor: uploading ? 'wait' : 'pointer',
        transition: 'all var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={purpose === 'post' ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />

      {uploading ? (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
            Processing & Direct R2 Upload... {progress}%
          </div>
          <div
            style={{
              width: '200px',
              height: '6px',
              background: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginTop: 'var(--space-xs)',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--gradient-primary)',
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-light)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
              Click to upload
            </span>{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>or drag and drop</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            JPEG, PNG, WebP (auto-resized) or MP4/WebM (max 25MB). {maxFiles - currentCount} remaining.
          </div>
        </div>
      )}
    </div>
  );
}
