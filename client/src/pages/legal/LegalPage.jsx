import { useSearchParams, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';

const TABS = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'guidelines', label: 'Community Guidelines' },
  { id: 'grievance', label: 'Grievance Redressal' },
];

export default function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'terms';

  const handleTabChange = (tabId) => {
    searchParams.set('tab', tabId);
    setSearchParams(searchParams);
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '720px' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>
            Legal & Governance
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
            Policies governing privacy, content standards, and creator rights on VitaNet
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-xs)',
            borderBottom: '1px solid var(--color-glass-border)',
            marginBottom: 'var(--space-xl)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {TABS.map((t) => {
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  borderBottom: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: isSelected ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                  fontWeight: isSelected ? 'var(--weight-bold)' : 'var(--weight-medium)',
                  fontSize: 'var(--text-sm)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="card card-glass" style={{ lineHeight: 'var(--leading-relaxed)', fontSize: 'var(--text-sm)' }}>
          {activeTab === 'terms' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                Terms of Service
              </h2>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
                Last updated: September 2026
              </p>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary-light)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                1. Acceptance of Terms
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                By registering an account or accessing the VitaNet platform, you acknowledge and agree to abide by these Terms of Service and all related policies. VitaNet is designed strictly for independent creators aged 18 and older.
              </p>

              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary-light)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                2. Platform Capacity & Infrastructure Limits
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                VitaNet operates on a non-profit, zero-corporate infrastructure budget with a hard capacity limit of 100 registered accounts and 75 MB of media allocation per creator. The platform reserves the right to decommission inactive accounts or enforce storage caps to preserve platform uptime.
              </p>

              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary-light)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                3. Content Ownership & License
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                You retain 100% intellectual property ownership of all photography, video, and writing published to VitaNet. By uploading, you grant VitaNet a non-exclusive, royalty-free license solely to host, cache, and display your media to other authorized platform users.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                Privacy Policy
              </h2>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
                Compliant with Digital Personal Data Protection (DPDP) Act 2023 & GDPR
              </p>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-accent)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                1. Zero Data Monetisation
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                VitaNet will never sell, lease, rent, or broker your personal information, engagement metrics, or metadata to third-party ad networks, telemetry trackers, or AI model vendors.
              </p>

              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-accent)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                2. Automatic EXIF & Metadata Stripping
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                All photos uploaded through the VitaNet client pipeline are automatically downscaled and stripped of GPS locations, camera serials, and timestamp headers directly inside your browser before transmitting to Cloudflare R2 storage.
              </p>

              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-accent)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                3. Your Rights (Access, Portability, Erasure)
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                You can download your entire data footprint anytime via the <Link to="/settings/export" style={{ color: 'var(--color-primary-light)' }}>Data Export</Link> utility or permanently delete your account through <Link to="/settings/delete" style={{ color: 'var(--color-primary-light)' }}>Account Deletion</Link>.
              </p>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                Community Guidelines
              </h2>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
                Standards for constructive and authentic creator expression
              </p>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary-light)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                1. Mutual Respect & Creative Expression
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                VitaNet welcomes genuine creative dialogue. Hate speech, targeted harassment, intimidation, and impersonation are strictly forbidden and will result in immediate permanent account termination.
              </p>

              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary-light)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                2. Content Warnings & Tagging
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                If publishing content involving sensitive themes, spoilers, or intense visuals, creators are expected to apply an explicit Content Warning label during creation to protect fellow community members.
              </p>

              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary-light)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                3. No Automated Spam or Scraping
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Automated posting scripts, botting, follower farming, and bulk scraping are prohibited and blocked by server-side rate limits and Cloudflare Turnstile bot deterrence.
              </p>
            </div>
          )}

          {activeTab === 'grievance' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                Grievance Redressal Mechanism
              </h2>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
                In accordance with the Information Technology (Intermediary Guidelines) Rules
              </p>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary-light)', margin: 'var(--space-md) 0 var(--space-xs)' }}>
                Grievance Officer Designation
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Users may register grievances or complaints regarding platform content, copyright violations, or personal data handling directly with the appointed Grievance Redressal Officer.
              </p>

              <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', margin: 'var(--space-md) 0' }}>
                <div><strong>Designation:</strong> Grievance Officer, VitaNet Network</div>
                <div><strong>Contact Email:</strong> grievance@vitanet.local</div>
                <div><strong>Turnaround Time:</strong> Acknowledged within 24 hours; resolved within 15 days</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
