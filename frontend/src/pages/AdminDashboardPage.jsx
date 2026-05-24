import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import api from '../services/api';

const severityColors = {
  critical: '#b71c1c',
  high: '#e65100',
  medium: '#d4a017',
  low: '#2e7d32',
};

const statusConfig = [
  { key: 'reported', label: 'Reported', color: '#1a3a5c' },
  { key: 'active', label: 'Active', color: '#b71c1c' },
  { key: 'under_investigation', label: 'Under Investigation', color: '#d4a017' },
  { key: 'resolved', label: 'Resolved', color: '#2e7d32' },
  { key: 'closed', label: 'Closed', color: '#9ca3af' },
];

const timeAgo = (dateString) => {
  if (!dateString) return 'some time ago';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const KpiCard = ({ title, value, borderLeftColor, icon, trendText }) => (
  <div className={`bg-white border border-[#dde1e7] rounded-lg p-5 border-l-[4px] ${borderLeftColor} flex flex-col justify-between shadow-sm`}>
    <div className="flex justify-between items-start">
      <span className="text-[12px] text-gray-500 uppercase tracking-wider font-bold">{title}</span>
      <div className="shrink-0">{icon}</div>
    </div>
    <div className="text-[28px] font-bold text-primary mt-2 leading-none">{value}</div>
    <div className="text-[12px] text-gray-400 mt-2">{trendText}</div>
  </div>
);

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, incidentsRes, usersRes, statusRes, topUsersRes, activityRes] = await Promise.all([
        api.get('/admin/dashboard/summary'),
        api.get('/incidents'),
        api.get('/admin/users'),
        api.get('/admin/analytics/by-status'),
        api.get('/admin/users?sort=incidents_count&limit=5'),
        api.get('/admin/incidents?per_page=10&sort=latest')
      ]);

      setSummary(summaryRes.data?.data);
      setIncidents(incidentsRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
      setStatusData(statusRes.data?.data || []);
      setTopUsers(topUsersRes.data?.data || []);
      setRecentActivity(activityRes.data?.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Admin dashboard fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, 30000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, [fetchData]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      // Also update top users list status if the user is in there
      setTopUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  const getActionText = (item) => {
    const reporter = item.reporter_name || item.reporter?.name || item.user?.name || 'Public';
    const statusStr = item.status ? item.status.replace('_', ' ') : 'reported';
    const formattedStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
    return `reported by ${reporter} / status changed to ${formattedStatus}`;
  };

  const chartData = statusConfig.map(s => {
    const match = statusData.find(
      d => d.name?.toLowerCase() === s.key || d.name?.toLowerCase() === s.label.toLowerCase()
    );
    return {
      name: s.label,
      value: match ? match.value : 0,
      color: s.color
    };
  });

  // Calculate clearance rate
  const totalInc = summary?.total_incidents || 0;
  const resolvedInc = summary?.resolved_count || 0;
  const clearanceRate = totalInc ? Math.round((resolvedInc / totalInc) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden">
      <GovHeader />

      <div className="flex flex-1 overflow-hidden">
        <GovSidebar />

        <main id="main-content" className="flex-1 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="px-6 py-2 border-b-2 border-primary flex items-center justify-between bg-white shrink-0">
            <div className="text-[12px] text-gray-500 font-medium">
              <Link to="/admin/dashboard" className="hover:text-primary">Home</Link> &gt; <span className="text-gray-800">Admin Dashboard</span>
            </div>
            <div className="text-[13px] text-primary font-bold tracking-wide">
              {currentTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* KPI Cards Section */}
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-3">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                  title="Total Incidents"
                  value={loading ? '...' : summary?.total_incidents ?? 0}
                  borderLeftColor="border-l-[#1a3a5c]"
                  trendText="+8.2% vs last week"
                  icon={
                    <svg className="w-5 h-5 text-[#1a3a5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
                <KpiCard
                  title="Active Now"
                  value={loading ? '...' : summary?.active_count ?? 0}
                  borderLeftColor="border-l-[#b71c1c]"
                  trendText={`+${summary?.incidents_today ?? 0} new in last hour`}
                  icon={
                    <svg className="w-5 h-5 text-[#b71c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                />
                <KpiCard
                  title="Resolved Today"
                  value={loading ? '...' : summary?.resolved_count ?? 0}
                  borderLeftColor="border-l-[#2e7d32]"
                  trendText={`clearance rate ${clearanceRate}%`}
                  icon={
                    <svg className="w-5 h-5 text-[#2e7d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                />
                <KpiCard
                  title="Total Users"
                  value={loading ? '...' : summary?.total_users ?? 0}
                  borderLeftColor="border-l-[#d4a017]"
                  trendText="+5 new this week"
                  icon={
                    <svg className="w-5 h-5 text-[#d4a017]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
              </div>
              <div className="flex gap-6 mt-3 text-[11px] text-gray-500 px-1">
                <span>Avg Response: <strong className="text-primary">{summary?.avg_response_time != null ? `${summary.avg_response_time}h` : '—'}</strong></span>
                <span className="ml-auto italic">Updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* 2-Column Grid (Incident Status Breakdown & Recent Activity Feed) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Card: Incident Status Breakdown */}
              <div className="bg-white rounded-lg border border-[#dde1e7] shadow-sm overflow-hidden flex flex-col">
                <div className="bg-primary px-4 py-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Incident Status Breakdown</h3>
                </div>
                <div className="p-4 flex-1 flex items-center justify-center min-h-[280px]">
                  {loading ? (
                    <div className="text-gray-400 text-sm">Loading chart...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={140}
                          tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 'bold' }}
                        />
                        <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
                        <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <LabelList dataKey="value" position="right" style={{ fill: '#111827', fontSize: 12, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Right Card: Recent Activity Feed */}
              <div className="bg-white rounded-lg border border-[#dde1e7] shadow-sm overflow-hidden flex flex-col">
                <div className="bg-primary px-4 py-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Recent Activity</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="overflow-y-auto max-h-[280px] divide-y divide-gray-100 pr-1">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="py-3 flex items-start gap-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                          style={{ backgroundColor: severityColors[activity.severity] || '#9ca3af' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-primary truncate">{activity.title}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{getActionText(activity)}</p>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono shrink-0">
                          {timeAgo(activity.created_at)}
                        </span>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <div className="py-8 text-center text-gray-400 text-[13px]">No recent activity.</div>
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-3 mt-2 text-right">
                    <Link to="/incidents" className="text-xs text-primary font-bold hover:underline">
                      View All Activity →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Recent Incidents + Quick Actions + Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Incidents Table */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="bg-primary px-4 py-3 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Recent Incidents</h3>
                  <button onClick={() => navigate('/incidents')} className="text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-wider">View All →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Incident</th>
                        <th className="px-4 py-3">Reported By</th>
                        <th className="px-4 py-3">Severity</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incidents.slice(0, 6).map((inc, idx) => (
                        <tr key={inc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-surface'}>
                          <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">#{String(inc.id).substring(0, 6)}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-primary text-[13px]">{inc.title}</div>
                            <div className="text-gray-400 text-[11px] truncate max-w-[180px]">{inc.location?.name || '—'}</div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-gray-600 font-medium">
                            {inc.reporter_name || inc.user?.name || 'Public'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`gov-badge-${inc.severity}`}>{inc.severity}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 border border-gray-200 px-2 py-0.5 rounded">
                              {inc.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {incidents.length === 0 && (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-[13px]">No incidents found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Quick Actions + Users */}
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                  <div className="bg-primary px-4 py-3">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">Quick Actions</h3>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {[
                      { label: 'All Incidents', path: '/incidents', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                      { label: 'Manage Users', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                      { label: 'Reports', path: '/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                    ].map(({ label, path, icon }) => (
                      <button key={label} onClick={() => navigate(path)}
                        className="gov-btn-outline flex flex-col items-center justify-center gap-1.5 h-20 p-2 text-center text-[12px]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                        </svg>
                        <span className="font-bold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                  <div className="bg-primary px-4 py-3 flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">Recent Users</h3>
                    <button onClick={() => navigate('/users')} className="text-white/70 hover:text-white text-[11px] font-bold uppercase">View All →</button>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {users.slice(0, 5).map((u) => (
                      <li key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            u.role === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role?.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => toggleUserStatus(u.id, u.status)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                              u.status === 'active'
                                ? 'border-success text-success hover:bg-success hover:text-white'
                                : 'border-danger text-danger hover:bg-danger hover:text-white'
                            }`}
                          >
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </li>
                    ))}
                    {users.length === 0 && (
                      <li className="px-4 py-6 text-center text-gray-400 text-[13px]">No users found.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* USER REPORTS SUMMARY Card */}
            <div className="bg-white rounded-lg border border-[#dde1e7] shadow-sm overflow-hidden">
              <div className="bg-primary px-4 py-3">
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">User Reports Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Total Reports</th>
                      <th className="px-4 py-3">Last Report Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topUsers.map((u, index) => (
                      <tr key={u.id} className={index % 2 === 0 ? 'bg-white' : 'bg-surface'}>
                        <td className="px-4 py-3 font-bold text-[13px] text-gray-500">#{index + 1}</td>
                        <td className="px-4 py-3 font-bold text-primary text-[13px]">{u.name}</td>
                        <td className="px-4 py-3 text-[12px] text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 font-semibold text-[13px] text-gray-800">{u.incidents_count ?? 0}</td>
                        <td className="px-4 py-3 text-[11px] text-gray-400 font-mono">
                          {u.last_report_date ? new Date(u.last_report_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                    {topUsers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-[13px]">
                          No active users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
