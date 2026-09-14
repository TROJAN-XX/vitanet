import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function DataExportPage() {
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const handleExport = async () => {
    try {
      setDownloading(true);
      const res = await api.get('/users/me/export');
      const exportData = res.data;

      // Create downloadable JSON blob
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitanet_export_${user?.username || 'user'}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('Data archive downloaded successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to generate data export');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '580px' }}>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Link to="/settings" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-xs)' }}>
            ← Back to Settings
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-xs)' }}>
            Data Portability Export
          </h1>
        </div>

        <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
            In compliance with DPDP Act 2023 and GDPR Article 20 (Right to Data Portability), you can download a complete, machine-readable JSON archive of all information associated with your VitaNet account.
          </p>

          <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
            <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-primary)' }}>
              Included in this archive:
            </div>
            <ul style={{ listStyle: 'disc', paddingLeft: 'var(--space-lg)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>User account profile and registration details</li>
              <li>All authored posts with media object references and metadata</li>
              <li>Comments created across the network</li>
              <li>Follower and Following social graph edges</li>
              <li>Liked posts and saved bookmark records</li>
            </ul>
          </div>

          <div style={{ marginTop: 'var(--space-sm)' }}>
            <button
              onClick={handleExport}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px' }} />
                  <span>Generating JSON Archive...</span>
                </>
              ) : (
                'Generate & Download Archive'
              )}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
