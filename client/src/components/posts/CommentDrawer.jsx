import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function CommentDrawer({ isOpen, onClose, postId, onCommentAdded, onCommentRemoved }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const { user: currentUser, isAuthenticated } = useAuth();
  const { error: toastError } = useToast();

  useEffect(() => {
    if (!isOpen || !postId) return;

    let cancelled = false;
    async function fetchComments() {
      setLoading(true);
      try {
        const res = await api.get(`/posts/${postId}/comments`);
        if (!cancelled && res?.data?.comments) {
          setComments(res.data.comments);
          setNextCursor(res.data.nextCursor);
          setHasMore(res.data.hasMore);
        }
      } catch (err) {
        if (!cancelled) toastError(err.message || 'Failed to load comments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchComments();
    return () => { cancelled = true; };
  }, [isOpen, postId, toastError]);

  const loadMore = async () => {
    if (!nextCursor || loading) return;
    try {
      setLoading(true);
      const res = await api.get(`/posts/${postId}/comments?cursor=${nextCursor}`);
      if (res?.data?.comments) {
        setComments((prev) => [...prev, ...res.data.comments]);
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load more comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting || !isAuthenticated) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/posts/${postId}/comments`, { body: newComment.trim() });
      setComments((prev) => [res.data.comment, ...prev]);
      setNewComment('');
      onCommentAdded?.();
    } catch (err) {
      toastError(err.message || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      onCommentRemoved?.();
    } catch (err) {
      toastError(err.message || 'Failed to delete comment');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comments" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', height: '420px' }}>
        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {loading && comments.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl) 0' }}>
              <div className="spinner" />
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--color-text-secondary)' }}>
              No comments yet. Be the first to join the conversation!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {comments.map((c) => {
                const isAuthor = currentUser?._id === c.authorId?._id || currentUser?._id === c.authorId;
                const author = c.authorId || {};
                return (
                  <div key={c._id} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
                    <Link to={`/u/${author.username}`} onClick={onClose}>
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
                            fontSize: '11px',
                            fontWeight: 'var(--weight-bold)',
                          }}
                        >
                          {author.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </Link>

                    <div style={{ flex: 1, fontSize: 'var(--text-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Link
                          to={`/u/${author.username}`}
                          onClick={onClose}
                          style={{
                            fontWeight: 'var(--weight-semibold)',
                            color: 'var(--color-text-primary)',
                            marginRight: '6px',
                          }}
                        >
                          {author.displayName || author.username}
                        </Link>
                        {isAuthor && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', cursor: 'pointer' }}
                            aria-label="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                        {c.body}
                      </p>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <button
                  onClick={loadMore}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Load More Comments'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comment Input */}
        {isAuthenticated ? (
          <form
            onSubmit={handleAddComment}
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              paddingTop: 'var(--space-md)',
              borderTop: '1px solid var(--color-glass-border)',
              marginTop: 'var(--space-sm)',
            }}
          >
            <input
              type="text"
              className="input-field"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: 'var(--text-sm)' }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Post'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 'var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            <Link to="/login" style={{ color: 'var(--color-primary-light)' }}>
              Sign in
            </Link>{' '}
            to leave a comment.
          </div>
        )}
      </div>
    </Modal>
  );
}
