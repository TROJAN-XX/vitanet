import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function UserListModal({ isOpen, onClose, username, type = 'followers' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const { user: currentUser } = useAuth();
  const { error: toastError } = useToast();

  useEffect(() => {
    if (!isOpen || !username) return;

    let cancelled = false;
    async function fetchList() {
      setLoading(true);
      try {
        const res = await api.get(`/users/${username}/${type}`);
        if (!cancelled && res?.data?.users) {
          setUsers(res.data.users);
          setNextCursor(res.data.nextCursor);
          setHasMore(res.data.hasMore);
        }
      } catch (err) {
        if (!cancelled) toastError(err.message || 'Failed to load user list');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchList();
    return () => { cancelled = true; };
  }, [isOpen, username, type, toastError]);

  const loadMore = async () => {
    if (!nextCursor || loading) return;
    try {
      setLoading(true);
      const res = await api.get(`/users/${username}/${type}?cursor=${nextCursor}`);
      if (res?.data?.users) {
        setUsers((prev) => [...prev, ...res.data.users]);
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load more users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetUser) => {
    try {
      if (targetUser.isFollowing) {
        await api.delete(`/users/${targetUser._id}/follow`);
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, isFollowing: false } : u))
        );
      } else {
        await api.post(`/users/${targetUser._id}/follow`);
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, isFollowing: true } : u))
        );
      }
    } catch (err) {
      toastError(err.message || 'Failed to update follow relationship');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'followers' ? 'Followers' : 'Following'}
      maxWidth="420px"
    >
      {loading && users.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl) 0' }}>
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--color-text-secondary)' }}>
          No users found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {users.map((u) => {
            const isMe = currentUser?._id === u._id;
            return (
              <div
                key={u._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-sm) 0',
                }}
              >
                <Link
                  to={`/u/${u.username}`}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.username} className="avatar avatar-sm" />
                  ) : (
                    <div
                      className="avatar avatar-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--gradient-card)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-bold)',
                      }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {u.displayName || u.username}
                    </div>
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                      @{u.username}
                    </div>
                  </div>
                </Link>

                {!isMe && (
                  <button
                    onClick={() => handleToggleFollow(u)}
                    className={`btn btn-sm ${u.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ minWidth: '85px' }}
                  >
                    {u.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={loadMore}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: 'var(--space-sm)' }}
              disabled={loading}
            >
              {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Load More'}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
