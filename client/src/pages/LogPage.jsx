import React, { useState, useEffect } from 'react';
import { getLogs, getStats, deleteLog } from '../api/chatApi';

const StatCard = ({ icon, label, value, color = '#00d084' }) => (
  <div style={{
    background: '#fff', borderRadius: 14, padding: '20px',
    border: `1px solid ${color}22`,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex', alignItems: 'center', gap: 16
  }}>
    <div style={{
      width: 50, height: 50, borderRadius: 12,
      background: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#052e16' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([getLogs({ limit: 100 }), getStats()]);
      setLogs(logsRes.data.data);
      setStats(statsRes.data.stats);
    } catch { showToast('❌ Failed to load logs'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log?')) return;
    try { await deleteLog(id); showToast('🗑️ Log deleted'); load(); } catch { showToast('❌ Error'); }
  };

  const formatTime = (d) => {
    const date = new Date(d);
    return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f0fdf4' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, padding: '12px 20px', borderRadius: 12, background: '#052e16', color: '#fff', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 28px', background: '#fff', borderBottom: '1px solid rgba(0,208,132,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#052e16', margin: 0 }}>📊 Interaction Logs</h1>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Monitor chatbot interactions and user sessions</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard icon="💬" label="Total Sessions" value={stats.totalSessions} />
            <StatCard icon="✅" label="Resolved" value={stats.resolvedSessions} color="#22c55e" />
            <StatCard icon="⏳" label="Unresolved" value={stats.unresolvedSessions} color="#f97316" />
            <StatCard icon="📨" label="Total Messages" value={stats.totalMessages} color="#7c3aed" />
            <StatCard icon="⭐" label="Avg. Rating" value={stats.averageRating} color="#f59e0b" />
          </div>
        )}

        {/* Top FAQs */}
        {stats?.topFAQs?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', marginBottom: 24, border: '1px solid rgba(0,208,132,0.15)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#052e16', marginBottom: 14 }}>🔥 Most Asked Questions</h3>
            {stats.topFAQs.map((faq, i) => (
              <div key={faq._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < stats.topFAQs.length - 1 ? '1px solid rgba(0,208,132,0.1)' : 'none' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,208,132,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{faq.question}</span>
                <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(0,208,132,0.1)', color: '#00d084', fontSize: 11, fontWeight: 700 }}>{faq.hitCount} hits</span>
              </div>
            ))}
          </div>
        )}

        {/* Logs table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,208,132,0.15)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,208,132,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#052e16', margin: 0 }}>Session History</h3>
            <button onClick={load} style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.2)', borderRadius: 8, padding: '6px 14px', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>↻ Refresh</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#00d084', fontSize: 24 }}>⟳ Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p>No logs yet. Start chatting to generate logs!</p>
            </div>
          ) : (
            <div>
              {logs.map(log => (
                <div key={log._id} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(0,208,132,0.08)',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer',
                  background: selected?._id === log._id ? 'rgba(0,208,132,0.05)' : 'transparent',
                  transition: 'background 0.15s'
                }} onClick={() => setSelected(selected?._id === log._id ? null : log)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{log.sessionId?.substring(0, 16)}...</span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: log.resolved ? 'rgba(0,208,132,0.1)' : 'rgba(249,115,22,0.1)', color: log.resolved ? '#16a34a' : '#f97316', fontSize: 11, fontWeight: 600 }}>
                        {log.resolved ? '✅ Resolved' : '⏳ Pending'}
                      </span>
                      {log.rating && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 11 }}>⭐ {log.rating}/5</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {log.totalMessages} messages · {formatTime(log.createdAt)}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(log._id); }}
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '5px 10px', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected session detail */}
        {selected && (
          <div className="fade-in" style={{ background: '#fff', borderRadius: 14, padding: '20px', marginTop: 20, border: '1px solid rgba(0,208,132,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#052e16', marginBottom: 16 }}>💬 Session Transcript</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.messages?.map((msg, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: msg.sender === 'user' ? 'rgba(0,208,132,0.08)' : '#f9fafb',
                  border: msg.sender === 'user' ? '1px solid rgba(0,208,132,0.2)' : '1px solid #e5e7eb',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: msg.sender === 'user' ? '#00d084' : '#6b7280', marginBottom: 4 }}>
                    {msg.sender === 'user' ? '👤 User' : '🤖 Bot'}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
