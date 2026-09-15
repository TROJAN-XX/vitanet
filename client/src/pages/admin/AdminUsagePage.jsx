import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AppShell from '../../components/layout/AppShell.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminUsagePage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/usage');
      if (res?.data) {
        setUsage(res.data);
      }
    } catch (err) {
      toastError(err.message || 'Failed to fetch platform storage usage');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleTriggerCleanup = async () => {
    try {
      setCleaning(true);
      const res = await api.post('/admin/cleanup-orphans');
      success(`Orphan sweep complete: ${res?.data?.deletedCount || 0} orphaned files deleted from R2.`);
      fetchUsage();
    } catch (err) {
      toastError(err.message || 'Orphan cleanup trigger failed');
    } finally {
      setCleaning(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Link to="/admin" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-xs)' }}>
              ← Back to Admin Console
            </Link>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-xs)' }}>
              Media Usage & Zero-Cost Guardrails
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              Cloudflare R2 storage allocation & automatic ledger reconciliation
            </p>
          </div>

          <button
            onClick={handleTriggerCleanup}
            className="btn btn-secondary btn-sm"
            disabled={cleaning}
          >
            {cleaning ? (
              <>
                <div className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Sweeping R2...</span>
              </>
            ) : (
              'Run Orphan Cleanup'
            )}
          </button>
        </div>

        {loading ? (
          <div className="card skeleton" style={{ height: '240px' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Platform Summary Card */}
            <div className="card card-glass">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)' }}>
                Platform Quota Summary
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                <div>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>Total Active Storage</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {formatBytes(usage?.totalActiveBytes)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-accent)' }}>7,168 MB Hard Cap</div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>Total Media Objects</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {usage?.totalObjectsCount || 0}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>Pending Deletion</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-warm)' }}>
                    {usage?.pendingDeleteCount || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Storage Consumers */}
            <div className="card card-glass" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)' }}>
                  User Storage Ledger
                </h3>
              </div>

              {usage?.userUsages?.length === 0 ? (
                <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No media uploaded yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-glass-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                      <th style={{ padding: 'var(--space-md)' }}>Creator</th>
                      <th style={{ padding: 'var(--space-md)' }}>Used Storage</th>
                      <th style={{ padding: 'var(--space-md)' }}>% of 75MB Quota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage?.userUsages?.map((u) => {
                      const pct = Math.min(100, Math.round((u.totalBytes / (75 * 1024 * 1024)) * 100));
                      return (
                        <tr key={u.userId} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                          <td style={{ padding: 'var(--space-md)' }}>
                            <Link to={`/u/${u.username}`} style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--weight-semibold)' }}>
                              @{u.username}
                            </Link>
                          </td>
                          <td style={{ padding: 'var(--space-md)' }}>
                            {formatBytes(u.totalBytes)}
                          </td>
                          <td style={{ padding: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? 'var(--color-warm)' : 'var(--color-primary)' }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', minWidth: '35px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
