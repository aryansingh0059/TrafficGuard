import React, { useState } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import api from '../services/api';

/* ────────────────────────────────────────────────────────────────────────── */
/* Colour constants                                                           */
/* ────────────────────────────────────────────────────────────────────────── */
const TYPE_COLORS = {
  Accident:        '#b71c1c',
  Congestion:      '#d4a017',
  Roadblock:       '#1a3a5c',
  Signal_failure:  '#2e7d32',
  Hazard:          '#e65100',
};

const SEV_COLORS = {
  Critical: '#b71c1c',
  High:     '#e65100',
  Medium:   '#d4a017',
  Low:      '#2e7d32',
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Inline styles (no Tailwind dependency for new sections)                   */
/* ────────────────────────────────────────────────────────────────────────── */
const s = {
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  kpiCard: (borderColor) => ({
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #dde1e7',
    borderLeft: `5px solid ${borderColor}`,
    padding: '1.25rem',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  }),
  kpiLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: '6px',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: 900,
    color: '#1a3a5c',
    lineHeight: 1,
  },
  sectionCard: {
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #dde1e7',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1a3a5c',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    borderBottom: '1px solid #dde1e7',
    paddingBottom: '8px',
    marginBottom: '1rem',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  errorBanner: {
    background: '#fff5f5',
    border: '1px solid #fecaca',
    borderLeft: '4px solid #b71c1c',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '1rem',
    color: '#b71c1c',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#9ca3af',
  },
  /* Modal */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '10px',
    width: '720px',
    maxWidth: '95vw',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,.25)',
  },
  modalHead: {
    background: '#1a3a5c',
    color: '#fff',
    padding: '1rem 1.25rem',
    borderRadius: '10px 10px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBody: {
    padding: '1.25rem',
    overflowY: 'auto',
    flex: 1,
  },
  modalFoot: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid #dde1e7',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f0f0f0',
    borderTop: '4px solid #1a3a5c',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem',
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Skeleton card                                                              */
/* ────────────────────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div style={{
    background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: '8px',
    height: '96px',
  }} />
);

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
const ReportsPage = () => {
  /* Date range state */
  const [from, setFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  /* Data & UI state */
  const [reportData, setReportData] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  /* AI state */
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiReport,     setAiReport]     = useState(null);
  const [showAiModal,  setShowAiModal]  = useState(false);

  /* ── Compile ─────────────────────────────────────────────────────────── */
  const handleCompile = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const res  = await api.get(`/admin/reports/compile?from=${from}&to=${to}`);
      const data = res.data?.data || res.data;
      setReportData(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to compile report. Please check your connection and try again.'
      );
      console.error('Compile error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── AI Synthesis ────────────────────────────────────────────────────── */
  const handleAiSynthesis = async () => {
    if (!reportData) {
      alert('Please compile the report data first before generating AI synthesis.');
      return;
    }
    setAiLoading(true);
    setShowAiModal(true);
    setAiReport(null);
    try {
      const res  = await api.post('/admin/reports/synthesize', { from, to });
      const data = res.data?.data || res.data;
      setAiReport(data);
    } catch (err) {
      setAiReport({
        error:
          err.response?.data?.message ||
          'AI synthesis failed. Please check your Groq API key in .env',
      });
    } finally {
      setAiLoading(false);
    }
  };

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const formatAvgResolution = (val) => {
    if (val == null) return '—';
    const h = Math.floor(val);
    const m = Math.round((val % 1) * 60);
    return `${h}h ${m}m`;
  };

  const systemStamp = `TAMS/RPT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Spinner & shimmer keyframes */}
      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden print:h-auto print:bg-white">

        {/* Header */}
        <div className="print:hidden"><GovHeader /></div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="print:hidden"><GovSidebar /></div>

          <main className="flex-1 overflow-y-auto p-6 space-y-0 print:p-0">

            {/* ── Page title bar ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 mb-5 print:hidden">
              <div>
                <h2 className="text-[20px] font-bold text-primary uppercase tracking-wide">
                  Analytical Reports
                </h2>
                <p className="text-[12px] text-gray-500 font-medium">
                  Compile, export, and synthesise incident reports &amp; executive logs.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="gov-btn-outline flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider bg-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Memo
                </button>
                <button
                  id="btn-ai-synthesis"
                  onClick={handleAiSynthesis}
                  disabled={aiLoading || !reportData}
                  className="gov-btn-primary flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {aiLoading ? 'Generating…' : 'AI Synthesis'}
                </button>
              </div>
            </div>

            {/* ── Date range + compile ─────────────────────────────────── */}
            <div className="bg-white p-4 rounded-lg border border-border shadow-sm flex flex-col sm:flex-row gap-4 items-center mb-5 print:hidden">
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider shrink-0">
                Select Range:
              </span>
              <div className="flex items-center gap-2">
                <input
                  id="input-from-date"
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                  className="gov-form-input text-[13px] px-3 py-2 border border-border rounded"
                />
                <span className="text-gray-400 font-bold">to</span>
                <input
                  id="input-to-date"
                  type="date"
                  value={to}
                  min={from}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTo(e.target.value)}
                  className="gov-form-input text-[13px] px-3 py-2 border border-border rounded"
                />
              </div>
              <button
                id="btn-compile-data"
                onClick={handleCompile}
                disabled={loading}
                className="sm:ml-auto gov-btn-primary px-5 py-2.5 h-10 text-[12px] uppercase font-bold tracking-wider disabled:opacity-60"
              >
                {loading ? 'Compiling…' : 'Compile Data'}
              </button>
            </div>

            {/* ── Error banner ─────────────────────────────────────────── */}
            {error && (
              <div style={s.errorBanner}>
                ⚠ {error}
              </div>
            )}

            {/* ── Loading skeletons ────────────────────────────────────── */}
            {loading && (
              <div style={{ ...s.kpiGrid, marginBottom: '1.5rem' }}>
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {!reportData && !loading && !error && (
              <div style={s.emptyState}>
                <div style={{ fontSize: '52px', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ color: '#1a3a5c', fontWeight: 700, marginBottom: '8px', fontSize: '18px' }}>
                  No Report Generated Yet
                </h3>
                <p style={{ fontSize: '14px', marginBottom: '1.5rem', color: '#6b7280' }}>
                  Select a date range above and click <strong>Compile Data</strong> to generate the full report.
                </p>
                <button
                  onClick={handleCompile}
                  style={{
                    padding: '10px 28px', background: '#1a3a5c', color: '#fff',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 700, letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Compile Now
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* REPORT CONTENT — only rendered when data is available     */}
            {/* ══════════════════════════════════════════════════════════ */}
            {reportData && !loading && (
              <>
                {/* ── KPI cards ────────────────────────────────────────── */}
                <div style={s.kpiGrid}>
                  {[
                    { label: 'Total Incidents',  value: reportData.total,    color: '#1a3a5c' },
                    { label: 'Active Incidents', value: reportData.active,   color: '#b71c1c' },
                    { label: 'Resolved Cases',   value: reportData.resolved, color: '#2e7d32' },
                    { label: 'Critical Cases',   value: reportData.critical, color: '#d4a017' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={s.kpiCard(color)}>
                      <p style={s.kpiLabel}>{label}</p>
                      <p style={{ ...s.kpiValue, color }}>{value ?? '—'}</p>
                    </div>
                  ))}
                </div>

                {/* ── Incident Trend (area chart — full width) ─────────── */}
                {reportData.by_date?.length > 0 && (
                  <div style={s.sectionCard}>
                    <p style={s.sectionTitle}>Incident Trend — Daily Volume</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={reportData.by_date} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#1a3a5c" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#1a3a5c" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Incidents"
                          stroke="#1a3a5c"
                          fill="url(#areaGrad)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#1a3a5c' }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* ── Type + Severity charts (side-by-side) ────────────── */}
                <div style={s.chartsRow}>
                  {/* Pie — by type */}
                  {reportData.by_type?.length > 0 && (
                    <div style={s.sectionCard}>
                      <p style={s.sectionTitle}>Distribution by Type</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={reportData.by_type}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={95}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                          >
                            {reportData.by_type.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={TYPE_COLORS[entry.name] ||
                                  ['#1a3a5c','#d4a017','#2e7d32','#e65100','#7c3aed'][i % 5]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [v, 'Incidents']} />
                          <Legend iconType="circle" iconSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Bar — by severity */}
                  {reportData.by_severity?.length > 0 && (
                    <div style={s.sectionCard}>
                      <p style={s.sectionTitle}>Severity Analysis</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={reportData.by_severity} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => [v, 'Incidents']} />
                          <Bar dataKey="value" name="Incidents" radius={[5, 5, 0, 0]}>
                            {reportData.by_severity.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={SEV_COLORS[entry.name] ||
                                  ['#1a3a5c','#d4a017','#2e7d32','#e65100'][i % 4]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* ── Summary statistics + signature ───────────────────── */}
                <div style={{ ...s.chartsRow, marginBottom: '1.5rem' }}>
                  <div style={s.sectionCard}>
                    <p style={s.sectionTitle}>Summary Statistics</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#4b5563' }}>
                      {[
                        ['Average Resolution Time',         formatAvgResolution(reportData.avg_resolution)],
                        ['Resolution Rate',                  `${reportData.resolution_rate ?? '—'}%`],
                        ['Severity Ratio (Critical/Total)',  `${reportData.severity_ratio ?? '—'}%`],
                        ['Incidents Logged Today',           reportData.today_count ?? '—'],
                        ['Peak Day',                         reportData.peak_day
                          ? `${reportData.peak_day.date} — ${reportData.peak_day.count} incidents`
                          : '—'],
                        ['Most Common Type',                 reportData.most_common_type?.name ?? '—'],
                      ].map(([label, val]) => (
                        <li key={label} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontWeight: 600, padding: '6px 0',
                          borderBottom: '1px solid #f3f4f6',
                        }}>
                          <span>{label}:</span>
                          <span style={{ color: '#1a3a5c', fontWeight: 700 }}>{val}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={s.sectionCard}>
                    <p style={s.sectionTitle}>Verification Signature</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                      <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px' }}>
                        <strong style={{ color: '#1a3a5c' }}>Report Period:</strong>{' '}
                        {reportData.period?.from} — {reportData.period?.to}
                      </div>
                      <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px' }}>
                        <strong style={{ color: '#1a3a5c' }}>System Stamp:</strong>{' '}
                        {systemStamp}
                      </div>
                      <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px' }}>
                        <strong style={{ color: '#1a3a5c' }}>Compiled On:</strong>{' '}
                        {new Date().toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{
                      marginTop: '1.5rem',
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '11px', fontWeight: 700,
                      color: '#9ca3af', textTransform: 'uppercase',
                    }}>
                      <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '6px', width: '45%', textAlign: 'center' }}>
                        Officer Signature
                      </div>
                      <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '6px', width: '45%', textAlign: 'center' }}>
                        Authorising Officer
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Hotspots table ───────────────────────────────────── */}
                {reportData.hotspots?.length > 0 && (
                  <div style={{ ...s.sectionCard, marginBottom: '2rem' }}>
                    <p style={s.sectionTitle}>Top Incident Hotspots</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['Rank', 'Location', 'Incidents', 'Share'].map((h) => (
                            <th key={h} style={{
                              textAlign: 'left', padding: '8px 12px',
                              fontSize: '11px', fontWeight: 800,
                              color: '#6b7280', textTransform: 'uppercase',
                              letterSpacing: '.06em', borderBottom: '1px solid #e5e7eb',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.hotspots.map((h, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1a3a5c' }}>
                              #{i + 1}
                            </td>
                            <td style={{ padding: '9px 12px', color: '#374151', fontWeight: 600 }}>
                              {h.location}
                            </td>
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: '#b71c1c' }}>
                              {h.count}
                            </td>
                            <td style={{ padding: '9px 12px', minWidth: '120px' }}>
                              <div style={{
                                width: `${(h.count / reportData.hotspots[0].count) * 100}%`,
                                background: 'linear-gradient(90deg,#1a3a5c,#2563eb)',
                                height: '7px', borderRadius: '4px', minWidth: '4px',
                              }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </main>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* AI Synthesis Modal                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showAiModal && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowAiModal(false)}>
          <div style={s.modal}>

            {/* Header */}
            <div style={s.modalHead}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>AI Analytical Report</span>
                <span style={{ fontSize: '12px', opacity: .75, marginLeft: '8px' }}>
                  Groq · llama-3.3-70b-versatile
                </span>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Body */}
            <div style={s.modalBody}>

              {/* Loading state */}
              {aiLoading && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={s.spinner} />
                  <p style={{ color: '#1a3a5c', fontWeight: 600, marginBottom: '6px' }}>
                    Groq AI is analysing your traffic data…
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '13px' }}>This may take 10–20 seconds</p>
                </div>
              )}

              {/* Error */}
              {!aiLoading && aiReport?.error && (
                <div style={{
                  color: '#b71c1c', padding: '1rem',
                  background: '#fff5f5', borderRadius: '6px',
                  border: '1px solid #fecaca',
                }}>
                  ⚠ {aiReport.error}
                </div>
              )}

              {/* Report text */}
              {!aiLoading && aiReport?.report && (
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic', marginBottom: '1rem' }}>
                    Generated at: {aiReport.generated_at} &nbsp;|&nbsp;
                    Period: {aiReport.period?.from} to {aiReport.period?.to}
                  </p>
                  <hr style={{ marginBottom: '1rem', borderColor: '#e5e7eb' }} />

                  {aiReport.report.split('\n').map((line, i) => {
                    if (/^\d\)/.test(line.trim())) {
                      return (
                        <h3 key={i} style={{
                          color: '#1a3a5c', fontSize: '14px', fontWeight: 700,
                          marginTop: '1.25rem', paddingLeft: '12px',
                          borderLeft: '3px solid #d4a017',
                        }}>
                          {line.trim()}
                        </h3>
                      );
                    }
                    if (line.trim().startsWith('•')) {
                      return (
                        <p key={i} style={{
                          color: '#374151', fontSize: '13px', lineHeight: '1.7',
                          paddingLeft: '1.25rem', marginBottom: '4px',
                        }}>{line}</p>
                      );
                    }
                    if (!line.trim()) return <br key={i} />;
                    return (
                      <p key={i} style={{
                        color: '#374151', fontSize: '13px',
                        lineHeight: '1.7', marginBottom: '6px',
                      }}>{line}</p>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer — only when report is ready */}
            {!aiLoading && aiReport?.report && (
              <div style={s.modalFoot}>
                <button
                  onClick={() => { navigator.clipboard.writeText(aiReport.report); alert('Report copied to clipboard!'); }}
                  style={{
                    padding: '8px 16px', border: '1px solid #1a3a5c',
                    color: '#1a3a5c', borderRadius: '5px',
                    background: '#fff', cursor: 'pointer', fontSize: '13px',
                  }}
                >
                  Copy Report
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      padding: '8px 16px', background: '#d4a017',
                      color: '#fff', border: 'none', borderRadius: '5px',
                      cursor: 'pointer', fontSize: '13px',
                    }}
                  >Print</button>
                  <button
                    onClick={() => setShowAiModal(false)}
                    style={{
                      padding: '8px 16px', background: '#1a3a5c',
                      color: '#fff', border: 'none', borderRadius: '5px',
                      cursor: 'pointer', fontSize: '13px',
                    }}
                  >Close</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default ReportsPage;
