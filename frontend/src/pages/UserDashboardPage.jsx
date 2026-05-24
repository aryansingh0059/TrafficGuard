import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { trackPublicIncident } from '../services/publicService';
import { useToast } from '../hooks/useToast';
import GovHeader from '../components/GovHeader';
import IncidentSlideOver from '../components/IncidentSlideOver';

const INDIA_CENTER = [20.5937, 78.9629];
const INDIA_ZOOM = 5;
const INDIA_BOUNDS = [[6.5, 68.0], [35.7, 97.5]];

const severityColors = {
  critical: '#b71c1c',
  high: '#e65100',
  medium: '#d4a017',
  low: '#2e7d32'
};

const statusColors = {
  reported: 'bg-gray-100 text-gray-700 border border-gray-200',
  active: 'bg-blue-100 text-blue-800 border border-blue-200',
  under_investigation: 'bg-amber-100 text-amber-800 border border-amber-200',
  resolved: 'bg-green-100 text-green-800 border border-green-200',
  closed: 'bg-gray-200 text-gray-600 border border-gray-300',
};

const MapRefGrabber = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

const MapController = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => {
    if (map && mapRef) mapRef.current = map;
  }, [map, mapRef]);
  return null;
};

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const redMarkerIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div style="width:24px;height:24px;background:#e53935;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;background:white;border-radius:50%"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const UserDashboardPage = () => {
  const { logout } = useAuthStore();
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const toast = useToast();
  const mapRef = useRef(null);
  const reportFormRef = useRef(null);

  // Stats / Dashboard data
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    title: '', description: '', type: 'accident', severity: 'medium',
    location_name: '', latitude: '', longitude: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [miniMap, setMiniMap] = useState(null);


  // Slide-over state for details
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Map refresh / Time state
  const [lastMapUpdated, setLastMapUpdated] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, incRes] = await Promise.all([
        api.get('/user/dashboard/summary'),
        api.get('/user/incidents'),
      ]);

      setSummary({
        total: sumRes.data?.data?.total_reports,
        active: sumRes.data?.data?.active_reports,
        resolved: sumRes.data?.data?.resolved_reports,
        last: sumRes.data?.data?.last_report,
      });

      setIncidents(incRes.data?.data?.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toast.error('Data Fetch Failed', 'Unable to retrieve your dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate, toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Live Map last updated timestamp
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastMapUpdated(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Set form coordinates map location
  useEffect(() => {
    if (miniMap && form.latitude && form.longitude) {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        miniMap.setView([lat, lng], 12);
      }
    }
  }, [miniMap, form.latitude, form.longitude]);

  const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLocationSelect = (lat, lng) => {
    setForm(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));

    // Reverse Geocoding via Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => {
        const place = data.address?.city
          || data.address?.town
          || data.address?.village
          || data.address?.suburb
          || data.address?.road
          || '';
        const state = data.address?.state || '';
        const name = place ? `${place}, ${state}` : state || 'Unknown Location';
        setForm(prev => ({ ...prev, location_name: name }));
      })
      .catch(err => console.error("Geocoding failed", err));
  };

  const handleMiniMapSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=in&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (miniMap) {
          miniMap.flyTo([lat, lon], 12);
        }
        handleLocationSelect(lat, lon);
      } else {
        toast.warning('City Not Found', 'Could not locate city in India.');
      }
    } catch (err) {
      console.error("Nominatim search failed", err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.warning('Location Required', 'Please select a location on the mini map.');
      return;
    }
    setFormLoading(true);
    try {
      const res = await api.post('/user/incidents', form);
      const newTrackingId = res.data?.data?.tracking_id || 'incident';
      toast.success(
        'Incident Reported',
        `Incident reported successfully! Your tracking ID: ${newTrackingId}`
      );
      // Reset form
      setForm({
        title: '', description: '', type: 'accident', severity: 'medium',
        location_name: '', latitude: '', longitude: '',
      });
      setSearchQuery('');
      fetchData();
    } catch (err) {
      toast.error('Submission Failed', err.response?.data?.message || 'Unable to submit report.');
    } finally {
      setFormLoading(false);
    }
  };


  const handleOpenDetails = async (inc) => {
    try {
      const res = await api.get(`/incidents/${inc.id}`);
      setSelectedIncident(res.data?.data || inc);
      setIsSlideOverOpen(true);
    } catch (err) {
      console.error('Failed to fetch incident details', err);
      setSelectedIncident(inc);
      setIsSlideOverOpen(true);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info('Copied to Clipboard', 'Tracking ID successfully copied.');
  };


  const todayDateString = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <GovHeader />

      {/* Main Grid Layout */}
      <main id="main-content" className="flex-1 px-4 md:px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ────────────────────────────────────────────────────────
              LEFT SIDEBAR: Quick Track & Security Center
          ──────────────────────────────────────────────────────── */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-6">


            {/* 2. Security & Verification Center */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <h4 className="font-bold text-[13px] text-primary uppercase tracking-wide">Security Portal</h4>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">SSL Encrypted Verified</p>
                </div>
              </div>
              <div className="text-[12px] text-gray-500 leading-relaxed space-y-2">
                <p>
                  <strong>All reports are encrypted:</strong> Incident data submitted through this citizen portal is secured and directly uploaded to the Punjab Traffic Police Central Command Center.
                </p>
                <div className="p-2.5 bg-[#f0f9ff] border border-[#e0f2fe] rounded-lg flex items-center gap-2 text-[#0369a1] font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping shrink-0" />
                  Direct Regional Encrypted Channel
                </div>
              </div>
            </div>

            {/* 3. Emergency Contacts Card */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-3.5">
              <h4 className="font-bold text-[12px] text-primary uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <span>🚨</span> Citizens Emergency
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center bg-red-50/50 p-2 rounded-lg border border-red-100">
                  <span className="text-[12px] font-bold text-red-700 uppercase tracking-wide">Police Emergency</span>
                  <a href="tel:112" className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-full shadow-sm transition-colors">112</a>
                </div>
                <div className="flex justify-between items-center bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                  <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wide">Traffic Control</span>
                  <a href="tel:103" className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-full shadow-sm transition-colors">103</a>
                </div>
                <div className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                  <span className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide">Medical Chime</span>
                  <a href="tel:108" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-full shadow-sm transition-colors">108</a>
                </div>
              </div>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────────
              RIGHT CONTENT PANEL: Stats, Maps, Tables, Forms
          ──────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6 w-full">

            {/* A. Dynamic Banner and Statistics */}
            <div className="bg-gradient-to-br from-[#0c2440] via-[#103056] to-[#1a3a5c] text-white rounded-xl shadow-md border border-white/10 p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">

              {/* Radial gradient background accent for glowing depth */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />

              <div>
                <h2 className="text-[24px] font-black tracking-tight leading-tight">
                  Welcome back, {user?.name || 'Citizen'} 👋
                </h2>
                <p className="text-[13px] text-white/70 font-semibold tracking-wide mt-1">Punjab Traffic Police — Citizen Secure Portal</p>
                <div className="flex items-center gap-1.5 mt-2 bg-white/10 w-fit px-2.5 py-1 rounded-full border border-white/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">{todayDateString}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  reportFormRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-accent hover:bg-[#c29112] text-primary border border-transparent px-5 py-3 rounded-lg font-black uppercase tracking-wider text-[12.5px] transition-all shadow-md hover:shadow-lg shrink-0 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Report New Incident
              </button>
            </div>

            {/* B. KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Card 1 */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 border-l-[4px] border-l-primary flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="text-[28px] font-bold text-primary leading-none">
                    {loading ? '...' : summary?.total ?? 0}
                  </div>
                  <div className="text-[11.5px] text-gray-500 font-bold uppercase tracking-wider mt-2">My Total Reports</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 font-medium">Logged in database</div>
                </div>
                <div className="p-3 bg-primary/5 rounded-full text-primary shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 border-l-[4px] border-l-danger flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="text-[28px] font-bold text-danger leading-none">
                    {loading ? '...' : summary?.active ?? 0}
                  </div>
                  <div className="text-[11.5px] text-gray-500 font-bold uppercase tracking-wider mt-2">Active Reports</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 font-medium">Under investigation</div>
                </div>
                <div className="p-3 bg-danger/5 rounded-full text-danger shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 border-l-[4px] border-l-success flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="text-[28px] font-bold text-success leading-none">
                    {loading ? '...' : summary?.resolved ?? 0}
                  </div>
                  <div className="text-[11.5px] text-gray-500 font-bold uppercase tracking-wider mt-2">Resolved Reports</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 font-medium">Resolved & Closed</div>
                </div>
                <div className="p-3 bg-success/5 rounded-full text-success shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

            </div>

            {/* C. Interactive Location Map */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-primary px-4 py-3 flex justify-between items-center text-white border-b border-gray-100">
                <h3 className="font-bold text-xs uppercase tracking-wider">Reports Geo-Tracking Map</h3>
                <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-white font-bold tracking-wider uppercase">Live</span>
                </div>
              </div>
              <div className="relative h-[400px]">
                <MapContainer
                  center={INDIA_CENTER} zoom={INDIA_ZOOM}
                  minZoom={4} maxZoom={18}
                  maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <MapController mapRef={mapRef} />

                  {incidents.map(inc => {
                    const lat = inc.latitude ?? inc.location?.lat;
                    const lng = inc.longitude ?? inc.location?.lng;
                    const locName = inc.location_name ?? inc.location?.name ?? 'India';
                    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) return null;
                    return (
                      <CircleMarker
                        key={inc.id}
                        center={[parseFloat(lat), parseFloat(lng)]}
                        radius={9}
                        pathOptions={{
                          color: '#ffffff',
                          fillColor: severityColors[inc.severity] || '#1a3a5c',
                          fillOpacity: 0.9,
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className="min-w-[200px] font-sans text-[13px] space-y-2 p-1">
                            <div className="font-bold text-primary text-[14px] leading-tight">{inc.title}</div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[9px] font-black uppercase bg-gray-100 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full tracking-wider">
                                {inc.type?.replace('_', ' ')}
                              </span>
                              <span className={`gov-badge-${inc.severity} !text-[9px] !px-1.5`}>
                                {inc.severity}
                              </span>
                            </div>
                            <div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${statusColors[inc.status] || 'bg-gray-100 text-gray-700'}`}>
                                {inc.status?.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-gray-500 text-[11px] font-medium leading-tight">
                              📍 {locName}
                            </div>
                            <div className="text-gray-400 text-[11px]">
                              Reported: {inc.created_at ? new Date(inc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 select-all">
                              ID: {inc.tracking_id ? inc.tracking_id.substring(0, 13) + '...' : '—'}
                            </div>
                            <button
                              onClick={() => handleOpenDetails(inc)}
                              className="w-full py-1.5 bg-[#1a3a5c] text-white text-[11px] font-bold rounded uppercase tracking-wider hover:bg-[#0f2238] transition-all text-center block"
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {/* Empty Map Overlay */}
                {incidents.filter(inc => {
                  const lat = inc.latitude ?? inc.location?.lat;
                  const lng = inc.longitude ?? inc.location?.lng;
                  return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
                }).length === 0 && (
                    <div className="absolute inset-0 bg-[#0a1628]/45 backdrop-blur-[2px] z-[400] flex items-center justify-center p-6 text-center">
                      <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm border border-gray-200">
                        <svg className="w-12 h-12 text-[#1a3a5c] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h4 className="font-bold text-[#1a3a5c] mb-1">No Incident Locations</h4>
                        <p className="text-gray-500 text-[11.5px] font-medium leading-relaxed">You haven't pinned any reports on coordinates yet. Select location map markers during report filing.</p>
                      </div>
                    </div>
                  )}

                {/* Severity Legend */}
                <div className="absolute bottom-4 right-4 z-[400] bg-white p-2.5 rounded-lg shadow-md border border-gray-200/80">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Severity</p>
                  {Object.entries({ critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: severityColors[k] }}></span>
                      {v}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#f8fafc] px-4 py-2.5 border-t border-gray-200/80 flex justify-end text-[11px] text-gray-500 font-medium italic">
                Map auto-refreshes every 30s. Last updated: {lastMapUpdated}
              </div>
            </div>

            {/* D. Recent Reports Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="bg-primary px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">My Recent Reports</h3>
                <Link to="/user/incidents" className="text-white/80 hover:text-white hover:underline text-[11px] font-bold uppercase tracking-wider transition-colors">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] whitespace-nowrap">
                  <thead className="bg-[#1a3a5c] text-white uppercase text-[11.5px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Incident</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Severity</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Reported</th>
                      <th className="px-5 py-3">Tracking ID</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse bg-white">
                          <td className="px-5 py-4" colSpan="8"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                        </tr>
                      ))
                    ) : incidents.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-5 py-8 text-center bg-white">
                          <div className="flex flex-col items-center justify-center space-y-4 py-6">
                            <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="text-gray-500 font-bold text-[16px]">You haven't reported any incidents yet</div>
                            <div className="text-gray-400 text-[13px]">Be the first to help — report a traffic incident in your area</div>
                            <button
                              onClick={() => reportFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
                              className="gov-btn-primary px-6 py-3 font-bold uppercase tracking-wider"
                            >
                              + Report New Incident
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      incidents.slice(0, 5).map((inc, idx) => {
                        const typeColors = {
                          accident: 'bg-blue-100 text-blue-800 border border-blue-200',
                          congestion: 'bg-amber-100 text-amber-800 border border-amber-200',
                          roadblock: 'bg-red-100 text-red-800 border border-red-200',
                          signal_failure: 'bg-purple-100 text-purple-800 border border-purple-200',
                          hazard: 'bg-orange-100 text-orange-800 border border-orange-200',
                        };
                        const typeClass = typeColors[inc.type] || 'bg-gray-100 text-gray-700 border border-gray-200';

                        const statusClassMap = {
                          reported: 'border border-[#1a3a5c] text-[#1a3a5c] bg-transparent',
                          active: 'bg-blue-600 text-white',
                          under_investigation: 'bg-[#d4a017] text-white',
                          resolved: 'bg-success text-white',
                          closed: 'bg-gray-500 text-white',
                        };
                        const statusPillClass = statusClassMap[inc.status] || 'bg-gray-100 text-gray-700 border border-gray-200';

                        const formattedDate = inc.created_at
                          ? new Date(inc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
                          ', ' +
                          new Date(inc.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                          : '—';

                        return (
                          <tr key={inc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]/60 hover:bg-primary/5 transition-colors'}>
                            <td className="px-5 py-4 font-bold text-gray-400">{idx + 1}</td>
                            <td className="px-5 py-4">
                              <div className="font-bold text-[#1a3a5c] text-[14px]">{inc.title}</div>
                              <div className="text-[12px] text-gray-400 font-medium truncate max-w-[200px]">
                                {inc.location_name ?? inc.location?.name ?? '—'}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${typeClass}`}>
                                {inc.type?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`gov-badge-${inc.severity}`}>{inc.severity}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${statusPillClass}`}>
                                {inc.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-500 font-medium">
                              {formattedDate}
                            </td>
                            <td className="px-5 py-4 font-mono text-[11.5px] text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <span>{inc.tracking_id?.substring(0, 15)}...</span>
                                <button
                                  onClick={() => copyToClipboard(inc.tracking_id)}
                                  className="text-primary/40 hover:text-primary transition-colors p-1 hover:bg-gray-100 rounded"
                                  title="Copy Tracking ID"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleOpenDetails(inc)}
                                className="text-primary hover:text-primary-light p-1.5 hover:bg-primary/5 rounded transition-all"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {!loading && incidents.length > 0 && (
                <div className="bg-white px-5 py-3 border-t border-gray-100 text-center">
                  <Link to="/user/incidents" className="text-xs text-primary font-bold hover:underline">
                    View all my reports →
                  </Link>
                </div>
              )}
            </div>

            {/* E. Quick Report Form */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col" ref={reportFormRef}>
              <div className="bg-primary px-4 py-3.5 border-b border-gray-100">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">File Traffic or Accident Incident Report</h3>
              </div>
              <div className="p-5">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="gov-form-label required">Incident Title</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      required
                      className="gov-form-input"
                      placeholder="Brief title of incident (e.g. Signal failure at Main Crossing)"
                    />
                  </div>

                  <div>
                    <label className="gov-form-label required">Detailed Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      required
                      rows="3"
                      className="gov-form-input !h-auto resize-none py-2"
                      placeholder="Provide maximum possible details about traffic roadblock, accidents, or weather hazards..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="gov-form-label font-bold">Incident Type</label>
                      <select name="type" value={form.type} onChange={handleFormChange} className="gov-form-input">
                        <option value="accident">Accident</option>
                        <option value="congestion">Traffic Congestion</option>
                        <option value="roadblock">Roadblock / Construction</option>
                        <option value="signal_failure">Signal Failure</option>
                        <option value="hazard">Road Hazard</option>
                      </select>
                    </div>
                    <div>
                      <label className="gov-form-label font-bold">Severity Level</label>
                      <select name="severity" value={form.severity} onChange={handleFormChange} className="gov-form-input">
                        <option value="low">Low (Minor Delay)</option>
                        <option value="medium">Medium (Moderate Delay)</option>
                        <option value="high">High (Major Congestion)</option>
                        <option value="critical">Critical (Road Closure)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="gov-form-label font-bold">Location Name</label>
                    <input
                      name="location_name"
                      value={form.location_name}
                      onChange={handleFormChange}
                      className="gov-form-input"
                      placeholder="Area or city (auto-filled on pinning below)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="gov-form-label font-bold">Latitude Coordinate</label>
                      <input
                        name="latitude"
                        readOnly
                        value={form.latitude}
                        className="gov-form-input font-mono !bg-[#f0f9ff] border-sky-200 text-sky-800 cursor-default"
                        placeholder="Click mini map to pin"
                      />
                    </div>
                    <div>
                      <label className="gov-form-label font-bold">Longitude Coordinate</label>
                      <input
                        name="longitude"
                        readOnly
                        value={form.longitude}
                        className="gov-form-input font-mono !bg-[#f0f9ff] border-sky-200 text-sky-800 cursor-default"
                        placeholder="Click mini map to pin"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <label className="gov-form-label font-bold">Pin Location on Mini Map</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search city, intersection, or region..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="gov-form-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleMiniMapSearch}
                        className="gov-btn-primary px-4 h-10 flex items-center justify-center shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden h-[240px] shadow-inner relative z-0">
                      <MapContainer
                        center={INDIA_CENTER} zoom={4}
                        minZoom={4} maxZoom={18}
                        maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapRefGrabber onMapReady={setMiniMap} />
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                        {form.latitude && form.longitude ? (
                          <Marker
                            position={[parseFloat(form.latitude), parseFloat(form.longitude)]}
                            icon={redMarkerIcon}
                            draggable={true}
                            eventHandlers={{
                              dragend(e) {
                                const marker = e.target;
                                if (marker != null) {
                                  const latLng = marker.getLatLng();
                                  handleLocationSelect(latLng.lat, latLng.lng);
                                }
                              }
                            }}
                          />
                        ) : null}
                      </MapContainer>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="gov-btn-primary w-full h-11 flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-wider mt-4 hover:shadow-md"
                  >
                    {formLoading ? 'Submitting Report...' : 'Submit Official Report'}
                  </button>

                  <p className="text-[10px] text-gray-400 font-semibold text-center italic mt-2">
                    🛡️ Falsifying records or filing mock reports is subject to legal prosecution.
                  </p>
                </form>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white border-t-4 border-accent mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px]">
          <div>
            © 2026 Traffic &amp; Accident Management System | Government of India
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <span className="text-white/20">|</span>
            <a href="#" className="hover:text-accent transition-colors">Terms of Use</a>
            <span className="text-white/20">|</span>
            <a href="#" className="hover:text-accent transition-colors">Contact Us</a>
          </div>
          <div>
            Version 2.0.0
          </div>
        </div>
      </footer>

      {/* Incident Slide-over Detail Panel */}
      <IncidentSlideOver
        incident={selectedIncident}
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        onUpdateAdded={fetchData}
      />
    </div>
  );
};

export default UserDashboardPage;
