import { useState } from 'react';

export default function MediaCarousel({ media = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const currentItem = media[currentIndex];
  const isVideo = currentItem?.mimeType?.startsWith('video/');

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 5',
        maxHeight: '560px',
        background: 'var(--color-bg-primary)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isVideo ? (
        <video
          key={currentItem.downloadUrl}
          src={currentItem.downloadUrl}
          controls
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <img
          key={currentItem.downloadUrl}
          src={currentItem.downloadUrl}
          alt={`Media slide ${currentIndex + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          loading="lazy"
        />
      )}

      {/* Navigation arrows if multiple items */}
      {media.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 0, 0, 0.65)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              backdropFilter: 'blur(4px)',
              zIndex: 2,
            }}
            aria-label="Previous image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 0, 0, 0.65)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              backdropFilter: 'blur(4px)',
              zIndex: 2,
            }}
            aria-label="Next image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              display: 'flex',
              gap: '6px',
              zIndex: 2,
            }}
          >
            {media.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: idx === currentIndex ? '16px' : '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: idx === currentIndex ? 'var(--color-primary-light)' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
