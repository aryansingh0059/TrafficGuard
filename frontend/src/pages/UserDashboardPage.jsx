import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { trackPublicIncident } from '../services/publicService';
import { useToast } from '../hooks/useToast';
import GovEmpty from '../components/GovEmpty';

const INDIA_CENTER = [20.5937, 78.9629];
const INDIA_ZOOM   = 5;
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

// Custom helper to grab map instance
const MapRefGrabber = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

// Map controller to set outer ref
const MapController = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => {
    if (map && mapRef) mapRef.current = map;
  }, [map, mapRef]);
  return null;
};

// Location click handler inside map
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Custom red indicator pin for forms
const redMarkerIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div style="width:24px;height:24px;background:#e53935;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;background:white;border-radius:50%"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom dashboard map marker
const dashboardMarkerIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div style="width:16px;height:16px;background:#1a3a5c;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ── Report Form Modal ──────────────────────────────────────────────
const ReportModal = ({ onClose, onSuccess, isOpen, prefilledIncident }) => {
  const toast = useToast();
  
  const [form, setForm] = useState({
    title: '', description: '', type: 'accident', severity: 'medium',
    location_name: '', latitude: '', longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMap, setModalMap] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (prefilledIncident) {
        setForm({
          title: prefilledIncident.title || '',
          description: prefilledIncident.description || '',
          type: prefilledIncident.type || 'accident',
          severity: prefilledIncident.severity || 'medium',
          location_name: prefilledIncident.location_name || '',
          latitude: prefilledIncident.latitude ? parseFloat(prefilledIncident.latitude).toFixed(6) : '',
          longitude: prefilledIncident.longitude ? parseFloat(prefilledIncident.longitude).toFixed(6) : '',
        });
      } else {
        setForm({
          title: '', description: '', type: 'accident', severity: 'medium',
          location_name: '', latitude: '', longitude: '',
        });
      }
    }
  }, [isOpen, prefilledIncident]);

  useEffect(() => {
    if (modalMap && form.latitude && form.longitude) {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        modalMap.setView([lat, lng], 12);
      }
    }
  }, [modalMap, form.latitude, form.longitude]);

  if (!isOpen) return null;

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=in&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (modalMap) {
          modalMap.flyTo([lat, lon], 12);
        }
        handleLocationSelect(lat, lon);
      } else {
        toast.warning('City Not Found', 'Could not locate city in India.');
      }
    } catch (err) {
      console.error("Nominatim search failed", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      setError('Please select a location on the map');
      return;
    }
    setLoading(true); 
    setError('');
    
    try {
      const res = await api.post('/user/incidents', form);
      const trackingId = res.data?.data?.tracking_id || 'incident';
      
      // Close modal and trigger callback
      onClose();
      onSuccess(trackingId);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-border rounded-xl shadow-2xl overflow-hidden my-8">
        
        {/* Header banner */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h3 className="text-[18px] font-bold uppercase tracking-wider">Report an Incident</h3>
            <p className="text-[11px] text-white/70 font-semibold uppercase tracking-widest mt-0.5">Official Incident Dispatch Center</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-danger/10 border-l-4 border-danger text-danger text-[13px] font-bold rounded-r" role="alert">
            {error}
          </div>
        )}

        {/* Modal Columns */}
        <div className="flex flex-col md:flex-row gap-6 p-6">
          
          {/* Left Column (45% Width) */}
          <div className="w-full md:w-[45%] space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="gov-form-label required">Title</label>
                <input 
                  name="title" 
                  value={form.title} 
                  onChange={handleChange} 
                  required 
                  className="gov-form-input" 
                  placeholder="Brief summary of the incident" 
                />
              </div>
              <div>
                <label className="gov-form-label">Description</label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  rows="3" 
                  className="gov-form-input !h-auto resize-none py-2" 
                  placeholder="Describe what happened..." 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-form-label">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="gov-form-input">
                    <option value="accident">Accident</option>
                    <option value="congestion">Congestion</option>
                    <option value="roadblock">Roadblock</option>
                    <option value="signal_failure">Signal Failure</option>
                    <option value="hazard">Hazard</option>
                  </select>
                </div>
                <div>
                  <label className="gov-form-label">Severity</label>
                  <select name="severity" value={form.severity} onChange={handleChange} className="gov-form-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="gov-form-label">Location Name</label>
                <input 
                  name="location_name" 
                  value={form.location_name} 
                  onChange={handleChange} 
                  className="gov-form-input" 
                  placeholder="Location (auto-filled or type here)" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-form-label">Latitude</label>
                  <input 
                    name="latitude" 
                    readOnly
                    value={form.latitude} 
                    className="gov-form-input font-mono !bg-[#f0f4ff] border-primary/20 text-primary cursor-default" 
                    placeholder="Auto Pin" 
                  />
                </div>
                <div>
                  <label className="gov-form-label">Longitude</label>
                  <input 
                    name="longitude" 
                    readOnly
                    value={form.longitude} 
                    className="gov-form-input font-mono !bg-[#f0f4ff] border-primary/20 text-primary cursor-default" 
                    placeholder="Auto Pin" 
                  />
                </div>
              </div>

              {/* Pin status message */}
              <div className="pt-1">
                {form.latitude && form.longitude ? (
                  <p className="text-[12px] text-green-600 font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ✓ Location selected
                  </p>
                ) : (
                  <p className="text-[12px] text-amber-600 font-bold flex items-center gap-1.5 animate-pulse">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    ⚠ Click the map to select location
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={onClose} className="flex-1 gov-btn-outline h-10 uppercase font-bold tracking-wider text-[11px]">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 gov-btn-primary h-10 flex items-center justify-center gap-2 uppercase font-bold tracking-wider text-[11px]">
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column (55% Width Map) */}
          <div className="w-full md:w-[55%] flex flex-col min-h-[300px]">
            
            {/* Nominatim Search box */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input 
                type="text"
                placeholder="Search city in India..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="gov-form-input flex-1"
              />
              <button type="submit" className="gov-btn-primary px-4 h-10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </form>

            <span className="text-[12px] font-bold text-primary uppercase tracking-wider mb-1">📍 Click anywhere on the map to set location</span>

            {/* Embedded map container */}
            <div className="flex-1 border border-border rounded-lg overflow-hidden h-[380px] shadow-inner relative z-0">
              <MapContainer
                center={INDIA_CENTER} zoom={4}
                minZoom={4} maxZoom={18}
                maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <MapRefGrabber onMapReady={setModalMap} />
                <LocationPicker onLocationSelect={handleLocationSelect} />

                {form.latitude && form.longitude && (
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
                )}
              </MapContainer>
            </div>

            {/* Coordinates indicator below map */}
            <p className="text-[12px] text-gray-500 mt-2 font-mono">
              {form.latitude && form.longitude ? (
                `Selected: ${parseFloat(form.latitude).toFixed(4)}° N, ${parseFloat(form.longitude).toFixed(4)}° E`
              ) : (
                "Selected: No location pinned"
              )}
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};

// ── Main User Dashboard ────────────────────────────────────────────
const UserDashboardPage = () => {
  const { logout } = useAuthStore();
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const toast = useToast();
  const mapRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track section
  const [trackingId, setTrackingId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  const [prefilledIncident, setPrefilledIncident] = useState(null);

  const handleReportSimilar = (inc) => {
    setPrefilledIncident(inc);
    setIsModalOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, incRes] = await Promise.all([
        api.get('/user/dashboard/summary'),
        api.get('/user/incidents'),
      ]);
      
      setSummary({
        total:    sumRes.data?.data?.total_reports,
        active:   sumRes.data?.data?.active_reports,
        resolved: sumRes.data?.data?.resolved_reports,
        last:     sumRes.data?.data?.last_report,
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
  }, [fetchData]);

  const handleModalSuccess = (newTrackingId) => {
    setIsModalOpen(false);
    
    // Instantly refetch both summary stats and list
    fetchData();
    
    // Display customGov Toast with tracking ID
    toast.success(
      'Incident Reported', 
      `Incident reported successfully! Your tracking ID: ${newTrackingId}`
    );
  };

  const handleLogout = () => { 
    logout(); 
    navigate('/login'); 
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    handleTrackById(trackingId.trim());
  };

  const handleTrackById = async (id) => {
    setTrackLoading(true); 
    setTrackError(''); 
    setTrackResult(null);
    try {
      const res = await trackPublicIncident(id);
      setTrackResult(res.data?.data);
      toast.success('Incident Tracked', 'Loaded latest progress logs.');
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Tracking ID not found. Please verify and try again.');
      toast.error('Search Failed', 'Could not locate any matching incident record.');
    } finally {
      setTrackLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info('Copied to Clipboard', 'Monospace Tracking ID successfully copied.');
  };

  return (
    <div className="min-h-screen bg-surface font-sans flex flex-col">

      {/* Simple Top Header (no sidebar) */}
      <header className="bg-primary text-white border-b-4 border-accent sticky top-0 z-50">
        <div className="h-[3px] w-full flex">
          <div className="flex-1 bg-[#FF9933]"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-[#138808]"></div>
        </div>
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L3 6v6.5c0 5.05 3.81 9.85 9 11.5 5.19-1.65 9-6.45 9-11.5V6l-9-4zm0 2.18l7 3.12v5.2c0 4.08-2.82 8.01-7 9.51-4.18-1.5-7-5.43-7-9.51V7.3l7-3.12z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[14px] font-bold uppercase tracking-wide leading-tight">Traffic &amp; Accident Management System</h1>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">Punjab Traffic Police — Citizen Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[13px] font-bold">{user?.name}</span>
              <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded font-black uppercase tracking-widest">Public User</span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-[12px] font-medium border border-white/20 rounded px-3 py-1.5 hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 px-4 md:px-8 py-8 max-w-6xl mx-auto w-full space-y-8">

        {/* Welcome + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-bold text-primary leading-tight">
              Welcome, {user?.name?.split(' ')[0] || 'Citizen'} 👋
            </h2>
            <p className="text-[14px] text-gray-500 font-medium">Track and manage your reported incidents across India.</p>
          </div>
          <button
            onClick={() => { setPrefilledIncident(null); setIsModalOpen(true); }}
            className="gov-btn-primary flex items-center gap-2 px-6 py-3 text-[14px] shadow-md shrink-0 font-bold uppercase tracking-wider"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Report New Incident
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Reports', value: summary?.total, color: 'bg-primary/5 border-primary/20 text-primary border-t-[4px] border-t-primary' },
            { label: 'Active Reports', value: summary?.active, color: 'bg-blue-50 border-blue-200 text-blue-800 border-t-[4px] border-t-blue-500' },
            { label: 'Resolved Cases', value: summary?.resolved, color: 'bg-green-50 border-green-200 text-green-800 border-t-[4px] border-t-green-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg border p-5 text-center bg-white shadow-sm flex flex-col justify-center min-h-[100px] ${color}`}>
              {loading ? (
                <div className="h-7 w-12 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
              ) : (
                <div className="text-[28px] font-black leading-none mb-1">{value ?? '—'}</div>
              )}
              <div className="text-[11px] font-black uppercase tracking-wider opacity-80 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* My Recent Reports Table */}
        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide">My Recent Reports</h3>
            {!loading && incidents.length > 0 && (
              <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                {incidents.length} Records
              </span>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-surface text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Reported Date</th>
                  <th className="px-5 py-3">Tracking ID</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-white">
                      <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                      <td className="px-5 py-4 text-right"><div className="h-6 bg-gray-200 rounded w-10 ml-auto"></div></td>
                    </tr>
                  ))
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-2">
                      <GovEmpty 
                        title="No Records Found" 
                        subtitle="No reports yet. Click 'Report New Incident' to get started." 
                      />
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc, idx) => (
                    <tr key={inc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-surface'}>
                      <td className="px-5 py-4">
                        <div className="font-bold text-primary text-[14px]">{inc.title}</div>
                        <div className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">{inc.location_name}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-black uppercase bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full tracking-wider">
                          {inc.type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`gov-badge-${inc.severity}`}>{inc.severity}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColors[inc.status] || 'bg-gray-100 text-gray-700'}`}>
                          {inc.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 font-mono text-[11px]">
                        {inc.created_at ? new Date(inc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11.5px] text-gray-500 flex items-center gap-1.5 pt-[18px]">
                        <span>{inc.tracking_id ? inc.tracking_id.substring(0, 13) + '...' : '—'}</span>
                        {inc.tracking_id && (
                          <button 
                            onClick={() => copyToClipboard(inc.tracking_id)}
                            className="text-primary/40 hover:text-primary transition-colors"
                            title="Copy Tracking ID"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setTrackingId(inc.tracking_id);
                              handleTrackById(inc.tracking_id);
                            }}
                            className="text-[11px] text-primary font-bold hover:underline bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2.5 py-1 rounded transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleReportSimilar(inc)}
                            className="text-[11px] text-accent font-bold hover:underline bg-accent/5 hover:bg-accent/10 border border-accent/20 px-2.5 py-1 rounded transition-colors"
                          >
                            Report Similar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card-list */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : incidents.length === 0 ? (
              <div className="px-4 py-8">
                <GovEmpty 
                  title="No Records Found" 
                  subtitle="No reports yet. Click 'Report New Incident' to get started." 
                />
              </div>
            ) : (
              incidents.slice(0, 5).map(inc => (
                <div key={inc.id} className="px-4 py-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-primary text-[14px]">{inc.title}</p>
                    <span className={`gov-badge-${inc.severity} shrink-0`}>{inc.severity}</span>
                  </div>
                  <p className="text-[11.5px] text-gray-500">{inc.location_name || '—'}</p>
                  <div className="flex justify-between items-center pt-1">
                    <div className="flex gap-2 text-[10px] text-gray-500 flex-wrap">
                      <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{inc.type?.replace('_', ' ')}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${statusColors[inc.status] || ''}`}>{inc.status?.replace('_', ' ')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setTrackingId(inc.tracking_id);
                        handleTrackById(inc.tracking_id);
                      }}
                      className="text-[11px] text-primary font-bold hover:underline"
                    >
                      Track Details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map + Track section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Map */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-4 py-3 flex justify-between items-center">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">Report Location Map</h3>
              <div className="flex items-center gap-1.5 text-[10.5px] text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/25 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Logged markers
              </div>
            </div>
            <div className="relative h-[320px] z-0">
              <MapContainer
                center={INDIA_CENTER} zoom={INDIA_ZOOM}
                minZoom={4} maxZoom={18}
                maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <MapController mapRef={mapRef} />

                {incidents.map(inc => {
                  const lat = inc.latitude;
                  const lng = inc.longitude;
                  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) return null;
                  return (
                    <CircleMarker 
                      key={inc.id} 
                      center={[parseFloat(lat), parseFloat(lng)]} 
                      radius={8}
                      pathOptions={{ 
                        color: severityColors[inc.severity] || '#1a3a5c', 
                        fillColor: severityColors[inc.severity] || '#1a3a5c', 
                        fillOpacity: 0.75, 
                        weight: 2 
                      }}
                    >
                      <Popup>
                        <div className="min-w-[160px] font-sans text-[13px] space-y-2">
                          <div>
                            <div className="font-bold text-primary">{inc.title}</div>
                            <div className="text-gray-500 text-[11px]">{inc.location_name || 'India'}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">Status: {inc.status?.replace('_', ' ')}</div>
                          </div>
                          <button
                            onClick={() => handleReportSimilar(inc)}
                            className="w-full py-1.5 bg-primary text-white text-[11px] font-bold rounded uppercase tracking-wider hover:bg-primary/90 transition-all text-center block"
                          >
                            Report Similar
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Track Report */}
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="bg-primary px-4 py-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">Track Your Report</h3>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <p className="text-[12px] text-gray-500 mb-4 font-medium">Enter your Tracking ID to check real-time status of any submitted report.</p>

              <form onSubmit={handleTrack} className="space-y-3">
                <div>
                  <label className="gov-form-label">Tracking ID</label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="gov-form-input font-mono text-[13px]"
                    placeholder="Paste your UUID tracking ID"
                  />
                </div>
                <button type="submit" disabled={trackLoading || !trackingId.trim()} className="gov-btn-primary w-full h-10 flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-wider">
                  {trackLoading ? 'Searching...' : 'Track Status'}
                </button>
              </form>

              {trackError && (
                <div className="mt-4 text-[12px] text-danger font-bold p-3 bg-danger/10 border-l-4 border-danger rounded-r" role="alert">
                  {trackError}
                </div>
              )}

              {trackResult && (
                <div className="mt-4 p-4 bg-surface border border-border rounded-lg space-y-2">
                  <h4 className="font-bold text-primary text-[14px] mb-1">{trackResult.title}</h4>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${statusColors[trackResult.status] || 'bg-gray-100 text-gray-700'}`}>
                      {trackResult.status?.replace('_', ' ')}
                    </span>
                    <span className={`gov-badge-${trackResult.severity}`}>{trackResult.severity}</span>
                  </div>
                  <p className="text-[11.5px] text-gray-600 font-medium">{trackResult.location_name || '—'}</p>
                  <p className="text-[10.5px] text-gray-400 font-mono mt-1">
                    Reported: {trackResult.created_at ? new Date(trackResult.created_at).toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-4 text-center">
                <a href="/track" className="text-[12px] text-primary font-bold hover:underline">
                  Full tracking page →
                </a>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-4 text-center">
        <p className="text-[12px] text-gray-500">For support contact: <a href="mailto:support@traffic.gov.in" className="text-primary font-bold hover:underline">support@traffic.gov.in</a></p>
        <p className="text-[11px] text-gray-400 mt-1">© 2025 Government of India. Traffic &amp; Accident Management System.</p>
      </footer>

      {/* Report Modal */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); }}
        onSuccess={handleModalSuccess}
        prefilledIncident={prefilledIncident}
      />

    </div>
  );
};

export default UserDashboardPage;
