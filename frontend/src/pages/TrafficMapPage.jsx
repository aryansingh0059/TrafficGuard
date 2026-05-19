import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getActiveIncidents, getCongestionPredictions } from '../services/incidentService';
import { divIcon } from 'leaflet';
import ReportIncidentModal from '../components/ReportIncidentModal';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import { useNavigate, Link } from 'react-router-dom';

const INDIA_CENTER = [20.5937, 78.9629];
const INDIA_ZOOM = 5;
const INDIA_BOUNDS = [[6.5, 68.0], [35.7, 97.5]];

// Exposes map instance to parent via ref
const MapController = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
};

const clickedMarkerIcon = divIcon({
  className: 'bg-transparent',
  html: `<div style="width:24px;height:24px;background:#1a3a5c;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const severityColors = {
  critical: '#b71c1c', // danger
  high: '#e65100',     // warning
  medium: '#d4a017',   // accent
  low: '#2e7d32',      // success
};

const warningIcon = divIcon({
  className: 'pulse-warning-zone',
  iconSize: [40, 40]
});

const TrafficMapPage = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const mapRef = useRef(null);

  const fetchIncidents = useCallback(async () => {
    try {
      // No location filter — fetch ALL active incidents across India
      const [incRes, predRes] = await Promise.all([
        getActiveIncidents(),
        getCongestionPredictions()
      ]);
      setIncidents(incRes?.data?.data || []);
      setPredictions(predRes?.data?.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch map data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFlyToIndia = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 1.5 });
    }
  };

  useEffect(() => {
    fetchIncidents();
    const mapInterval = setInterval(fetchIncidents, 30000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(mapInterval);
      clearInterval(timeInterval);
    };
  }, [fetchIncidents]);

  const handleMapClick = (latlng) => {
    if (isModalOpen) setClickedLocation(latlng);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setClickedLocation(null);
    fetchIncidents();
  };

  const totalIncidents = incidents?.length || 0;
  const activeIncidents = (incidents || []).filter(i => i.status === 'active').length;
  const resolvedToday = (incidents || []).filter(i => {
    if (!i.status || i.status !== 'resolved' || !i.created_at) return false;
    const d = new Date(i.created_at);
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
  }).length;
  // Mock avg response
  const avgResponse = "4m 12s"; 

  const criticalIncidents = (incidents || []).filter(i => i.severity === 'critical');

  return (
    <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden">
      <GovHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <GovSidebar />

        <main id="main-content" className="flex-1 flex flex-col overflow-y-auto relative">
          
          {/* Breadcrumb Bar */}
          <div className="px-6 py-2 border-b-2 border-primary flex items-center justify-between bg-white shrink-0">
            <div className="text-[12px] text-gray-500 font-medium">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link> &gt; <span className="text-gray-800">Dashboard</span>
            </div>
            <div className="text-[13px] text-primary font-bold tracking-wide">
              {currentTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}
            </div>
          </div>

          {/* Alert Ticker */}
          {criticalIncidents.length > 0 && (
            <div className="w-full bg-primary text-white py-1.5 overflow-hidden flex items-center shrink-0">
              <div className="px-4 text-xs font-bold uppercase tracking-wider border-r border-white/20 shrink-0 z-10 bg-primary">
                Critical Alerts
              </div>
              <div className="flex-1 overflow-hidden relative group">
                <div className="whitespace-nowrap animate-[ticker_20s_linear_infinite] group-hover:[animation-play-state:paused] flex items-center">
                  {criticalIncidents.map((inc, i) => (
                    <span key={inc.id} className="mx-8 flex items-center gap-2 text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                      {inc.title} - {inc.location?.name || 'Unknown location'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-6 space-y-6">
            
            {/* KPI Row */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="gov-card border-l-[4px] border-l-primary flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] text-gray-500 uppercase font-bold tracking-wider">Total Incidents</span>
                    <svg className="w-5 h-5 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <div className="text-[28px] text-primary font-black leading-none">{totalIncidents}</div>
                    <div className="flex items-center gap-1 mt-2 text-success text-xs font-bold">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      12% from last week
                    </div>
                  </div>
                </div>

                <div className="gov-card border-l-[4px] border-l-danger flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] text-gray-500 uppercase font-bold tracking-wider">Active Now</span>
                    <svg className="w-5 h-5 text-danger/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <div className="text-[28px] text-primary font-black leading-none">{activeIncidents}</div>
                    <div className="flex items-center gap-1 mt-2 text-danger text-xs font-bold">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      4 new in last hour
                    </div>
                  </div>
                </div>

                <div className="gov-card border-l-[4px] border-l-success flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] text-gray-500 uppercase font-bold tracking-wider">Resolved Today</span>
                    <svg className="w-5 h-5 text-success/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <div className="text-[28px] text-primary font-black leading-none">{resolvedToday}</div>
                    <div className="flex items-center gap-1 mt-2 text-success text-xs font-bold">
                      <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      Clearance rate up
                    </div>
                  </div>
                </div>

                <div className="gov-card border-l-[4px] border-l-accent flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] text-gray-500 uppercase font-bold tracking-wider">Avg Response</span>
                    <svg className="w-5 h-5 text-accent/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <div className="text-[28px] text-primary font-black leading-none">{avgResponse}</div>
                    <div className="flex items-center gap-1 mt-2 text-success text-xs font-bold">
                      <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      Improved by 30s
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-gray-500 italic mt-2 text-right">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            {/* Map Section */}
            <div>
              <div className="bg-white rounded-lg border border-border overflow-hidden shadow-sm">
                <div className="bg-primary px-4 py-3 flex justify-between items-center">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Live Traffic Monitoring</h3>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-xs text-white font-bold tracking-wider uppercase">Live</span>
                  </div>
                </div>
                
                <div className="relative h-[500px] w-full z-0">
                  <MapContainer 
                    center={INDIA_CENTER}
                    zoom={INDIA_ZOOM}
                    minZoom={4}
                    maxZoom={18}
                    maxBounds={INDIA_BOUNDS}
                    maxBoundsViscosity={1.0}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <MapController mapRef={mapRef} />
                    <MapClickHandler onMapClick={handleMapClick} />

                    {/* Incident markers — rendered at their exact stored coordinates */}
                    {incidents.map((incident) => {
                      const lat = incident.location?.lat;
                      const lng = incident.location?.lng;
                      if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) return null;
                      return (
                        <CircleMarker
                          key={incident.id}
                          center={[parseFloat(lat), parseFloat(lng)]}
                          radius={9}
                          pathOptions={{
                            color: severityColors[incident.severity] || '#1a3a5c',
                            fillColor: severityColors[incident.severity] || '#1a3a5c',
                            fillOpacity: 0.75,
                            weight: 2.5
                          }}
                        >
                          <Popup>
                            <div className="p-1 min-w-[200px] font-sans">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`gov-badge-${incident.severity}`}>
                                  {incident.severity}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono uppercase">{incident.type?.replace('_',' ')}</span>
                              </div>
                              <h4 className="font-bold text-primary mb-1">{incident.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 truncate">{incident.location?.name || 'Unknown location'}</p>
                              <p className="text-xs text-gray-400 font-mono">{parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}°E</p>
                              <p className="text-xs text-gray-500 mt-1">Reported: {incident.created_at ? new Date(incident.created_at).toLocaleString('en-IN') : 'N/A'}</p>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}

                    {/* Temporary marker shown when user clicks map during modal */}
                    {isModalOpen && clickedLocation && (
                      <Marker
                        position={[clickedLocation.lat, clickedLocation.lng]}
                        icon={clickedMarkerIcon}
                      >
                        <Popup>
                          <div className="text-xs font-mono text-primary font-bold">
                            📍 {clickedLocation.lat.toFixed(6)}°N<br/>
                            {clickedLocation.lng.toFixed(6)}°E
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>

                  {/* Floating Legend */}
                  <div className="absolute bottom-4 right-4 z-[400] bg-white p-3 rounded shadow-lg border border-border">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b pb-1">Severity Levels</h4>
                    <div className="space-y-2">
                      {Object.entries({ critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: severityColors[key], borderColor: severityColors[key] }}></span>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View All India button */}
                  <div className="absolute top-4 left-4 z-[400]">
                    <button
                      onClick={handleFlyToIndia}
                      title="Reset to India view"
                      className="flex items-center gap-2 bg-white border border-border shadow-md px-3 py-2 rounded text-[12px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      View All India
                    </button>
                  </div>

                  {/* Modal click hint */}
                  {isModalOpen && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-primary text-white text-[12px] font-bold px-4 py-2 rounded shadow-lg flex items-center gap-2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
                      Click anywhere on the map to set incident location
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-gray-500 italic mt-2 text-right">
                Map data auto-refreshes every 30s. Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Incidents Table */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="bg-primary px-4 py-3 border-b border-primary-light">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">Recent Incidents</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-surface text-gray-500 uppercase text-[11px] font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Incident Details</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {incidents.slice(0, 5).map((inc, idx) => (
                          <tr key={inc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-surface'}>
                            <td className="px-4 py-3 font-mono text-gray-500 text-xs">#{String(inc.id).substring(0,6)}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-primary">{inc.title}</div>
                              <div className="text-gray-500 text-xs truncate max-w-[200px]">{inc.location?.name || 'Unknown location'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`gov-badge-${inc.severity}`}>{inc.severity}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 border border-gray-300 px-2 py-0.5 rounded bg-white">
                                {inc.status ? String(inc.status).replace('_', ' ') : 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {inc.created_at && !isNaN(new Date(inc.created_at).getTime()) 
                                ? new Date(inc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                        {incidents.length === 0 && (
                          <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No recent incidents.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 italic mt-2 text-right">
                  Showing latest 5 incidents. Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="bg-primary px-4 py-3 border-b border-primary-light">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">Quick Actions</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 h-full">
                    <button onClick={() => setIsModalOpen(true)} className="gov-btn-outline flex flex-col items-center justify-center gap-2 h-24 p-2 text-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <span className="text-xs font-bold">Report Incident</span>
                    </button>
                    <button className="gov-btn-outline flex flex-col items-center justify-center gap-2 h-24 p-2 text-center" onClick={() => navigate('/incidents')}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                      <span className="text-xs font-bold">Assign Officer</span>
                    </button>
                    <button className="gov-btn-outline flex flex-col items-center justify-center gap-2 h-24 p-2 text-center" onClick={() => navigate('/analytics')}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      <span className="text-xs font-bold">View Analytics</span>
                    </button>
                    <button className="gov-btn-outline flex flex-col items-center justify-center gap-2 h-24 p-2 text-center" onClick={handleFlyToIndia}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-xs font-bold">View All India</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>

      <ReportIncidentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setClickedLocation(null); }} 
        onSuccess={handleModalSuccess}
        initialLocation={clickedLocation}
      />
    </div>
  );
};

export default TrafficMapPage;
