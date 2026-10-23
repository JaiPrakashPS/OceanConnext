import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import styles from './DataPage.module.css';

const STATUS_CFG = {
  open:           { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Open' },
  submitted:      { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Submitted' },
  under_review:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Under Review' },
  resolved:       { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Resolved' },
  rejected:       { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', label: 'Rejected' },
};

const CATEGORY_ICONS = {
  water_quality: '💧', illegal_fishing: '🚫', infrastructure: '🏗️',
  pollution: '🌊', theft: '🔒', other: '📋',
};

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
};

export default function ComplaintsPage() {
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState(null);
  const [response, setResponse]         = useState('');
  const [newStatus, setNewStatus]       = useState('');
  const [updating, setUpdating]         = useState(false);
  const [modalError, setModalError]     = useState('');
  const [feedback, setFeedback]         = useState({ message: '', type: '' });
  const [error, setError]               = useState('');
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/complaints', { params });
      const data = res.data;
      setRecords(data?.data || []);
      setTotal(data?.pagination?.total || 0);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Unable to retrieve grievance complaints list.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    setModalError('');
    try {
      await api.put(`/complaints/${selected._id}`, {
        status: newStatus,
        officerResponse: response,
      });
      setSelected(null);
      setResponse('');
      setFeedback({
        message: `Complaint "${selected.title || selected.subject}" status updated to ${newStatus.toUpperCase()}.`,
        type: 'success',
      });
      load();
      setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    } catch (e) {
      setModalError(e.response?.data?.message || 'Failed to update complaint response.');
    } finally {
      setUpdating(false);
    }
  };

  const tabs = ['all', 'open', 'under_review', 'resolved', 'rejected'];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📋 Fishermen Grievances & Complaints</h1>
          <p className={styles.pageSubtitle}>{total} total grievances logged for administrative review</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh List</button>
      </div>

      {feedback.message && (
        <div className={`alert-banner ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{feedback.type === 'error' ? '⚠️' : '✅'} {feedback.message}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabRow}>
        {tabs.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${statusFilter === t ? styles.tabActive : ''}`}
            onClick={() => { setStatusFilter(t); setPage(1); }}
          >
            {t === 'all' ? 'All Grievances' : STATUS_CFG[t]?.label || t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading complaints...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <h2 className="empty-title">No Complaints Found</h2>
          <p className="empty-desc">No grievance records match the current status filter.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Title / Subject</th>
                  <th>Submitted By</th>
                  <th>Review Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(cmp => {
                  const sts = STATUS_CFG[cmp.status] || STATUS_CFG.open;
                  return (
                    <tr key={cmp._id}>
                      <td>
                        <span style={{ fontSize: 18, marginRight: 8, verticalAlign: 'middle' }}>
                          {CATEGORY_ICONS[cmp.category] || '📋'}
                        </span>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                          {cmp.category?.replace(/_/g, ' ') || 'General'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {cmp.title || cmp.subject || 'Complaint Report'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{cmp.submittedBy?.name || 'Fisherman'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cmp.submittedBy?.phone || ''}</div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: sts.bg, color: sts.color, border: `1px solid ${sts.border}` }}
                        >
                          {sts.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{timeAgo(cmp.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelected(cmp);
                            setNewStatus(cmp.status || 'under_review');
                            setResponse(cmp.officerResponse || '');
                            setModalError('');
                          }}
                        >
                          Review & Respond
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total > LIMIT && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} grievances
              </span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="page-btn" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Respond Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Grievance Response</h2>
            <p className="modal-subtitle">
              {CATEGORY_ICONS[selected.category] || '📋'} {selected.title || selected.subject}
            </p>

            {modalError && (
              <div className="alert-banner alert-error" style={{ marginBottom: 16 }}>
                <span>⚠️ {modalError}</span>
              </div>
            )}

            <div style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              marginBottom: 18,
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>Description from Fisherman:</strong>
              {selected.description}
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Official Administrative Response</label>
              <textarea
                className="form-input"
                style={{ height: 100, resize: 'vertical', paddingTop: 10 }}
                placeholder="Enter actions taken or resolution message for the fisherman…"
                value={response}
                onChange={e => setResponse(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Set Grievance Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={updating} onClick={handleUpdate}>
                {updating ? 'Saving Status…' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
