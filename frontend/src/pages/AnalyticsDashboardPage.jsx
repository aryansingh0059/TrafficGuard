import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  getAnalyticsSummary,
  getAnalyticsByType,
  getAnalyticsByDate,
  getAnalyticsBySeverity,
  getAnalyticsHotspots,
  generateAIReport
} from '../services/analyticsService';
import { useNavigate } from 'react-router-dom';
import ReportModal from '../components/ReportModal';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import GovSkeleton from '../components/GovSkeleton';
import GovEmpty from '../components/GovEmpty';

const COLORS = ['#1a3a5c', '#d4a017', '#1d5fa6', '#2e7d32', '#e65100', '#b71c1c'];
const SEVERITY_COLORS = {
  Low: '#2e7d32',
  Medium: '#d4a017',
  High: '#e65100',
  Critical: '#b71c1c'
};

const AnalyticsDashboardPage = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {},
    byType: [],
    byDate: [],
    bySeverity: [],
    hotspots: []
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      };
      
      const [summaryRes, byTypeRes, byDateRes, bySeverityRes, hotspotsRes] = await Promise.all([
        getAnalyticsSummary(params),
        getAnalyticsByType(params),
        getAnalyticsByDate(params),
        getAnalyticsBySeverity(params),
        getAnalyticsHotspots(params)
      ]);

      setData({
        summary: summaryRes?.data?.data || {},
        byType: byTypeRes?.data?.data || [],
        byDate: byDateRes?.data?.data || [],
        bySeverity: bySeverityRes?.data?.data || [],
        hotspots: hotspotsRes?.data?.data || []
      });
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const params = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        report_type: 'custom'
      };
      const res = await generateAIReport(params);
      setReportData(res.data.data);
      setIsReportModalOpen(true);
    } catch (error) {
      console.error("Failed to generate report", error);
      alert(error.response?.data?.message || 'Failed to generate report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const maxHotspotCount = data.hotspots.length > 0 ? Math.max(...data.hotspots.map(h => h.count)) : 1;

  const renderSkeleton = () => (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <GovSkeleton count={1} type="card" className="h-20 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GovSkeleton count={1} type="chart" className="h-[350px]" />
        <GovSkeleton count={1} type="chart" className="h-[350px]" />
        <GovSkeleton count={1} type="chart" className="h-[350px]" />
        <GovSkeleton count={1} type="chart" className="h-[350px]" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden">
      <style>
        {`
          @media print {
            body { background-color: #fff !important; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .print-container { height: auto !important; overflow: visible !important; }
            .gov-card { 
              border: 1px solid #dde1e7 !important; 
              box-shadow: none !important; 
              break-inside: avoid; 
              page-break-inside: avoid;
              margin-bottom: 24px !important;
            }
            .gov-btn-primary, button { display: none !important; }
            @page {
              margin: 20mm;
              @bottom-center {
                content: "Confidential — Government of India";
                font-size: 10px;
                color: #666;
              }
            }
          }
          .print-only { display: none; }
        `}
      </style>

      <div className="no-print">
        <GovHeader />
      </div>
      
      <div className="flex flex-1 overflow-hidden print-container">
        <div className="no-print">
          <GovSidebar />
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto p-6 space-y-6 print-container" style={{ backgroundColor: '#f5f6f8' }}>
          
          {/* Print Letterhead */}
          <div className="print-only text-center mb-8 border-b-2 border-primary pb-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#d4a017] flex items-center justify-center mx-auto mb-3">
              <span className="text-[#d4a017] text-[10px] font-bold text-center leading-tight">GOV<br/>SEAL</span>
            </div>
            <h1 className="text-2xl font-bold text-primary uppercase tracking-widest mb-1">Government of India</h1>
            <h2 className="text-lg font-bold text-gray-800 uppercase mb-1">Ministry of Road Transport</h2>
            <p className="text-sm text-gray-600 font-bold">Statistical Analysis Report: Punjab Region</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Period: {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()} | Generated On: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Page Top Card */}
          <div className="gov-card flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div>
              <h1 className="text-[22px] font-bold text-primary mb-1">Statistical Analysis Report</h1>
              <p className="text-[14px] text-gray-500 font-medium">Traffic & Accident Management System — Punjab Region</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white border border-[#dde1e7] p-2 rounded shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider ml-1">From</span>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="text-primary font-bold text-[13px] px-2 py-1 rounded outline-none border border-border w-[90px] focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">To</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="text-primary font-bold text-[13px] px-2 py-1 rounded outline-none border border-border w-[90px] focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="h-6 w-px bg-border mx-1"></div>
              <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="gov-btn-primary h-8 px-4 text-[12px] whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Report'}
              </button>
              <button 
                onClick={() => window.print()}
                className="h-8 px-4 bg-accent hover:bg-accent-light text-white font-bold text-[12px] rounded whitespace-nowrap shadow-sm transition-colors"
              >
                Print Report
              </button>
            </div>
          </div>

          {loading ? renderSkeleton() : (
            <div className="flex flex-col gap-6 pb-8 print-container">
              
              {/* Summary Metric Strip */}
              <div className="bg-primary rounded-lg shadow-sm grid grid-cols-2 sm:flex sm:flex-row overflow-hidden border border-primary-light">
                <div className="p-4 sm:p-5 border-b sm:border-b-0 border-r border-[#d4a017] border-opacity-40 flex flex-col justify-center">
                  <p className="text-[#d4a017] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1">Total Incidents</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-[20px] sm:text-[26px] font-bold text-white leading-none">{data.summary.total_incidents || 0}</h2>
                    <span className="text-white opacity-70 text-[9px] sm:text-[11px] font-medium hidden sm:inline">Logged Records</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[#d4a017] border-opacity-40 flex flex-col justify-center">
                  <p className="text-[#d4a017] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1">Resolved</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-[20px] sm:text-[26px] font-bold text-white leading-none">{data.summary.resolved || 0}</h2>
                    <span className="text-white opacity-70 text-[9px] sm:text-[11px] font-medium hidden sm:inline">Successfully Closed</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5 border-r sm:border-b-0 border-[#d4a017] border-opacity-40 flex flex-col justify-center">
                  <p className="text-[#d4a017] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1">Active</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-[20px] sm:text-[26px] font-bold text-white leading-none">{data.summary.active || 0}</h2>
                    <span className="text-white opacity-70 text-[9px] sm:text-[11px] font-medium hidden sm:inline">Ongoing Cases</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col justify-center">
                  <p className="text-[#d4a017] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1">Critical</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-[20px] sm:text-[26px] font-bold text-white leading-none">{data.summary.critical_count || 0}</h2>
                    <span className="text-white opacity-70 text-[9px] sm:text-[11px] font-medium hidden sm:inline">High Priority</span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-container">
                
                {/* Trend Chart (Full Width) */}
                <div className="lg:col-span-2 gov-card relative overflow-hidden group !p-0">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                    <span className="text-gray-400 opacity-20 text-6xl font-black uppercase tracking-[1em] -rotate-12 whitespace-nowrap select-none">OFFICIAL USE ONLY</span>
                  </div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-primary px-5 py-3 border-b border-border shrink-0">
                      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Incident Trend — Last 30 Days</h3>
                    </div>
                    <div className="h-[300px] w-full bg-white/80 backdrop-blur-sm rounded-b p-5">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.byDate} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1d5fa6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f5f6f8" stopOpacity={0.8}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dde1e7" vertical={false} />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickMargin={10} tickFormatter={(val) => val.substring(5)} tickLine={false} axisLine={{ stroke: '#dde1e7' }} />
                          <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: '#dde1e7' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #dde1e7', borderRadius: '4px', color: '#1a3a5c', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                          <Area type="monotone" dataKey="count" stroke="#1d5fa6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#1d5fa6' }} animationDuration={1000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="gov-card relative overflow-hidden group !p-0">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                    <span className="text-gray-400 opacity-20 text-4xl font-black uppercase tracking-[0.5em] -rotate-12 whitespace-nowrap select-none">OFFICIAL USE ONLY</span>
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-primary px-5 py-3 border-b border-border shrink-0">
                      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Distribution by Type</h3>
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 bg-white/80 backdrop-blur-sm rounded-b p-5">
                      {data.byType.length > 0 ? (
                        <>
                          <div className="h-[250px] w-full sm:w-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={data.byType}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={65}
                                  outerRadius={95}
                                  paddingAngle={2}
                                  dataKey="value"
                                  animationDuration={1000}
                                  stroke="none"
                                >
                                  {data.byType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #dde1e7', borderRadius: '4px', color: '#1a3a5c', fontSize: '13px', fontWeight: 'bold' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="flex flex-col justify-center gap-3 min-w-[150px]">
                            {data.byType.map((entry, index) => (
                              <div key={index} className="flex items-center">
                                <div className="w-3 h-3 rounded-[2px] mr-3 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <div className="flex-1 flex justify-between gap-4 text-[12px] font-bold text-gray-700">
                                  <span className="capitalize">{entry.name.replace('_', ' ')}</span>
                                  <span className="text-primary">{entry.percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-500 text-sm font-medium">No type data for this period</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="gov-card relative overflow-hidden group !p-0">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                    <span className="text-gray-400 opacity-20 text-4xl font-black uppercase tracking-[0.5em] -rotate-12 whitespace-nowrap select-none">OFFICIAL USE ONLY</span>
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-primary px-5 py-3 border-b border-border shrink-0">
                      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Severity Analysis</h3>
                    </div>
                    <div className="flex-1 h-[250px] w-full bg-white/80 backdrop-blur-sm rounded-b p-5">
                      {data.bySeverity.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.bySeverity} margin={{ top: 20, right: 30, left: -20, bottom: 5 }} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#dde1e7" vertical={false} />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickMargin={10} tickLine={false} axisLine={{ stroke: '#dde1e7' }} />
                            <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: '#dde1e7' }} />
                            <Tooltip cursor={{ fill: '#f5f6f8' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #dde1e7', borderRadius: '4px', color: '#1a3a5c', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1000}>
                              {data.bySeverity.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#1a3a5c'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-500 text-sm font-medium">No severity data for this period</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hotspots Table */}
                <div className="lg:col-span-2 gov-card !p-0 overflow-hidden print-container" style={{ breakInside: 'avoid' }}>
                  <div className="bg-primary px-5 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Top 10 Incident Hotspots</h3>
                    <span className="text-[11px] text-white/70 uppercase tracking-widest font-bold">Location Analysis</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap hidden md:table">
                      <thead className="bg-[#f8f9fa] text-gray-600 uppercase text-[11px] font-bold tracking-wider border-b border-[#dde1e7]">
                        <tr>
                          <th className="px-5 py-3">Rank</th>
                          <th className="px-5 py-3">Location Name</th>
                          <th className="px-5 py-3 w-1/3">Incident Density</th>
                          <th className="px-5 py-3 text-right">Total Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dde1e7]">
                        {data.hotspots.map((hotspot, index) => {
                          const barWidth = `${(hotspot.count / maxHotspotCount) * 100}%`;
                          return (
                            <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-surface'} gov-table-row`}>
                              <td className="px-5 py-3">
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold ${index < 3 ? 'bg-[#d4a017] text-white' : 'bg-gray-200 text-gray-700'}`}>
                                  {index + 1}
                                </div>
                              </td>
                              <td className="px-5 py-3 text-primary font-bold">{hotspot.name || 'Unknown Location'}</td>
                              <td className="px-5 py-3">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden border border-gray-300">
                                  <div className="h-2.5 rounded-full" style={{ width: barWidth, backgroundColor: index < 3 ? '#b71c1c' : '#1d5fa6' }}></div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className="font-bold text-[14px] text-gray-900">{hotspot.count}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="md:hidden flex flex-col divide-y divide-[#dde1e7]">
                      {data.hotspots.map((hotspot, index) => {
                        const barWidth = `${(hotspot.count / maxHotspotCount) * 100}%`;
                        return (
                          <div key={index} className="p-4 bg-white flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold ${index < 3 ? 'bg-[#d4a017] text-white' : 'bg-gray-200 text-gray-700'}`}>{index + 1}</div>
                                <span className="text-primary font-bold text-[13px]">{hotspot.name || 'Unknown Location'}</span>
                              </div>
                              <span className="font-bold text-[15px] text-gray-900">{hotspot.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden border border-gray-300 mt-1">
                              <div className="h-2.5 rounded-full" style={{ width: barWidth, backgroundColor: index < 3 ? '#b71c1c' : '#1d5fa6' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {data.hotspots.length === 0 && (
                      <GovEmpty title="No Hotspot Data" subtitle="There is no hotspot data available for this period." />
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reportData={reportData} 
      />
    </div>
  );
};

export default AnalyticsDashboardPage;
