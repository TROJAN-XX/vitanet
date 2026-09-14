import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AppShell from '../../components/layout/AppShell.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const { success, error: toastError } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reports?status=${statusFilter}`);
      if (res?.data?.reports) {
        setReports(res.data.reports);
      }
    } catch (err) {
      toastError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolve = async (reportId, resolution, notes = '') => {
    try {
      setResolvingId(reportId);
      await api.patch(`/admin/reports/${reportId}`, {
        resolution,
        status: resolution === 'none' ? 'dismissed' : 'resolved',
        notes,
      });

      setReports((prev) => prev.filter((r) => r._id !== reportId));
      success(`Report marked as ${resolution === 'none' ? 'dismissed' : 'resolved'}`);
    } catch (err) {
      toastError(err.message || 'Failed to resolve report');
    } finally {
      setResolvingId(null);
    }
  };

  const handleRemovePost = async (postId, reportId) => {
    if (!window.confirm('Remove this post and delete associated media?')) return;
    try {
      setResolvingId(reportId);
      await api.post(`/admin/posts/${postId}/remove`, { reason: 'Violated community guidelines' });
      await handleResolve(reportId, 'content_removed', 'Post removed by moderator');
      success('Post removed and media queued for cleanup');
    } catch (err) {
      toastError(err.message || 'Failed to remove content');
      setResolvingId(null);
    }
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <Link to="/admin" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-xs)' }}>
            ← Back to Admin Console
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-xs)' }}>
            Moderation Reports Queue
          </h1>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
          {['pending', 'resolved', 'dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card skeleton" style={{ height: '120px' }} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="card card-glass" style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-lg)', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-sm)' }}>🛡️</div>
            <h3>No {statusFilter} reports</h3>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
              The community queue is clean.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {reports.map((r) => (
              <div
                key={r._id}
                className="card card-glass animate-scale-in"
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-danger" style={{ textTransform: 'uppercase', marginRight: 'var(--space-sm)' }}>
                      {r.reason?.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      Target: {r.targetType} ({r.targetId})
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                {r.details && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', background: 'var(--color-bg-tertiary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                    &ldquo;{r.details}&rdquo;
                  </p>
                )}

                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Reported by: @{r.reporterId?.username || 'user'}
                </div>

                {/* Actions */}
                {statusFilter === 'pending' && (
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)', flexWrap: 'wrap' }}>
                    {r.targetType === 'post' && (
                      <button
                        onClick={() => handleRemovePost(r.targetId, r._id)}
                        className="btn btn-danger btn-sm"
                        disabled={resolvingId === r._id}
                      >
                        Remove Post
                      </button>
                    )}

                    <button
                      onClick={() => handleResolve(r._id, 'none', 'Dismissed by moderator')}
                      className="btn btn-secondary btn-sm"
                      disabled={resolvingId === r._id}
                    >
                      Dismiss Report
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
