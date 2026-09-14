import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import TurnstileWidget from '../../components/auth/TurnstileWidget.jsx';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const turnstileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(trimmedUsername)) {
      setErrorMsg('Username must be 3–30 characters and contain only lowercase letters, numbers, and underscores.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!ageConfirmed) {
      setErrorMsg('You must be at least 18 years old to join VitaNet.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('You must accept the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      setLoading(true);
      await register({
        username: trimmedUsername,
        email: email.trim().toLowerCase(),
        password,
        ageConfirmed: true,
        termsAccepted: true,
        turnstileToken,
      });

      success('Registration successful! Please check your email to verify your account.');
      setSuccessMsg('A verification link has been sent to your email address. Please click the link to activate your account.');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow animate-fade-in" style={{ maxWidth: '480px', paddingTop: '5vh' }}>
      <div className="card card-glass" style={{ padding: 'var(--space-xl)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-md) auto',
              fontWeight: 'var(--weight-extrabold)',
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            V
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
            Join VitaNet
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
            An independent, zero-corporate creator network
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: 'var(--space-sm)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(124, 92, 252, 0.1)',
              border: '1px solid rgba(124, 92, 252, 0.25)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-primary-light)',
            }}
          >
            <span>🔒 Exclusive 100-Member Zero-Cost Platform</span>
          </div>
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

        {successMsg ? (
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
            <div style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-sm)' }}>
              ✉️ Verification Link Sent
            </div>
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              {successMsg}
            </p>
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Link to="/login" className="btn btn-primary btn-sm">
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="creator_handle"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                autoComplete="username"
              />
              <span className="input-hint">3–30 characters, letters, numbers, and underscores only</span>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
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

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <span className="input-hint">Minimum 8 characters</span>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <span>I confirm that I am at least 18 years of age</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <span>
                  I accept the{' '}
                  <Link to="/legal" target="_blank" style={{ color: 'var(--color-primary-light)' }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/legal" target="_blank" style={{ color: 'var(--color-primary-light)' }}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
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
              {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Create Creator Account'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-accent)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
