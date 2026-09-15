import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MediaCarousel from './MediaCarousel.jsx';
import CommentDrawer from './CommentDrawer.jsx';
import ReportModal from '../moderation/ReportModal.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PostCard({ post, onPostDeleted }) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [saveCount, setSaveCount] = useState(post.saveCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [warningRevealed, setWarningRevealed] = useState(!post.contentWarning);
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const author = post.authorId || {};
  const isAuthor = currentUser?._id === author._id || currentUser?._id === post.authorId;

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextLiked) {
        await api.post(`/posts/${post._id}/like`);
      } else {
        await api.delete(`/posts/${post._id}/like`);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(!nextLiked);
      setLikeCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      toastError(err.message || 'Failed to update like');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSaveCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextSaved) {
        await api.post(`/posts/${post._id}/save`);
        success('Post saved to bookmarks');
      } else {
        await api.delete(`/posts/${post._id}/save`);
        success('Post removed from bookmarks');
      }
    } catch (err) {
      setIsSaved(!nextSaved);
      setSaveCount((prev) => (!nextSaved ? prev + 1 : Math.max(0, prev - 1)));
      toastError(err.message || 'Failed to update save');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${post._id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        success('Post link copied to clipboard!');
      } else {
        prompt('Copy post URL:', url);
      }
    } catch {
      prompt('Copy post URL:', url);
    }
    setMenuOpen(false);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This will also remove media from storage.')) return;

    try {
      await api.delete(`/posts/${post._id}`);
      success('Post deleted');
      onPostDeleted?.(post._id);
    } catch (err) {
      toastError(err.message || 'Failed to delete post');
    }
  };

  return (
    <article
      className="card card-glass animate-fade-in"
      style={{
        padding: 0,
        overflow: 'hidden',
        marginBottom: 'var(--space-xl)',
        border: '1px solid var(--color-glass-border)',
      }}
    >
      {/* Post Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-md)',
        }}
      >
        <Link
          to={`/u/${author.username}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.username} className="avatar avatar-sm" />
          ) : (
            <div
              className="avatar avatar-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gradient-card)',
                fontWeight: 'var(--weight-bold)',
                fontSize: '12px',
              }}
            >
              {author.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                {author.displayName || author.username}
              </span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                @{author.username}
              </span>
            </div>
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
              {formatTimeAgo(post.createdAt)}
            </div>
          </div>
        </Link>

        {/* Options Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="animate-scale-in"
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                width: '160px',
                background: 'var(--color-bg-elevated)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '4px',
                zIndex: 'var(--z-dropdown)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <button
                onClick={handleShare}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Share Link
              </button>

              {isAuthor && (
                <button
                  onClick={handleDeletePost}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--color-error)' }}
                >
                  Delete Post
                </button>
              )}

              {!isAuthor && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setReportModalOpen(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--color-error)' }}
                >
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media with Content Warning Guard */}
      <div style={{ position: 'relative' }}>
        {post.contentWarning && !warningRevealed && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              background: 'rgba(10, 10, 15, 0.92)',
              backdropFilter: 'blur(30px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-xl)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-sm)' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-xs)' }}>
              Content Warning
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)', maxWidth: '320px' }}>
              The author labeled this post: &ldquo;{post.contentWarning}&rdquo;
            </p>
            <button
              onClick={() => setWarningRevealed(true)}
              className="btn btn-secondary btn-sm"
            >
              Show Content
            </button>
          </div>
        )}

        <MediaCarousel media={post.media} />
      </div>

      {/* Action Buttons & Interactions */}
      <div style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {/* Like */}
            <button
              onClick={handleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isLiked ? 'var(--color-warm)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                transition: 'transform var(--transition-fast)',
              }}
              aria-label="Like post"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                {likeCount}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={() => setCommentDrawerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="Comments"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                {commentCount}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="Share post"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>

          {/* Bookmark / Save */}
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isSaved ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label="Save post"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            {saveCount > 0 && (
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                {saveCount}
              </span>
            )}
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-normal)', color: 'var(--color-text-primary)' }}>
            <Link to={`/u/${author.username}`} style={{ fontWeight: 'var(--weight-bold)', color: 'inherit', marginRight: '6px' }}>
              {author.username}
            </Link>
            <span>{post.caption}</span>
          </div>
        )}

        {/* Topics / Tags */}
        {post.topics?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'var(--space-xs)' }}>
            {post.topics.map((t) => (
              <Link
                key={t}
                to={`/explore?topic=${encodeURIComponent(t)}`}
                style={{ fontSize: '11px', color: 'var(--color-primary-light)', textDecoration: 'none' }}
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Comment Drawer */}
      <CommentDrawer
        isOpen={commentDrawerOpen}
        onClose={() => setCommentDrawerOpen(false)}
        postId={post._id}
        onCommentAdded={() => setCommentCount((c) => c + 1)}
        onCommentRemoved={() => setCommentCount((c) => Math.max(0, c - 1))}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="post"
        targetId={post._id}
      />
    </article>
  );
}
