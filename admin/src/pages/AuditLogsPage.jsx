import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import styles from './DataPage.module.css';

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
};

const METHOD_COLOR = {
  GET:    { color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' },
  POST:   { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  PUT:    { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  PATCH:  { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  DELETE: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

export default function AuditLogsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState('');
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      const res = await api.get('/admin/audit-logs', { params });
      const data = res.data;
      setRecords(data?.data || []);
      setTotal(data?.pagination?.total || 0);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Unable to retrieve audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🔍 System Audit & Security Logs</h1>
          <p className={styles.pageSubtitle}>{total.toLocaleString()} total immutable system activity events</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            className="form-input"
            placeholder="🔍 Search actions, paths, IPs…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 260 }}
          />
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading audit log entries...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">No Audit Logs Found</h2>
          <p className="empty-desc">System transactions and officer administrative actions will appear here in real-time.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Action / Endpoint</th>
                  <th>Actor / User</th>
                  <th>Client IP</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {records.map((log, i) => {
                  const methodCfg = METHOD_COLOR[log.method] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
                  const isOk = (log.statusCode || 200) < 400;

                  return (
                    <tr key={log._id || i}>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: methodCfg.bg,
                            color: methodCfg.color,
                            border: `1px solid ${methodCfg.border}`,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                          }}
                        >
                          {log.method || 'GET'}
                        </span>
                      </td>
                      <td style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}>
                        {log.action || log.path || '—'}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                          {log.actorId?.name || log.userId?.name || 'System / Service'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {log.actorId?.email || log.userId?.role || ''}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: isOk ? '#ecfdf5' : '#fef2f2',
                            color: isOk ? '#059669' : '#dc2626',
                            border: `1px solid ${isOk ? '#a7f3d0' : '#fecaca'}`,
                          }}
                        >
                          {log.statusCode || 200}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{timeAgo(log.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total > LIMIT && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()} log entries
              </span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="page-btn" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
