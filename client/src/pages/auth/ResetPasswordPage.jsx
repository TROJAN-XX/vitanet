import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Missing password reset token in URL.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { token, password }, { skipAuth: true });
      success('Password reset successfully! Please sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '440px', paddingTop: '10vh' }}>
        <div className="card card-glass" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--color-error)' }}>
            Invalid Reset Link
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-md) 0' }}>
            No password reset token was found in the link.
          </p>
          <Link to="/forgot-password" className="btn btn-primary">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow animate-fade-in" style={{ maxWidth: '440px', paddingTop: '10vh' }}>
      <div className="card card-glass" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
            Set New Password
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
            Choose a strong password for your account
          </p>
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
              marginBottom: 'var(--space-lg)',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <span className="input-hint">At least 8 characters</span>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-sm)' }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
