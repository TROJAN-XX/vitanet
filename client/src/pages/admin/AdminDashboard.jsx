import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AppShell from '../../components/layout/AppShell.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error: toastError } = useToast();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        if (res?.data) {
          setStats(res.data);
        }
      } catch (err) {
        toastError(err.message || 'Failed to load administrative dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [toastError]);

  const userCount = stats?.userCount || 0;
  const userCap = 100;
  const userPercent = Math.min(100, Math.round((userCount / userCap) * 100));

  const storageBytes = stats?.totalStorageBytes || 0;
  const storageMB = (storageBytes / (1024 * 1024)).toFixed(1);
  const globalCapMB = 7168; // 7 GB
  const storagePercent = Math.min(100, Math.round((storageBytes / (globalCapMB * 1024 * 1024)) * 100));

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>
              Admin Operations
            </h1>
            <span className="badge badge-primary">Supervisory Console</span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
            Infrastructure guardrails, zero-cost monitoring, and community governance
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card skeleton" style={{ height: '140px' }} />
            ))}
          </div>
        ) : (
          <div>
            {/* KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-xl)',
              }}
            >
              {/* User Cap Card */}
              <div className="card card-glass">
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Platform Members
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: 'var(--space-sm) 0' }}>
                  <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {userCount}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>/ {userCap}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${userPercent}%`, height: '100%', background: 'var(--gradient-primary)' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
                  {userCap - userCount} invites available
                </div>
              </div>

              {/* Storage Cap Card */}
              <div className="card card-glass">
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  R2 Media Storage
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: 'var(--space-sm) 0' }}>
                  <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {storageMB}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>MB / 7 GB</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${storagePercent}%`, height: '100%', background: 'var(--color-accent)' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-accent)', marginTop: '6px' }}>
                  ₹0 Cloudflare Free Tier
                </div>
              </div>

              {/* Pending Reports Card */}
              <div className="card card-glass">
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pending Reports
                </div>
                <div style={{ margin: 'var(--space-sm) 0' }}>
                  <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: stats?.pendingReportsCount > 0 ? 'var(--color-warm)' : 'var(--color-text-primary)' }}>
                    {stats?.pendingReportsCount || 0}
                  </span>
                </div>
                <Link to="/admin/reports" className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '11px' }}>
                  Triage Queue →
                </Link>
              </div>

              {/* Total Posts */}
              <div className="card card-glass">
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Community Posts
                </div>
                <div style={{ margin: 'var(--space-sm) 0' }}>
                  <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {stats?.postCount || 0}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                  {stats?.commentCount || 0} total comments
                </div>
              </div>
            </div>

            {/* Quick Links Navigation */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)' }}>
              Operational Modules
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
              <Link
                to="/admin/reports"
                className="card card-glass"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)' }}>Content Reports</span>
                  <span style={{ color: 'var(--color-primary-light)' }}>→</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', lineHeight: '1.4' }}>
                  Review flagged posts, comments, and user accounts. Take down content or issue suspensions.
                </p>
              </Link>

              <Link
                to="/admin/users"
                className="card card-glass"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)' }}>User Management</span>
                  <span style={{ color: 'var(--color-primary-light)' }}>→</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', lineHeight: '1.4' }}>
                  Search members, manage role elevations (Admin/Moderator), and update account statuses.
                </p>
              </Link>

              <Link
                to="/admin/usage"
                className="card card-glass"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)' }}>Media & Orphan Cleanup</span>
                  <span style={{ color: 'var(--color-primary-light)' }}>→</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', lineHeight: '1.4' }}>
                  Inspect storage ledger, identify heavy creators, and trigger manual orphan media sweeps.
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
