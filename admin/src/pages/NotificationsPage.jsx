import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import styles from './DataPage.module.css';

const TYPES    = ['info', 'warning', 'alert', 'scheme', 'weather', 'general'];
const ROLES    = ['all', 'fisherman', 'officer'];
const PRIORITY = ['low', 'medium', 'high', 'critical'];

export default function NotificationsPage() {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ title: '', body: '', type: 'info', targetRole: 'all', priority: 'medium' });
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState('');
  const [modalError, setModalError] = useState('');
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notifications', { params: { limit: 30 } });
      setRecords(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Unable to retrieve broadcast notifications history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setModalError('Notification title and message body are required.');
      return;
    }
    setSending(true);
    setModalError('');
    try {
      await api.post('/notifications/broadcast', form);
      setSent(`Broadcast "${form.title}" dispatched successfully.`);
      setShowModal(false);
      setForm({ title: '', body: '', type: 'info', targetRole: 'all', priority: 'medium' });
      load();
      setTimeout(() => setSent(''), 4500);
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to dispatch broadcast. Check network.');
    } finally {
      setSending(false);
    }
  };

  const typeColor = (type) => {
    if (type === 'alert' || type === 'warning') return '#dc2626';
    if (type === 'scheme') return '#059669';
    if (type === 'weather') return '#0284c7';
    if (type === 'info') return '#d97706';
    return '#64748b';
  };

  const priorityBadge = (p) => {
    const map = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: '' };
    return map[p] || '';
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🔔 Broadcast Announcements & Alerts</h1>
          <p className={styles.pageSubtitle}>{records.length} recent system notifications sent to mobile users</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setModalError(''); }}>
          📢 Dispatch New Broadcast
        </button>
      </div>

      {sent && (
        <div className="alert-banner alert-success">
          <span>✅ {sent}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading notifications log...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h2 className="empty-title">No Notifications Dispatched Yet</h2>
          <p className="empty-desc">Send targeted advisory announcements or emergency weather alerts to mobile app users.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            📢 Send First Broadcast
          </button>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message Body</th>
                  <th>Category</th>
                  <th>Recipients</th>
                  <th>Priority</th>
                  <th>Dispatch Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map(n => (
                  <tr key={n._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text)' }}>{n.title}</td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {n.body}
                    </td>
                    <td>
                      <span className="badge" style={{ background: typeColor(n.type) + '15', color: typeColor(n.type), textTransform: 'capitalize' }}>
                        {n.type}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {n.targetRole === 'all' ? 'All Registered Users' : n.targetRole}
                    </td>
                    <td>
                      <span className={`badge ${priorityBadge(n.priority)}`} style={{ textTransform: 'capitalize' }}>
                        {n.priority || 'medium'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">📢 Dispatch Push Broadcast</h2>
            <p className="modal-subtitle">Messages are transmitted directly to the Ocean Connect mobile application</p>

            {modalError && (
              <div className="alert-banner alert-error" style={{ marginBottom: 16 }}>
                <span>⚠️ {modalError}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Broadcast Title *</label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Cyclone Warning & Shore Return Advisory"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Content *</label>
                <textarea
                  className="form-input"
                  style={{ height: 90, paddingTop: 10, resize: 'vertical' }}
                  required
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Provide precise details, coordinates, or emergency instructions…"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select className="form-select" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}>
                    <option value="all">Everyone</option>
                    <option value="fisherman">Fishermen Only</option>
                    <option value="officer">Officers Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITY.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{
                background: '#f8fafc', borderRadius: 10, padding: '12px 16px',
                border: '1px solid #e2e8f0', fontSize: 13, color: 'var(--text-secondary)',
              }}>
                <strong style={{ color: 'var(--text)' }}>Preview:</strong> [{form.priority.toUpperCase()}] <strong>{form.title || 'Untitled'}</strong> — {form.body || '…'}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Transmitting…' : '📢 Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
