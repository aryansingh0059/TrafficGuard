import { useState, useEffect, useCallback } from 'react';
import { getIncidents, updateIncident, deleteIncident } from '../services/incidentService';
import useAuthStore from '../store/authStore';
import IncidentSlideOver from '../components/IncidentSlideOver';
import AssignOfficerModal from '../components/AssignOfficerModal';
import ReportIncidentModal from '../components/ReportIncidentModal';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import GovSkeleton from '../components/GovSkeleton';
import GovEmpty from '../components/GovEmpty';

const severityColors = {
  critical: 'bg-[#b71c1c] text-white',
  high: 'bg-[#e65100] text-white',
  medium: 'bg-[#d4a017] text-white',
  low: 'bg-[#2e7d32] text-white',
};

const statusColors = {
  reported: 'border-2 border-primary text-primary font-bold bg-transparent',
  active: 'bg-blue-600 text-white border border-blue-600',
  under_investigation: 'bg-[#d4a017] text-white border border-[#d4a017]',
  resolved: 'bg-[#2e7d32] text-white border border-[#2e7d32]',
  closed: 'bg-gray-500 text-white border border-gray-500',
};

const IncidentManagementPage = () => {
  const { user } = useAuthStore();
  const [incidents, setIncidents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    severity: '',
    dateFrom: '',
    dateTo: ''
  });

  // UI State
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIncidents({
        page,
        per_page: perPage,
        ...filters
      });
      setIncidents(res?.data?.data || []);
      setMeta(res?.data?.meta || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filters]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchIncidents();
  };

  const handleResetFilters = () => {
    setFilters({ search: '', type: '', status: '', severity: '', dateFrom: '', dateTo: '' });
    setPage(1);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
      await updateIncident(id, { status: newStatus });
      fetchIncidents();
    } catch (err) {
      console.error('Failed to update status', err);
      fetchIncidents();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this incident record?')) return;
    try {
      await deleteIncident(id);
      fetchIncidents();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const openSlideOver = (incident) => {
    setSelectedIncident(incident);
    setIsSlideOverOpen(true);
  };

  const openAssignModal = (incident) => {
    setSelectedIncident(incident);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden">
      <GovHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <GovSidebar />

        <main id="main-content" className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Page Header Section */}
          <div className="gov-card border-l-[4px] border-l-primary flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-bold text-primary mb-1">Incident Records</h1>
              <p className="text-[13px] text-gray-500 font-medium">Traffic & Accident Management System — Incident Registry</p>
            </div>
            {meta && (
              <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg flex flex-col items-end">
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Total Records</span>
                <span className="text-[22px] font-black text-primary leading-none">{meta.total}</span>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="gov-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[12px] text-primary uppercase font-bold tracking-wider">Filter Records</h2>
              <button onClick={handleResetFilters} className="text-[12px] text-gray-500 hover:text-primary underline underline-offset-2 transition-colors font-medium focus-visible:outline-none">Reset</button>
            </div>
            
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Search ID / Title</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search..." className="gov-form-input !pl-9" />
                </div>
              </div>
              
              <div className="w-36">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Type</label>
                <select name="type" value={filters.type} onChange={handleFilterChange} className="gov-form-input">
                  <option value="">All Types</option>
                  <option value="accident">Accident</option>
                  <option value="congestion">Congestion</option>
                  <option value="roadblock">Roadblock</option>
                  <option value="signal_failure">Signal Failure</option>
                  <option value="hazard">Hazard</option>
                </select>
              </div>

              <div className="w-36">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Severity</label>
                <select name="severity" value={filters.severity} onChange={handleFilterChange} className="gov-form-input">
                  <option value="">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="w-36">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="gov-form-input">
                  <option value="">All Statuses</option>
                  <option value="reported">Reported</option>
                  <option value="active">Active</option>
                  <option value="under_investigation">Under Inv.</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="w-32">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Date From</label>
                <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="gov-form-input" />
              </div>

              <div className="w-32">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Date To</label>
                <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="gov-form-input" />
              </div>

              <button onClick={handleApplyFilters} className="gov-btn-primary h-[38px] flex items-center justify-center min-w-[120px] ml-auto">
                Apply Filters
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 text-[13px] font-bold text-primary hover:text-primary-light transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create New Incident Record
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white font-bold rounded shadow-sm text-[13px] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export to Excel
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap hidden md:table">
                <thead className="bg-primary text-white text-[13px] uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 border border-[#dde1e7]">Sr.No</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Incident ID</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Title</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Type</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Severity</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Location</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Reported By</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Date &amp; Time</th>
                    <th className="px-4 py-3 border border-[#dde1e7]">Status</th>
                    <th className="px-4 py-3 border border-[#dde1e7] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dde1e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="p-0 border-0">
                        <GovSkeleton count={10} type="table-row" className="px-4" />
                      </td>
                    </tr>
                  ) : incidents.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-0 border-0">
                        <GovEmpty title="No Incidents Found" subtitle="Try adjusting your filters or search criteria." actionText="Reset Filters" onAction={handleResetFilters} />
                      </td>
                    </tr>
                  ) : (
                    incidents.map((incident, idx) => (
                      <tr key={incident.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-surface'} gov-table-row group`}>
                        <td className="px-4 py-3 border border-[#dde1e7] text-gray-500 text-xs">{(page - 1) * perPage + idx + 1}</td>
                        <td className="px-4 py-3 border border-[#dde1e7] font-mono text-primary font-medium text-xs">#{String(incident.id).substring(0,8)}</td>
                        <td className="px-4 py-3 border border-[#dde1e7]">
                          <div className="font-bold text-gray-900 max-w-[200px] truncate" title={incident.title}>{incident.title}</div>
                        </td>
                        <td className="px-4 py-3 border border-[#dde1e7]">
                          <span className="text-xs font-semibold text-gray-700 capitalize">{incident.type ? String(incident.type).replace('_', ' ') : 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 border border-[#dde1e7]">
                          <span className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold uppercase tracking-wider ${severityColors[incident.severity] || 'bg-gray-500 text-white'}`}>
                            {incident.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 border border-[#dde1e7]">
                          <div className="text-gray-600 text-xs max-w-[150px] truncate" title={incident.location?.name}>{incident.location?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-4 py-3 border border-[#dde1e7] text-gray-700 text-xs">
                          {incident.reporter?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 border border-[#dde1e7] text-gray-600 text-xs">
                          {incident.created_at && !isNaN(new Date(incident.created_at).getTime()) ? new Date(incident.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 border border-[#dde1e7]">
                          {user?.role === 'admin' || user?.role === 'traffic_officer' ? (
                            <select 
                              value={incident.status}
                              onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full outline-none cursor-pointer appearance-none ${statusColors[incident.status] || 'bg-gray-100 text-gray-800'}`}
                            >
                              <option value="reported">Reported</option>
                              <option value="active">Active</option>
                              <option value="under_investigation">Under Inv.</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          ) : (
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[incident.status] || 'bg-gray-100 text-gray-800'}`}>
                              {incident.status ? String(incident.status).replace('_', ' ') : 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 border border-[#dde1e7]">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openSlideOver(incident)} aria-label="View Details" className="w-[30px] h-[30px] flex items-center justify-center rounded-[4px] bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors border border-blue-200" title="View Details">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            {user?.role === 'admin' && (
                              <button onClick={() => openAssignModal(incident)} aria-label="Assign Officer" className="w-[30px] h-[30px] flex items-center justify-center rounded-[4px] bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors border border-amber-200" title="Assign / Edit">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                            )}
                            {(user?.role === 'admin' || user?.id === incident.reporter?.id) && (
                              <button onClick={() => handleDelete(incident.id)} aria-label="Delete Record" className="w-[30px] h-[30px] flex items-center justify-center rounded-[4px] bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors border border-red-200" title="Delete Record">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden flex flex-col divide-y divide-border bg-surface">
              {loading ? (
                <GovSkeleton count={5} type="card" className="m-4 bg-white" />
              ) : incidents.length === 0 ? (
                <GovEmpty title="No Incidents Found" subtitle="Try adjusting your filters or search criteria." actionText="Reset Filters" onAction={handleResetFilters} />
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="p-4 bg-white space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-primary font-bold text-[11px]">#{String(incident.id).substring(0,8)}</span>
                        <h3 className="text-[14px] font-bold text-gray-900 mt-0.5">{incident.title}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${severityColors[incident.severity] || 'bg-gray-500 text-white'}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[12px] text-gray-600">
                      <span className="truncate max-w-[60%]">{incident.location?.name || 'Unknown'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[incident.status] || 'bg-gray-100 text-gray-800'}`}>
                        {incident.status ? String(incident.status).replace('_', ' ') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-border mt-3">
                      <button onClick={() => openSlideOver(incident)} aria-label="View Details" className="flex-1 gov-btn h-[32px] bg-blue-50 text-blue-600 border border-blue-200">View</button>
                      {user?.role === 'admin' && (
                        <button onClick={() => openAssignModal(incident)} aria-label="Assign" className="gov-btn h-[32px] bg-amber-50 text-amber-600 border border-amber-200">Assign</button>
                      )}
                      {(user?.role === 'admin' || user?.id === incident.reporter?.id) && (
                        <button onClick={() => handleDelete(incident.id)} aria-label="Delete" className="gov-btn h-[32px] bg-red-50 text-red-600 border border-red-200">Delete</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {meta && (
              <div className="px-4 py-3 border-t border-[#dde1e7] flex items-center justify-between bg-surface">
                <div className="text-sm text-gray-600 font-medium">
                  Showing <span className="text-primary font-bold">{meta.from || 0}-{meta.to || 0}</span> of <span className="text-primary font-bold">{meta.total}</span> records
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold uppercase">Records per page:</span>
                    <select 
                      value={perPage} 
                      onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                      className="bg-white border border-border text-gray-700 text-xs rounded px-2 py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-primary font-semibold rounded text-sm transition-colors border border-border shadow-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Prev
                    </button>
                    <button 
                      onClick={() => setPage(p => p + 1)}
                      disabled={page === meta.last_page || !meta.last_page}
                      className="px-3 py-1 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-primary font-semibold rounded text-sm transition-colors border border-border shadow-sm flex items-center gap-1"
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <IncidentSlideOver 
        incident={selectedIncident} 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        onUpdateAdded={() => fetchIncidents()}
      />

      <AssignOfficerModal 
        incident={selectedIncident} 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        onSuccess={() => { setIsAssignModalOpen(false); fetchIncidents(); }} 
      />

      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => { setIsReportModalOpen(false); fetchIncidents(); }}
      />
    </div>
  );
};

export default IncidentManagementPage;
