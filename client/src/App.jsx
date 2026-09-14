import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// ── Placeholder pages (will be built in later phases) ──
function HomePage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/feed" replace />;
  return <Navigate to="/login" replace />;
}

function LoginPage() {
  return (
    <div className="page page-narrow animate-fade-in">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-md)' }}>
        Sign In
      </h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>Login page coming in Phase 2</p>
    </div>
  );
}

function RegisterPage() {
  return (
    <div className="page page-narrow animate-fade-in">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-md)' }}>
        Create Account
      </h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>Registration page coming in Phase 2</p>
    </div>
  );
}

function FeedPage() {
  return (
    <div className="page page-narrow animate-fade-in">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)' }}>Feed</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-md)' }}>Following feed coming in Phase 5</p>
    </div>
  );
}

function ExplorePage() {
  return (
    <div className="page page-narrow animate-fade-in">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)' }}>Explore</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-md)' }}>Explore feed coming in Phase 5</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page page-narrow animate-fade-in" style={{ textAlign: 'center', paddingTop: '20vh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        404
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-md)', fontSize: 'var(--text-lg)' }}>
        This page doesn&apos;t exist
      </p>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/explore" element={<ExplorePage />} />
      {/* Remaining routes added in later phases */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
