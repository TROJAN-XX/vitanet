import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'verifying' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function verify() {
      try {
        await api.post('/auth/verify-email', { token }, { skipAuth: true });
        if (!cancelled) {
          setStatus('success');
          success('Email verified successfully! You can now log in.');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err.message || 'Invalid or expired verification token.');
        }
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [token, success]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    try {
      setResendLoading(true);
      await api.post('/auth/resend-verification', { email: resendEmail.trim().toLowerCase() }, { skipAuth: true });
      setResendSuccess(true);
      success('Verification email resent. Please check your inbox.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification link.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="page page-narrow animate-fade-in" style={{ maxWidth: '440px', paddingTop: '10vh' }}>
      <div className="card card-glass" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        {status === 'verifying' && (
          <div style={{ padding: 'var(--space-xl) 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto var(--space-md) auto' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
              Verifying Your Email...
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
              Please wait while we validate your activation token.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-scale-in" style={{ padding: 'var(--space-lg) 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0, 212, 170, 0.15)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-md) auto',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
              Email Verified!
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 'var(--space-sm) 0 var(--space-xl) 0' }}>
              Your VitaNet creator account has been activated. You may now sign in and set up your profile.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div className="animate-fade-in">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
              {status === 'error' ? 'Verification Failed' : 'Verify Your Email'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 'var(--space-xs) 0 var(--space-lg) 0' }}>
              {status === 'error'
                ? errorMsg || 'The verification link is invalid or has expired.'
                : 'Need another activation link sent to your inbox?'}
            </p>

            {resendSuccess ? (
              <div
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 212, 170, 0.12)',
                  border: '1px solid rgba(0, 212, 170, 0.3)',
                  color: 'var(--color-accent)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Verification link resent! Please check your spam or inbox.
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <div className="input-group" style={{ textAlign: 'left' }}>
                  <label className="input-label" htmlFor="resendEmail">Account Email</label>
                  <input
                    id="resendEmail"
                    type="email"
                    className="input-field"
                    placeholder="creator@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={resendLoading}
                  style={{ width: '100%' }}
                >
                  {resendLoading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Resend Verification Email'}
                </button>
              </form>
            )}

            <div style={{ marginTop: 'var(--space-xl)', fontSize: 'var(--text-sm)' }}>
              <Link to="/login" style={{ color: 'var(--color-primary-light)' }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
