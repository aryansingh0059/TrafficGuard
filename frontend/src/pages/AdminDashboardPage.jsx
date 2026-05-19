import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, Link } from 'react-router-dom';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import api from '../services/api';

const INDIA_CENTER = [20.5937, 78.9629];
const INDIA_ZOOM = 5;
const INDIA_BOUNDS = [[6.5, 68.0], [35.7, 97.5]];

const severityColors = {
  critical: '#b71c1c',
  high: '#e65100',
  medium: '#d4a017',
  low: '#2e7d32',
};

const MapController = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
};

const StatCard = ({ label, value, color = 'primary', icon }) => (
  <div className={`gov-card border-l-[4px] border-l-${color} flex flex-col justify-between`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-[12px] text-gray-500 uppercase font-bold tracking-wider">{label}</span>
      {icon}
    </div>
    <div className="text-[32px] font-black text-primary leading-none">{value ?? '—'}</div>
  </div>
);

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, incidentsRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard/summary'),
        api.get('/incidents'),          // shared auth route — all incidents for map
        api.get('/admin/users'),
      ]);
      setSummary(summaryRes.data?.data);
      setIncidents(incidentsRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
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
    return () => { clearInterval(dataInterval); clearInterval(timeInterval); };
  }, [fetchData]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

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

            {/* KPI Cards */}
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-3">System Overview</h2>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Total Incidents" value={loading ? '...' : summary?.total_incidents}
                  color="primary"
                  icon={<svg className="w-5 h-5 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
                <StatCard label="Active Now" value={loading ? '...' : summary?.active_count}
                  color="danger"
                  icon={<svg className="w-5 h-5 text-danger/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                />
                <StatCard label="Total Users" value={loading ? '...' : summary?.total_users}
                  color="success"
                  icon={<svg className="w-5 h-5 text-success/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <StatCard label="Critical Incidents" value={loading ? '...' : summary?.critical_count}
                  color="accent"
                  icon={<svg className="w-5 h-5 text-accent/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
              </div>
              <div className="flex gap-6 mt-3 text-[11px] text-gray-500">
                <span>Resolved Today: <strong className="text-success">{summary?.resolved_count ?? '—'}</strong></span>
                <span>Today's Reports: <strong className="text-primary">{summary?.incidents_today ?? '—'}</strong></span>
                <span>Avg Response: <strong className="text-primary">{summary?.avg_response_time != null ? `${summary.avg_response_time}h` : '—'}</strong></span>
                <span className="ml-auto italic">Updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Live Map */}
            <div className="bg-white rounded-lg border border-border overflow-hidden shadow-sm">
              <div className="bg-primary px-4 py-3 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">Live Incident Map — All India</h3>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-xs text-white font-bold tracking-wider uppercase">Live</span>
                </div>
              </div>
              <div className="relative h-[420px]">
                <MapContainer
                  center={INDIA_CENTER} zoom={INDIA_ZOOM}
                  minZoom={4} maxZoom={18}
                  maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0}
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <MapController mapRef={mapRef} />
                  {incidents.map((incident) => {
                    const lat = incident.location?.lat;
                    const lng = incident.location?.lng;
                    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) return null;
                    return (
                      <CircleMarker key={incident.id}
                        center={[parseFloat(lat), parseFloat(lng)]}
                        radius={8}
                        pathOptions={{
                          color: severityColors[incident.severity] || '#1a3a5c',
                          fillColor: severityColors[incident.severity] || '#1a3a5c',
                          fillOpacity: 0.75, weight: 2.5
                        }}
                      >
                        <Popup>
                          <div className="min-w-[180px] font-sans text-[13px]">
                            <div className="font-bold text-primary mb-1">{incident.title}</div>
                            <div className="text-gray-500 text-[11px]">{incident.location?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                              By: {incident.reported_by || incident.reporter_name || 'System'}
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {/* Legend */}
                <div className="absolute bottom-4 right-4 z-[400] bg-white p-2.5 rounded shadow-lg border border-border">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Severity</p>
                  {Object.entries({ critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: severityColors[k] }}></span>
                      {v}
                    </div>
                  ))}
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
                      { label: 'Analytics', path: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                      { label: 'Reports', path: '/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
