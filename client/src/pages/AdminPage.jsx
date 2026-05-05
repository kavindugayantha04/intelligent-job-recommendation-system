import React, { useState, useEffect } from 'react';
import {
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  getErrorTriggers, createErrorTrigger, updateErrorTrigger, deleteErrorTrigger
} from '../api/chatApi';

const CATEGORIES = ['general', 'cv_upload', 'job_matching', 'skill_gap', 'technical', 'account'];
const ERROR_CATEGORIES = ['cv_error', 'auth_error', 'upload_error', 'server_error', 'parsing_error'];

const badge = (label, color = '#00d084') => (
  <span style={{
    padding: '3px 10px', borderRadius: 20,
    background: `${color}18`, color: color,
    fontSize: 11, fontWeight: 600, border: `1px solid ${color}30`
  }}>{label}</span>
);

const Btn = ({ children, onClick, variant = 'primary', disabled, small }) => {
  const styles = {
    primary: { background: 'linear-gradient(135deg,#00d084,#16a34a)', color: '#fff', border: 'none' },
    danger: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
    ghost: { background: 'rgba(0,208,132,0.08)', color: '#16a34a', border: '1px solid rgba(0,208,132,0.2)' },
    secondary: { background: 'rgba(0,0,0,0.05)', color: '#374151', border: '1px solid rgba(0,0,0,0.1)' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      padding: small ? '6px 14px' : '10px 20px',
      borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: small ? 12 : 13, fontWeight: 600,
      fontFamily: 'DM Sans, sans-serif',
      transition: 'all 0.2s', opacity: disabled ? 0.5 : 1,
      display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: variant === 'primary' ? '0 4px 12px rgba(0,208,132,0.3)' : 'none'
    }}>{children}</button>
  );
};

const InputField = ({ label, value, onChange, placeholder, multiline, required }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={4} style={inputStyle} />
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inputStyle} />
    )}
  </div>
);

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1px solid rgba(0,208,132,0.25)',
  borderRadius: 10, fontFamily: 'DM Sans, sans-serif',
  fontSize: 13, color: '#1a2e1a', background: '#f0fdf4',
  outline: 'none', resize: 'vertical',
  transition: 'border-color 0.2s'
};

