import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AdminRoute from './components/auth/AdminRoute.jsx';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// Core Feed & Post Pages
import FeedPage from './pages/feed/FeedPage.jsx';
import ExplorePage from './pages/feed/ExplorePage.jsx';
import CreatePostPage from './pages/feed/CreatePostPage.jsx';
import PostDetailPage from './pages/feed/PostDetailPage.jsx';
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';

// Profile & Social Graph
import ProfilePage from './pages/profile/ProfilePage.jsx';

// Administration & Moderation
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminUsagePage from './pages/admin/AdminUsagePage.jsx';

// Settings & Legal
import SettingsPage from './pages/settings/SettingsPage.jsx';
import DataExportPage from './pages/settings/DataExportPage.jsx';
import DeleteAccountPage from './pages/settings/DeleteAccountPage.jsx';
import LegalPage from './pages/legal/LegalPage.jsx';

function HomePage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/feed" replace />;
  return <Navigate to="/login" replace />;
}

function NotFoundPage() {
  return (
    <div className="page page-narrow animate-fade-in" style={{ textAlign: 'center', paddingTop: '20vh' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-4xl)',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 'var(--space-md)',
        }}
      >
        404
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-lg)' }}>
        This page doesn&apos;t exist
      </p>
      <a href="/" className="btn btn-primary">
        Return Home
      </a>
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
      {/* Public & Auth Entry */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/legal" element={<LegalPage />} />

      {/* Authenticated Feed & Interaction Routes */}
      <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
      <Route path="/p/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
      <Route path="/u/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* Settings & Privacy Routes */}
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/settings/export" element={<ProtectedRoute><DataExportPage /></ProtectedRoute>} />
      <Route path="/settings/delete" element={<ProtectedRoute><DeleteAccountPage /></ProtectedRoute>} />

      {/* Administrative & Moderation Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute requireAdminOnly><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/usage" element={<AdminRoute><AdminUsagePage /></AdminRoute>} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
