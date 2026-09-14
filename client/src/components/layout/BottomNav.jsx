import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'rgba(10, 10, 15, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--color-glass-border)',
        zIndex: 'var(--z-sticky)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 var(--space-sm)',
      }}
      className="nav-mobile"
    >
      {/* Feed */}
      <Link
        to="/feed"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: isActive('/feed') ? 'var(--color-primary-light)' : 'var(--color-text-tertiary)',
          fontSize: 'var(--text-xs)',
          textDecoration: 'none',
          padding: '6px 12px',
          transition: 'color var(--transition-fast)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive('/feed') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Feed</span>
      </Link>

      {/* Explore */}
      <Link
        to="/explore"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: isActive('/explore') ? 'var(--color-primary-light)' : 'var(--color-text-tertiary)',
          fontSize: 'var(--text-xs)',
          textDecoration: 'none',
          padding: '6px 12px',
          transition: 'color var(--transition-fast)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
        <span>Explore</span>
      </Link>

      {/* Create Button */}
      <Link
        to="/create"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--gradient-primary)',
          color: 'white',
          boxShadow: 'var(--shadow-glow)',
          transform: 'translateY(-6px)',
          textDecoration: 'none',
        }}
        aria-label="Create Post"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>

      {/* Notifications */}
      <Link
        to="/notifications"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: isActive('/notifications') ? 'var(--color-primary-light)' : 'var(--color-text-tertiary)',
          fontSize: 'var(--text-xs)',
          textDecoration: 'none',
          padding: '6px 12px',
          transition: 'color var(--transition-fast)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive('/notifications') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span>Alerts</span>
      </Link>

      {/* Profile */}
      <Link
        to={`/u/${user?.username}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: isActive(`/u/${user?.username}`) ? 'var(--color-primary-light)' : 'var(--color-text-tertiary)',
          fontSize: 'var(--text-xs)',
          textDecoration: 'none',
          padding: '6px 12px',
          transition: 'color var(--transition-fast)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive(`/u/${user?.username}`) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Me</span>
      </Link>
    </nav>
  );
}
