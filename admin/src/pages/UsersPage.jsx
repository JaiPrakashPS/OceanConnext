import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import styles from './DataPage.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ message: '', type: '' });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (role) params.role = role;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data?.data || []);
      setPagination(res.data?.pagination || {});
    } catch (e) {
      console.warn(e.message);
      setError(e.response?.data?.message || 'Unable to retrieve users list. Please check server connection.');
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (u) => {
    setUpdatingId(u._id);
    setActionFeedback({ message: '', type: '' });
    try {
      await api.put(`/admin/users/${u._id}/status`, { isActive: !u.isActive });
      setActionFeedback({
        message: `Account for ${u.name} successfully ${!u.isActive ? 'activated' : 'deactivated'}.`,
        type: 'success',
      });
      load();
      setTimeout(() => setActionFeedback({ message: '', type: '' }), 4000);
    } catch (e) {
      setActionFeedback({
        message: e.response?.data?.message || 'Failed to update user status. Please try again.',
        type: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Fishermen & User Management</h2>
          <p className={styles.pageSubtitle}>Manage registered fishermen, officers, and system accounts</p>
        </div>
        <span className={styles.pageCount}>{pagination.total || 0} Total Users</span>
      </div>

      {actionFeedback.message && (
        <div className={`alert-banner ${actionFeedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{actionFeedback.type === 'error' ? '⚠️' : '✅'} {actionFeedback.message}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍  Search by name or email address..."
        />
        <select className={styles.select} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="fisherman">Fisherman</option>
          <option value="officer">Officer</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading user accounts...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3 className="empty-title">No users found</h3>
          <p className="empty-desc">No accounts match your current search or filter criteria.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td className={styles.nameCell}>
                    <div className={styles.avatar}>{u.name?.[0]?.toUpperCase() || 'U'}</div>
                    <span>{u.name}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[u.role] || ''}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${u.isActive ? styles.active : styles.inactive}`}>
                      {u.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: u.isVerified ? '#ecfdf5' : '#fef2f2', color: u.isVerified ? '#059669' : '#dc2626' }}>
                      {u.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`${styles.btn} ${u.isActive ? styles.btnDanger : styles.btnSuccess}`}
                      disabled={updatingId === u._id}
                      onClick={() => toggleStatus(u)}
                    >
                      {updatingId === u._id ? 'Updating...' : u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Page {page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div className="pagination-btns">
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
            >
              ← Previous
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
