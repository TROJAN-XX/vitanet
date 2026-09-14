import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function DeleteAccountPage() {
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { logout } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!confirmed) {
      setErrorMsg('You must check the confirmation box to proceed.');
      return;
    }

    try {
      setLoading(true);
      await api.delete('/users/me', {
        body: JSON.stringify({ password }),
      });

      await logout();
      success('Your account has been scheduled for deletion. We are sorry to see you go.');
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete account. Please verify your password.');
      toastError(err.message || 'Deletion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '540px' }}>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Link to="/settings" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-xs)' }}>
            ← Back to Settings
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-error)', marginTop: 'var(--space-xs)' }}>
            Delete Creator Account
          </h1>
        </div>

        <div className="card card-glass" style={{ borderColor: 'rgba(255, 107, 107, 0.3)' }}>
          <div style={{ padding: 'var(--space-md)', background: 'rgba(255, 107, 107, 0.08)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ color: 'var(--color-error)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-xs)' }}>
              ⚠️ Permanent Consequences of Account Deletion
            </h3>
            <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Your username and profile will become immediately inaccessible to other members.</li>
              <li>All authored posts and comments will be permanently hidden and soft-deleted.</li>
              <li>Your uploaded photos and videos will be purged from Cloudflare R2 media storage.</li>
              <li>This action cannot be undone. Your spot in the 100-user capacity will be released.</li>
            </ul>
          </div>

          {errorMsg && (
            <div
              className="animate-slide-up"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 107, 107, 0.12)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                color: 'var(--color-error)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-md)',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Enter Current Password to Confirm</label>
              <input
                id="confirmPassword"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-error)' }}
              />
              <span>I understand that deleting my account is irreversible.</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
              <Link to="/settings" className="btn btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={!confirmed || !password || loading}
              >
                {loading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Permanently Delete My Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
