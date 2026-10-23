import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import styles from './DataPage.module.css';

const CATEGORIES = ['welfare', 'training', 'insurance', 'equipment', 'subsidy', 'other'];
const INITIAL_FORM = {
  title: '', titleTamil: '', description: '', descriptionTamil: '',
  category: 'welfare', eligibility: '', applicationUrl: '', isActive: true,
};

export default function SchemesPage() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]         = useState(INITIAL_FORM);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [modalError, setModalError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/schemes', { params: { limit: 50, all: 'true' } });
      setRecords(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Unable to retrieve government schemes list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setForm(INITIAL_FORM);
    setModalError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '',
      titleTamil: item.titleTamil || '',
      description: item.description || '',
      descriptionTamil: item.descriptionTamil || '',
      category: item.category || 'welfare',
      eligibility: item.eligibility || '',
      applicationUrl: item.applicationUrl || '',
      isActive: item.isActive !== false,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setModalError('Scheme title in English is required.');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      if (editItem) {
        await api.put(`/schemes/${editItem._id}`, form);
        setFeedback({ message: `Scheme "${form.title}" updated successfully.`, type: 'success' });
      } else {
        await api.post('/schemes', form);
        setFeedback({ message: `New scheme "${form.title}" published.`, type: 'success' });
      }
      setShowModal(false);
      load();
      setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to save scheme. Please verify details.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/schemes/${item._id}`, { isActive: !item.isActive });
      setFeedback({
        message: `Scheme "${item.title}" is now ${!item.isActive ? 'Active' : 'Archived'}.`,
        type: 'success',
      });
      load();
      setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    } catch (e) {
      setFeedback({ message: 'Failed to update scheme status.', type: 'error' });
    }
  };

  const filtered = records.filter(r =>
    !search ||
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.titleTamil?.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📜 Government Welfare Schemes</h1>
          <p className={styles.pageSubtitle}>{records.length} total government subsidies and schemes registered</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            className="form-input"
            placeholder="🔍 Search schemes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          <button className="btn btn-primary" onClick={openCreate}>+ Publish Scheme</button>
        </div>
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

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading schemes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h2 className="empty-title">No Schemes Found</h2>
          <p className="empty-desc">No published schemes match your current search.</p>
          <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>+ Add First Scheme</button>
        </div>
      ) : (
        <div className={styles.schemeGrid}>
          {filtered.map(item => (
            <div
              key={item._id}
              className={styles.schemeCard}
              style={{ opacity: item.isActive ? 1 : 0.65 }}
            >
              <div className={styles.schemeCardTop}>
                <div style={{ flex: 1 }}>
                  <span className="badge badge-info" style={{ marginBottom: 8, display: 'inline-flex', textTransform: 'capitalize' }}>
                    {item.category}
                  </span>
                  <h3 className={styles.schemeTitle}>{item.title}</h3>
                  {item.titleTamil && <p className={styles.schemeTitleTa}>{item.titleTamil}</p>}
                </div>
                <div>
                  <button
                    className={`btn btn-sm ${item.isActive ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => toggleActive(item)}
                    style={{ fontSize: 11, padding: '4px 12px' }}
                  >
                    {item.isActive ? '● Active' : '○ Inactive'}
                  </button>
                </div>
              </div>

              <p className={styles.schemeDesc}>{item.description}</p>

              {item.eligibility && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  <strong style={{ color: '#0066cc' }}>Eligibility:</strong> {item.eligibility}
                </p>
              )}

              <div className={styles.schemeFooter}>
                {item.applicationUrl ? (
                  <a href={item.applicationUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsLink}>
                    🔗 Application Link
                  </a>
                ) : <span />}
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editItem ? 'Edit Government Scheme' : 'Publish Government Scheme'}</h2>
            <p className="modal-subtitle">Provide details in English and Tamil for bilingual fisherman accessibility</p>

            {modalError && (
              <div className="alert-banner alert-error" style={{ marginBottom: 16 }}>
                <span>⚠️ {modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Title (English) *</label>
                  <input
                    className="form-input"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Deep Sea Fishing Boat Subsidy"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Title (Tamil)</label>
                  <input
                    className="form-input"
                    value={form.titleTamil}
                    onChange={e => setForm(f => ({ ...f, titleTamil: e.target.value }))}
                    placeholder="ஆழ்கடல் மீன்பிடி படகு மானியம்"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (English)</label>
                <textarea
                  className="form-input"
                  style={{ height: 75, paddingTop: 10, resize: 'vertical' }}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Outline key benefits and support offered under this scheme…"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Tamil)</label>
                <textarea
                  className="form-input"
                  style={{ height: 75, paddingTop: 10, resize: 'vertical' }}
                  value={form.descriptionTamil}
                  onChange={e => setForm(f => ({ ...f, descriptionTamil: e.target.value }))}
                  placeholder="இத்திட்டத்தின் முக்கிய பயன்களை விவரிக்கவும்…"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Eligibility Criteria</label>
                  <input
                    className="form-input"
                    value={form.eligibility}
                    onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))}
                    placeholder="e.g. Registered traditional fishermen"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Application Web Link</label>
                  <input
                    className="form-input"
                    type="url"
                    value={form.applicationUrl}
                    onChange={e => setForm(f => ({ ...f, applicationUrl: e.target.value }))}
                    placeholder="https://fisheries.tn.gov.in/…"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 17, height: 17, cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  Active (immediately visible to fishermen on mobile app)
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Scheme…' : editItem ? 'Update Scheme' : 'Publish Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
