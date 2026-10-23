import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const INITIAL_FORM = {
  name: '', email: '', password: '', phone: '',
  designation: 'Fisheries Inspector', district: '', badgeNumber: '', preferredLanguage: 'ta',
};

const DESIGNATIONS = [
  'Fisheries Inspector', 'Senior Fisheries Inspector', 'Assistant Director',
  'Deputy Director', 'District Fisheries Officer'
];

const DISTRICTS = [
  'Chennai', 'Tiruvallur', 'Kancheepuram', 'Chengalpattu', 'Villupuram', 'Cuddalore',
  'Nagapattinam', 'Thanjavur', 'Tiruvarur', 'Pudukkottai', 'Ramanathapuram',
  'Thoothukudi', 'Tirunelveli', 'Kanyakumari'
];

export default function OfficersPage() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [search, setSearch] = useState('');

  const loadOfficers = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await api.get('/admin/officers');
      setOfficers(res.data?.data || []);
    } catch (e) {
      console.error('Load officers failed:', e);
      setPageError(e.response?.data?.message || 'Unable to load fisheries officers. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOfficers(); }, [loadOfficers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Full name, email address, and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setFormLoading(true);
      await api.post('/admin/officers', {
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      setFeedback({
        message: `Officer "${form.name}" registered successfully. They can now sign in to Ocean Connect.`,
        type: 'success',
      });
      setShowModal(false);
      setForm(INITIAL_FORM);
      loadOfficers();
      setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create officer account. Please verify input.');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (officer) => {
    try {
      await api.put(`/admin/users/${officer._id}/status`, { isActive: !officer.isActive });
      setFeedback({
        message: `Officer ${officer.name} status updated to ${!officer.isActive ? 'Active' : 'Suspended'}.`,
        type: 'success',
      });
      loadOfficers();
      setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    } catch (e) {
      setFeedback({
        message: e.response?.data?.message || 'Failed to update officer status.',
        type: 'error',
      });
    }
  };

  const filtered = officers.filter(o =>
    !search ||
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.phone?.includes(search)
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Officer Management</h1>
          <p className="page-subtitle">Create and oversee authorized fisheries officer accounts</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowModal(true); setFormError(''); setForm(INITIAL_FORM); }}
        >
          ➕ Register New Officer
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div className={`alert-banner ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{feedback.type === 'error' ? '⚠️' : '✅'} {feedback.message}</span>
        </div>
      )}

      {pageError && (
        <div className="alert-banner alert-error">
          <span>⚠️ {pageError}</span>
          <button className="btn btn-sm btn-ghost" onClick={loadOfficers} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* Stats row */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#0066cc' }}>🎖️</div>
          <div className="stat-info">
            <div className="stat-value">{officers.length}</div>
            <div className="stat-label">Total Officers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
          <div className="stat-info">
            <div className="stat-value">{officers.filter(o => o.isActive !== false).length}</div>
            <div className="stat-label">Active in Service</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>🚫</div>
          <div className="stat-info">
            <div className="stat-value">{officers.filter(o => o.isActive === false).length}</div>
            <div className="stat-label">Suspended Accounts</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: '18px 24px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              className="form-input"
              placeholder="🔍  Search by officer name, email, or contact number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-ghost btn-sm" onClick={loadOfficers}>↻ Refresh</button>
          </div>

          {loading ? (
            <div className="loading-wrap">
              <div className="spinner" />
              <span>Loading officers directory...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎖️</div>
              <h3 className="empty-title">No officers found</h3>
              <p className="empty-desc">
                {search ? 'No officer accounts match your search filter.' : 'Register the first fisheries officer account using the button above.'}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Officer Profile</th>
                    <th>Email Address</th>
                    <th>Contact Phone</th>
                    <th>App Language</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((officer, idx) => (
                    <tr key={officer._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 14,
                            color: '#fff',
                            flexShrink: 0
                          }}>
                            {(officer.name || 'O')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{officer.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {officer.profile?.designation || 'Fisheries Officer'} {officer.profile?.district ? `· ${officer.profile.district}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{officer.email}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{officer.phone || '—'}</td>
                      <td>
                        <span className={`badge ${officer.preferredLanguage === 'ta' ? 'badge-warning' : 'badge-info'}`}>
                          {officer.preferredLanguage === 'ta' ? 'தமிழ்' : 'English'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${officer.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                          {officer.isActive !== false ? '● Active' : '● Suspended'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(officer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${officer.isActive !== false ? 'btn-ghost' : 'btn-success'}`}
                          onClick={() => toggleStatus(officer)}
                          style={{ fontSize: 12 }}
                        >
                          {officer.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Officer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">🎖️ Register Fisheries Officer</h2>
            <p className="modal-subtitle">Officers can immediately log in to the Ocean Connect mobile application after account creation.</p>

            {formError && (
              <div className="alert-banner alert-error" style={{ marginBottom: 18 }}>
                <span>⚠️ {formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. R. Saravanan"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Email Address *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="officer@fisheries.gov.in"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password * (min 8 characters)</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select
                    className="form-select"
                    value={form.designation}
                    onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  >
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">District Jurisdiction</label>
                  <select
                    className="form-select"
                    value={form.district}
                    onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Badge / Inspector ID</label>
                  <input
                    className="form-input"
                    placeholder="e.g. TN-FISH-042"
                    value={form.badgeNumber}
                    onChange={e => setForm(f => ({ ...f, badgeNumber: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred App Language</label>
                  <select
                    className="form-select"
                    value={form.preferredLanguage}
                    onChange={e => setForm(f => ({ ...f, preferredLanguage: e.target.value }))}
                  >
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Registering Officer...' : '✅ Create Officer Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
