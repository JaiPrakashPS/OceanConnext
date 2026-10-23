import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import styles from './DataPage.module.css';

const STATUS_COLORS = {
  pending:      { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Pending' },
  acknowledged: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Acknowledged' },
  dispatched:   { bg: '#eff6ff', color: '#0284c7', border: '#bfdbfe', label: 'Dispatched' },
  resolved:     { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Resolved' },
  false_alarm:  { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', label: 'False Alarm' },
};

const EMERGENCY_ICONS = {
  medical:   '🏥', breakdown: '⚓', weather: '🌊',
  capsized:  '🚨', fire: '🔥',    other: '🆘',
};

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function SOSPage() {
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating]         = useState(null);
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const [feedback, setFeedback]         = useState({ message: '', type: '' });
  const [error, setError]               = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/sos', { params });
      const data = res.data;
      setRecords(data?.data || []);
      setTotal(data?.pagination?.total || 0);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Unable to retrieve SOS distress records. Please verify connection.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    setFeedback({ message: '', type: '' });
    try {
      await api.put(`/sos/${id}/status`, { status: newStatus });
      setFeedback({
        message: `Distress alert status updated to "${newStatus.replace('_', ' ').toUpperCase()}".`,
        type: 'success',
      });
      load();
      setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    } catch (e) {
      setFeedback({
        message: e.response?.data?.message || 'Failed to update SOS status. Please try again.',
        type: 'error',
      });
    } finally {
      setUpdating(null);
    }
  };

  const tabs = ['all', 'pending', 'acknowledged', 'dispatched', 'resolved', 'false_alarm'];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🆘 SOS Emergency Monitor</h1>
          <p className={styles.pageSubtitle}>{total} total distress calls · Real-time maritime safety response</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh Feed</button>
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

      {/* Status Tabs */}
      <div className={styles.tabRow}>
        {tabs.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${statusFilter === t ? styles.tabActive : ''}`}
            onClick={() => { setStatusFilter(t); setPage(1); }}
          >
            {t === 'all' ? 'All Alerts' : STATUS_COLORS[t]?.label || t}
            {t === 'pending' && <span className={styles.dangerDot} />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Monitoring distress channels...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <h2 className="empty-title">No SOS Alerts Found</h2>
          <p className="empty-desc">
            {statusFilter === 'pending' ? 'All active emergency alerts have been attended to.' : 'No alerts match this filter.'}
          </p>
        </div>
      ) : (
        <div className={styles.sosGrid}>
          {records.map(item => {
            const cfg = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
            const lat = item.location?.lat;
            const lng = item.location?.lng;

            return (
              <div key={item._id} className={styles.sosCard} style={{ borderLeftColor: cfg.color }}>
                <div className={styles.sosCardTop}>
                  <div className={styles.sosEmergency}>
                    <span className={styles.sosEmIcon}>{EMERGENCY_ICONS[item.emergencyType] || '🆘'}</span>
                    <div>
                      <div className={styles.sosType}>{item.emergencyType?.replace(/_/g, ' ') || 'Emergency'}</div>
                      <div className={styles.sosUser}>
                        {item.fishermenId?.name || item.userId?.name || 'Unknown Fisherman'} · {item.fishermenId?.phone || ''}
                      </div>
                    </div>
                  </div>
                  <span
                    className={styles.sosBadge}
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.label}
                  </span>
                </div>

                {(item.message || item.description) && (
                  <p className={styles.sosDesc}>{item.message || item.description}</p>
                )}

                <div className={styles.sosMeta}>
                  <span>🕒 {timeAgo(item.createdAt)}</span>
                  {lat && lng && (
                    <a
                      href={`https://maps.google.com/?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapsLink}
                    >
                      📍 Open GPS ({Number(lat).toFixed(3)}, {Number(lng).toFixed(3)})
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                {item.status === 'pending' && (
                  <div className={styles.sosActions}>
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ color: '#d97706', borderColor: '#fde68a' }}
                      disabled={updating === item._id}
                      onClick={() => updateStatus(item._id, 'acknowledged')}
                    >
                      ✓ Acknowledge
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ color: '#64748b' }}
                      disabled={updating === item._id}
                      onClick={() => updateStatus(item._id, 'false_alarm')}
                    >
                      ✗ False Alarm
                    </button>
                  </div>
                )}
                {item.status === 'acknowledged' && (
                  <div className={styles.sosActions}>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={updating === item._id}
                      onClick={() => updateStatus(item._id, 'dispatched')}
                    >
                      🚤 Dispatch Coastguard / Team
                    </button>
                  </div>
                )}
                {item.status === 'dispatched' && (
                  <div className={styles.sosActions}>
                    <button
                      className="btn btn-sm btn-success"
                      disabled={updating === item._id}
                      onClick={() => updateStatus(item._id, 'resolved')}
                    >
                      ✅ Mark Incident Resolved
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} distress records
          </span>
          <div className="pagination-btns">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="page-btn" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
