import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import GovSkeleton from '../components/GovSkeleton';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const ReportsPage = () => {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  
  // AI report generation
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState('');

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      };
      
      const res = await api.get('/analytics/summary', { params });
      setMetrics(res.data?.data || {});
    } catch (err) {
      showToast('Error', 'Failed to compile report metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post('/ai/generate-report', {
        metrics: metrics,
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      });
      setAiReport(res.data?.data?.report || res.data?.data || 'Report generated successfully.');
      showToast('Success', 'AI analysis summary compiled', 'success');
    } catch (err) {
      showToast('Error', 'Failed to generate AI executive summary', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden print:h-auto print:bg-white print:overflow-visible">
      
      {/* Header hidden during print */}
      <div className="print:hidden">
        <GovHeader />
      </div>

      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        {/* Sidebar hidden during print */}
        <div className="print:hidden">
          <GovSidebar />
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 print:hidden">
            <div>
              <h2 className="text-[20px] font-bold text-primary uppercase tracking-wide">Analytical Reports</h2>
              <p className="text-[12px] text-gray-500 font-medium">Compile, export, and synthesize incident reports & executive logs.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="gov-btn-outline flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Memo
              </button>
              <button 
                onClick={handleGenerateAI}
                disabled={generatingAI || loading}
                className="gov-btn-primary flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {generatingAI ? 'Compiling AI...' : 'AI Synthesis'}
              </button>
            </div>
          </div>

          {/* Date Picker Section */}
          <div className="bg-white p-4 rounded-lg border border-border shadow-sm flex flex-col sm:flex-row gap-4 items-center print:hidden">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Select Range:</span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={new Date()}
                className="gov-form-input text-center text-[13px]"
              />
              <span className="text-gray-400 font-bold">to</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                maxDate={new Date()}
                className="gov-form-input text-center text-[13px]"
              />
            </div>
            <button 
              onClick={fetchReportData}
              className="sm:ml-auto gov-btn-primary px-4 py-2 h-10 text-[12px] uppercase font-bold tracking-wider"
            >
              Compile Data
            </button>
          </div>

          {/* Print Header Memo */}
          <div className="hidden print:block text-center border-b-4 border-primary pb-4 mb-6">
            <h1 className="text-[24px] font-black text-primary uppercase">Traffic &amp; Accident Management System</h1>
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Ministry of Road Transport — Punjab Region</p>
            <div className="mt-4 text-[12px] font-semibold text-gray-600 flex justify-between">
              <span>REPORT INTERVAL: {startDate.toLocaleDateString('en-IN')} - {endDate.toLocaleDateString('en-IN')}</span>
              <span>COMPILED ON: {new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Report Dashboard */}
          <div className="space-y-6 print:space-y-4">
            
            {loading ? (
              <GovSkeleton type="card" count={4} />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                {[
                  { label: 'Total Incidents', value: metrics?.total_incidents, border: 'border-l-primary' },
                  { label: 'Active Incidents', value: metrics?.active_count, border: 'border-l-danger' },
                  { label: 'Resolved Cases', value: metrics?.resolved_count, border: 'border-l-success' },
                  { label: 'Critical Cases', value: metrics?.critical_count, border: 'border-l-accent' }
                ].map(({ label, value, border }) => (
                  <div key={label} className={`bg-white p-5 rounded-lg border border-border shadow-sm border-l-[5px] ${border} text-center`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-[28px] font-black text-primary leading-none">{value ?? 0}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Metrics Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              
              <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
                <h3 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border pb-2 mb-4">Summary Statistics</h3>
                <ul className="space-y-3 text-[13px] text-gray-600">
                  <li className="flex justify-between font-semibold">
                    <span>Average Resolution Time:</span>
                    <span className="text-primary font-bold">{metrics?.avg_response_time != null ? `${metrics.avg_response_time} hours` : '—'}</span>
                  </li>
                  <li className="flex justify-between font-semibold">
                    <span>Incident Severity Ratio (Critical/Total):</span>
                    <span className="text-primary font-bold">
                      {metrics?.total_incidents ? ((metrics.critical_count / metrics.total_incidents) * 100).toFixed(1) + '%' : '0%'}
                    </span>
                  </li>
                  <li className="flex justify-between font-semibold">
                    <span>Incidents Logged Today:</span>
                    <span className="text-primary font-bold">{metrics?.incidents_today ?? 0}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
                <h3 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border pb-2 mb-4">Verification Signature</h3>
                <div className="h-20 flex items-end justify-between text-[11px] font-bold text-gray-400 uppercase mt-4">
                  <div className="border-t border-dashed border-gray-300 pt-1.5 w-[45%] text-center">Officer Signature</div>
                  <div className="border-t border-dashed border-gray-300 pt-1.5 w-[45%] text-center">System Stamp</div>
                </div>
              </div>

            </div>

            {/* AI Summary Memo */}
            {(aiReport || generatingAI) && (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-lg space-y-3 print:bg-white print:border-none print:p-0">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-1 print:border-none">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  <h4 className="font-bold text-primary uppercase text-sm tracking-wide">AI Synthesis Report Analysis</h4>
                </div>
                {generatingAI ? (
                  <GovSkeleton type="text" rows={4} />
                ) : (
                  <div className="text-[13px] text-gray-700 leading-relaxed font-serif whitespace-pre-wrap">
                    {aiReport}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

    </div>
  );
};

export default ReportsPage;
