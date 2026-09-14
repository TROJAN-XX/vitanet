import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import TurnstileWidget from '../../components/auth/TurnstileWidget.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { success } = useToast();
  const turnstileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) return;

    try {
      setLoading(true);
      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
        turnstileToken,
      }, { skipAuth: true });

      setSubmitted(true);
      success('Password reset instructions sent to your email.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request password reset.');
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow animate-fade-in" style={{ maxWidth: '440px', paddingTop: '10vh' }}>
      <div className="card card-glass" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
            Enter your email to receive a password reset link
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

        {submitted ? (
          <div
            className="animate-scale-in"
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 212, 170, 0.12)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-xs)' }}>
              Check Your Inbox
            </h3>
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              If an account exists for {email}, a password reset link has been dispatched.
            </p>
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Account Email</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="creator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <TurnstileWidget
              ref={turnstileRef}
              onVerify={(token) => setTurnstileToken(token)}
            />

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-sm)' }}
              disabled={loading}
            >
              {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: 'var(--text-sm)' }}>
          <Link to="/login" style={{ color: 'var(--color-text-secondary)' }}>
            Remembered your password? <span style={{ color: 'var(--color-accent)' }}>Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
