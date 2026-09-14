import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AppShell from '../../components/layout/AppShell.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res?.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setMarking(true);
      await api.post('/notifications/mark-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      success('All notifications marked as read');
    } catch (err) {
      toastError(err.message || 'Failed to mark notifications read');
    } finally {
      setMarking(false);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'like':
        return (
          <span style={{ color: 'var(--color-warm)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </span>
        );
      case 'comment':
        return (
          <span style={{ color: 'var(--color-accent)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
        );
      case 'follow':
        return (
          <span style={{ color: 'var(--color-primary-light)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
              Notifications
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              Activity from your followers and creative network
            </p>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-ghost btn-sm"
              disabled={marking}
            >
              {marking ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card skeleton" style={{ height: '70px' }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="card card-glass"
            style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-lg)', color: 'var(--color-text-secondary)' }}
          >
            <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-sm)' }}>🔔</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' }}>
              All Caught Up
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
              No new notifications right now.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {notifications.map((notif) => {
              const actor = notif.actorId || {};
              return (
                <div
                  key={notif._id}
                  className="card card-glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-md)',
                    background: notif.isRead ? 'var(--color-glass)' : 'rgba(124, 92, 252, 0.08)',
                    borderColor: notif.isRead ? 'var(--color-glass-border)' : 'rgba(124, 92, 252, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{ position: 'relative' }}>
                      <Link to={`/u/${actor.username}`}>
                        {actor.avatarUrl ? (
                          <img src={actor.avatarUrl} alt={actor.username} className="avatar avatar-sm" />
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
                            {actor.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </Link>

                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-4px',
                          background: 'var(--color-bg-primary)',
                          borderRadius: 'var(--radius-full)',
                          padding: '2px',
                          display: 'flex',
                        }}
                      >
                        {renderIcon(notif.type)}
                      </div>
                    </div>

                    <div style={{ fontSize: 'var(--text-sm)' }}>
                      <div>
                        <Link to={`/u/${actor.username}`} style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                          {actor.displayName || actor.username}
                        </Link>{' '}
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {notif.type === 'like' && 'liked your post'}
                          {notif.type === 'comment' && 'commented on your post'}
                          {notif.type === 'follow' && 'started following you'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', marginTop: '2px' }}>
                        {formatTimeAgo(notif.createdAt)}
                      </div>
                    </div>
                  </div>

                  {notif.postId && (
                    <Link
                      to={`/p/${notif.postId}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 'var(--text-xs)', padding: '4px 10px' }}
                    >
                      View Post
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