const Modal = ({ title, children, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="fade-in" style={{
      background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      border: '1px solid rgba(0,208,132,0.2)', overflow: 'hidden'
    }}>
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid rgba(0,208,132,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #052e16, #0a3d1f)'
      }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#00d084', cursor: 'pointer', fontSize: 20 }}>✕</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const AdminPage = () => {
  const [tab, setTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | 'faq' | 'trigger'
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  // FAQ form state
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', keywords: '', category: 'general' });
  const [triggerForm, setTriggerForm] = useState({ triggerPhrase: '', response: '', errorCode: '', category: 'server_error' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadFAQs = async () => {
    setLoading(true);
    try { const r = await getFAQs(); setFaqs(r.data.data); } catch { }
    setLoading(false);
  };

  const loadTriggers = async () => {
    setLoading(true);
    try { const r = await getErrorTriggers(); setTriggers(r.data.data); } catch { }
    setLoading(false);
  };

  useEffect(() => { loadFAQs(); loadTriggers(); }, []);

  // ─── FAQ CRUD ──────────────────────────────────────────────────────────────
  const openFAQModal = (faq = null) => {
    setEditing(faq);
    setFaqForm(faq
      ? { question: faq.question, answer: faq.answer, keywords: (faq.keywords || []).join(', '), category: faq.category }
      : { question: '', answer: '', keywords: '', category: 'general' }
    );
    setModal('faq');
  };

  const saveFAQ = async () => {
    if (!faqForm.question || !faqForm.answer) return showToast('⚠️ Question and answer are required');
    const data = {
      ...faqForm,
      keywords: faqForm.keywords.split(',').map(k => k.trim()).filter(Boolean)
    };
    try {
      if (editing) { await updateFAQ(editing._id, data); showToast('✅ FAQ updated!'); }
      else { await createFAQ(data); showToast('✅ FAQ created!'); }
      setModal(null);
      loadFAQs();
    } catch { showToast('❌ Error saving FAQ'); }
  };

  const removeFAQ = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try { await deleteFAQ(id); showToast('🗑️ FAQ deleted'); loadFAQs(); } catch { showToast('❌ Error deleting'); }
  };

  // ─── Trigger CRUD ──────────────────────────────────────────────────────────
  const openTriggerModal = (t = null) => {
    setEditing(t);
    setTriggerForm(t
      ? { triggerPhrase: t.triggerPhrase, response: t.response, errorCode: t.errorCode || '', category: t.category }
      : { triggerPhrase: '', response: '', errorCode: '', category: 'server_error' }
    );
    setModal('trigger');
  };

  const saveTrigger = async () => {
    if (!triggerForm.triggerPhrase || !triggerForm.response) return showToast('⚠️ Trigger phrase and response required');
    try {
      if (editing) { await updateErrorTrigger(editing._id, triggerForm); showToast('✅ Trigger updated!'); }
      else { await createErrorTrigger(triggerForm); showToast('✅ Trigger created!'); }
      setModal(null);
      loadTriggers();
    } catch { showToast('❌ Error saving trigger'); }
  };

  const removeTrigger = async (id) => {
    if (!window.confirm('Delete this trigger?')) return;
    try { await deleteErrorTrigger(id); showToast('🗑️ Trigger deleted'); loadTriggers(); } catch { showToast('❌ Error deleting'); }
  };

  const catColor = { general: '#6b7280', cv_upload: '#2563eb', job_matching: '#7c3aed', skill_gap: '#d97706', technical: '#dc2626', account: '#0891b2' };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f0fdf4' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          padding: '12px 20px', borderRadius: 12,
          background: '#052e16', color: '#fff', fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'fadeIn 0.3s ease'
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 28px', background: '#fff', borderBottom: '1px solid rgba(0,208,132,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#052e16', margin: 0 }}>⚙️ Admin Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Manage FAQ pairs, error triggers & chatbot responses</p>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 28px', background: '#fff', borderBottom: '1px solid rgba(0,208,132,0.1)', display: 'flex', gap: 4 }}>
        {[{ key: 'faqs', label: `📋 FAQ Pairs (${faqs.length})` }, { key: 'triggers', label: `⚡ Error Triggers (${triggers.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '14px 20px', border: 'none', background: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? '#00d084' : '#6b7280',
            borderBottom: tab === t.key ? '3px solid #00d084' : '3px solid transparent',
            transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
            marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {tab === 'faqs' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#052e16', margin: 0 }}>FAQ Knowledge Base</h2>
              <Btn onClick={() => openFAQModal()}>+ Add FAQ</Btn>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#00d084', fontSize: 24 }}>⟳</div>
            ) : faqs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p>No FAQs yet. Run <code>node seed.js</code> in backend to seed data.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {faqs.map(faq => (
                  <div key={faq._id} className="fade-in" style={{
                    background: '#fff', borderRadius: 14, padding: '18px 20px',
                    border: '1px solid rgba(0,208,132,0.15)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          {badge(faq.category, catColor[faq.category] || '#6b7280')}
                          {badge(`${faq.hitCount || 0} hits`, '#7c3aed')}
                          {!faq.isActive && badge('Inactive', '#ef4444')}
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#052e16', marginBottom: 6 }}>❓ {faq.question}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                          {faq.answer.substring(0, 120)}{faq.answer.length > 120 ? '...' : ''}
                        </p>
                        {faq.keywords?.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {faq.keywords.map(k => (
                              <span key={k} style={{ padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', border: '1px solid rgba(0,208,132,0.2)', fontSize: 11, color: '#16a34a' }}>{k}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Btn variant="ghost" small onClick={() => openFAQModal(faq)}>✏️ Edit</Btn>
                        <Btn variant="danger" small onClick={() => removeFAQ(faq._id)}>🗑️ Delete</Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'triggers' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#052e16', margin: 0 }}>Error Handling Triggers</h2>
              <Btn onClick={() => openTriggerModal()}>+ Add Trigger</Btn>
            </div>
            {triggers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
                <p>No error triggers yet. Add your first one!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {triggers.map(t => (
                  <div key={t._id} className="fade-in" style={{
                    background: '#fff', borderRadius: 14, padding: '18px 20px',
                    border: '1px solid rgba(239,68,68,0.15)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 6, background: '#1a2e1a', color: '#00d084', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>
                            "{t.triggerPhrase}"
                          </span>
                          {badge(t.category, '#ef4444')}
                          {t.errorCode && badge(t.errorCode, '#f97316')}
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                          {t.response.substring(0, 120)}{t.response.length > 120 ? '...' : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Btn variant="ghost" small onClick={() => openTriggerModal(t)}>✏️ Edit</Btn>
                        <Btn variant="danger" small onClick={() => removeTrigger(t._id)}>🗑️ Delete</Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAQ Modal */}
      {modal === 'faq' && (
        <Modal title={editing ? '✏️ Edit FAQ' : '➕ New FAQ'} onClose={() => setModal(null)}>
          <InputField label="Question" value={faqForm.question} onChange={v => setFaqForm(p => ({ ...p, question: v }))} placeholder="e.g. How do I upload my CV?" required />
          <InputField label="Answer" value={faqForm.answer} onChange={v => setFaqForm(p => ({ ...p, answer: v }))} placeholder="The bot response..." multiline required />
          <InputField label="Keywords (comma separated)" value={faqForm.keywords} onChange={v => setFaqForm(p => ({ ...p, keywords: v }))} placeholder="upload, cv, resume, file" />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
            <select value={faqForm.category} onChange={e => setFaqForm(p => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveFAQ}>{editing ? 'Update FAQ' : 'Create FAQ'}</Btn>
          </div>
        </Modal>
      )}

      {/* Trigger Modal */}
      {modal === 'trigger' && (
        <Modal title={editing ? '✏️ Edit Trigger' : '➕ New Error Trigger'} onClose={() => setModal(null)}>
          <InputField label="Trigger Phrase" value={triggerForm.triggerPhrase} onChange={v => setTriggerForm(p => ({ ...p, triggerPhrase: v }))} placeholder="e.g. server error, 404, upload failed" required />
          <InputField label="Error Code (optional)" value={triggerForm.errorCode} onChange={v => setTriggerForm(p => ({ ...p, errorCode: v }))} placeholder="e.g. HTTP_500" />
          <InputField label="Bot Response" value={triggerForm.response} onChange={v => setTriggerForm(p => ({ ...p, response: v }))} placeholder="What the bot should say..." multiline required />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
            <select value={triggerForm.category} onChange={e => setTriggerForm(p => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
              {ERROR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveTrigger}>{editing ? 'Update Trigger' : 'Create Trigger'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPage;
