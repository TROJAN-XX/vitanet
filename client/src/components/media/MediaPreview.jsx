export default function MediaPreview({ items = [], onRemove }) {
  if (!items || items.length === 0) return null;

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 'var(--space-md)',
        margin: 'var(--space-md) 0',
      }}
    >
      {items.map((item, idx) => (
        <div
          key={item.mediaId || item.objectKey || idx}
          className="animate-scale-in"
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            aspectRatio: '1',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          {item.mimeType?.startsWith('video/') ? (
            <video
              src={item.previewUrl || item.downloadUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
            />
          ) : (
            <img
              src={item.previewUrl || item.downloadUrl}
              alt="Upload preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Size badge */}
          {item.byteSize && (
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(4px)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {formatBytes(item.byteSize)}
            </div>
          )}

          {/* Remove Button */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(idx);
              }}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0, 0, 0, 0.75)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label="Remove media"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
