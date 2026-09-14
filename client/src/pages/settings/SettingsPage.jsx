import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import api from '../../api/client.js';

export default function SettingsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toastError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toastError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '580px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)' }}>
          Settings
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Account Overview Card */}
          <div className="card card-glass">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)' }}>
              Account Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', fontSize: 'var(--text-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Username</span>
                <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>@{user?.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Email</span>
                <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>{user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Member Role</span>
                <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{user?.role || 'user'}</span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card card-glass">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)' }}>
              Change Password
            </h2>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  className="input-field"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: 'var(--space-xs)' }}
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Privacy & Data Card */}
          <div className="card card-glass">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-xs)' }}>
              Data & Privacy (GDPR / DPDP)
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
              VitaNet respects complete digital sovereignty and zero-data monetisation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Link
                to="/settings/export"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>Download My Data Archive (JSON)</span>
                <span>↓</span>
              </Link>

              <Link
                to="/settings/delete"
                className="btn btn-ghost"
                style={{ justifyContent: 'space-between', width: '100%', color: 'var(--color-warm)' }}
              >
                <span>Delete Account & Content</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Legal & Redressal Links */}
          <div className="card card-glass">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-xs)' }}>
              Legal Readiness & Policies
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)' }}>
              <Link to="/legal?tab=terms" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-sm)' }}>
                Terms of Service →
              </Link>
              <Link to="/legal?tab=privacy" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-sm)' }}>
                Privacy Policy →
              </Link>
              <Link to="/legal?tab=guidelines" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-sm)' }}>
                Community Guidelines →
              </Link>
              <Link to="/legal?tab=grievance" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-sm)' }}>
                Grievance Redressal Mechanism →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
