import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AppShell from '../../components/layout/AppShell.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const { success, error: toastError } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res?.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      toastError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this user status to ${newStatus}?`)) return;

    try {
      setUpdatingId(userId);
      await api.patch(`/admin/users/${userId}/status`, {
        accountStatus: newStatus,
        reason: 'Administrative moderation action',
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, accountStatus: newStatus } : u))
      );
      success(`User status updated to ${newStatus}`);
    } catch (err) {
      toastError(err.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <Link to="/admin" style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-xs)' }}>
            ← Back to Admin Console
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-xs)' }}>
            User Accounts Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
            Total Registered: {users.length} / 100 maximum platform capacity
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card skeleton" style={{ height: '60px' }} />
            ))}
          </div>
        ) : (
          <div className="card card-glass" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                  <th style={{ padding: 'var(--space-md)' }}>User</th>
                  <th style={{ padding: 'var(--space-md)' }}>Role</th>
                  <th style={{ padding: 'var(--space-md)' }}>Status</th>
                  <th style={{ padding: 'var(--space-md)' }}>Joined</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <Link to={`/u/${u.username}`} style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                        @{u.username}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        {u.email}
                      </div>
                    </td>

                    <td style={{ padding: 'var(--space-md)' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'moderator' ? 'badge-success' : ''}`}>
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: 'var(--space-md)' }}>
                      <span
                        className={`badge ${
                          u.accountStatus === 'active'
                            ? 'badge-success'
                            : u.accountStatus === 'suspended'
                            ? 'badge-danger'
                            : ''
                        }`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {u.accountStatus}
                      </span>
                    </td>

                    <td style={{ padding: 'var(--space-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                      {u.role !== 'admin' && (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          {u.accountStatus === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(u._id, 'suspended')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              disabled={updatingId === u._id}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(u._id, 'active')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              disabled={updatingId === u._id}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
