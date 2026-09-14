import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../api/client.js';

export default function TopBar() {
  const { user, isAuthenticated, isAdmin, isModerator, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    async function fetchUnread() {
      try {
        const res = await api.get('/notifications/unread-count');
        if (!cancelled && res?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch {
        // silent fail
      }
    }

    fetchUnread();
    const timer = setInterval(fetchUnread, 60000); // refresh every minute

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isAuthenticated, location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-height)',
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-glass-border)',
        zIndex: 'var(--z-sticky)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-lg)',
      }}
    >
      {/* Brand */}
      <Link
        to={isAuthenticated ? '/feed' : '/'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'var(--weight-extrabold)',
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          V
        </div>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-bold)',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          VitaNet
        </span>
      </Link>

      {/* Navigation Desktop */}
      {isAuthenticated && (
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
          className="nav-desktop"
        >
          <Link
            to="/feed"
            className="btn btn-ghost btn-sm"
            style={{
              color: location.pathname === '/feed' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
              fontWeight: location.pathname === '/feed' ? 'var(--weight-bold)' : 'var(--weight-medium)',
            }}
          >
            Feed
          </Link>
          <Link
            to="/explore"
            className="btn btn-ghost btn-sm"
            style={{
              color: location.pathname === '/explore' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
              fontWeight: location.pathname === '/explore' ? 'var(--weight-bold)' : 'var(--weight-medium)',
            }}
          >
            Explore
          </Link>
          <Link
            to="/create"
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create
          </Link>
        </nav>
      )}

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {isAuthenticated ? (
          <>
            {/* Notification bell */}
            <Link
              to="/notifications"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                color: location.pathname === '/notifications' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                transition: 'color var(--transition-fast)',
              }}
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-warm)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'var(--weight-bold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 0 8px rgba(255, 107, 107, 0.6)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  padding: '2px',
                  borderRadius: 'var(--radius-full)',
                }}
                aria-label="User menu"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="avatar avatar-sm"
                  />
                ) : (
                  <div
                    className="avatar avatar-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--gradient-card)',
                      color: 'var(--color-text-primary)',
                      fontWeight: 'var(--weight-bold)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div
                  className="animate-scale-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '200px',
                    background: 'var(--color-bg-elevated)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 'var(--space-xs)',
                    zIndex: 'var(--z-dropdown)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      borderBottom: '1px solid var(--color-border)',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                      {user?.displayName || user?.username}
                    </div>
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                      @{user?.username}
                    </div>
                  </div>

                  <Link
                    to={`/u/${user?.username}`}
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>

                  {(isAdmin || isModerator) && (
                    <Link
                      to="/admin"
                      className="btn btn-ghost btn-sm"
                      style={{
                        justifyContent: 'flex-start',
                        width: '100%',
                        color: 'var(--color-accent)',
                      }}
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <Link
                    to="/legal"
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--color-text-tertiary)' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Terms & Privacy
                  </Link>

                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm"
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%',
                      color: 'var(--color-error)',
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
