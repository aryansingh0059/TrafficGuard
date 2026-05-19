import { useState } from 'react';
import { trackPublicIncident } from '../services/publicService';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const PublicTrackPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [incidentData, setIncidentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError(null);
    setIncidentData(null);

    try {
      const response = await trackPublicIncident(trackingId.trim());
      setIncidentData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to locate record. Please verify your 36-character Tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    reported: 'bg-transparent border border-primary text-primary',
    active: 'bg-blue-600 text-white border-transparent',
    under_investigation: 'bg-[#d4a017] text-white border-transparent',
    resolved: 'bg-[#2e7d32] text-white border-transparent',
    closed: 'bg-gray-500 text-white border-transparent'
  };

  // Status mapping for progress bar
  const statusLevels = ['reported', 'active', 'under_investigation', 'resolved'];
  
  const getProgressWidth = (currentStatus) => {
    if (currentStatus === 'closed') return '100%';
    const index = statusLevels.indexOf(currentStatus);
    if (index === -1) return '0%';
    return `${(index / (statusLevels.length - 1)) * 100}%`;
  };

  const getExpectedTimeline = (currentStatus) => {
    if (currentStatus === 'resolved' || currentStatus === 'closed') return 'Completed';
    if (currentStatus === 'reported') return 'Awaiting Dispatch (Usually < 15 mins)';
    if (currentStatus === 'active') return 'Officer Dispatched (ETA < 30 mins)';
    if (currentStatus === 'under_investigation') return 'Ongoing Clearance (Variable)';
    return 'Pending';
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans">
      <PublicHeader />
      
      <main id="main-content" className="flex-1 px-4 md:px-8 py-10">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-8">
            <h2 className="text-[28px] font-bold text-primary mb-2">Track Incident Status</h2>
            <p className="text-[14px] text-gray-600 font-medium">Enter your official tracking ID to view real-time intelligence and audit logs.</p>
          </div>

          <div className="gov-card mb-8 shadow-sm">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full relative">
                <label className="gov-form-label required">Official Tracking ID</label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className={`gov-form-input font-mono !h-[52px] ${error ? 'error' : ''}`}
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby="tracking-error"
                />
                {error && (
                  <p id="tracking-error" className="gov-form-error" role="alert">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !trackingId.trim()}
                className="gov-btn-primary w-full sm:w-auto h-[52px] px-8 text-[14px] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Querying Database...' : 'Track Status'}
              </button>
            </form>


          </div>

          {incidentData && (
            <div className="gov-card shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                      {incidentData.type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500 text-[11px] font-mono tracking-wider">
                      ID: {String(incidentData.id).substring(0,8)}...
                    </span>
                  </div>
                  <h3 className="text-[20px] font-bold text-gray-900 leading-tight">{incidentData.title}</h3>
                  <p className="text-[13px] text-gray-600 font-medium flex items-center gap-1.5 mt-1">
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {incidentData.location_name || 'Location recorded'}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusColors[incidentData.status] || 'bg-gray-500 text-white'}`}>
                    Status: {incidentData.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8 p-5 bg-surface border border-border rounded-lg">
                <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  <span>Reported</span>
                  <span className="text-center">Active</span>
                  <span className="text-center hidden sm:block">Investigating</span>
                  <span className="text-right">Resolved</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#2e7d32] transition-all duration-1000 ease-in-out"
                    style={{ width: getProgressWidth(incidentData.status) }}
                  ></div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-2 border-t border-gray-200">
                  <p className="text-[12px] text-gray-600 font-medium">
                    <span className="font-bold text-gray-900">Submitted:</span> {new Date(incidentData.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="text-[12px] text-gray-600 font-medium">
                    <span className="font-bold text-gray-900">Timeline:</span> <span className="text-primary">{getExpectedTimeline(incidentData.status)}</span>
                  </p>
                </div>
              </div>

              {/* Audit Log */}
              <div>
                <h4 className="text-[14px] font-bold text-primary mb-5 uppercase tracking-wider border-b border-border pb-2">Official Audit Log</h4>
                <div className="relative border-l-[3px] border-[#dde1e7] ml-3 space-y-6 pb-2">
                  {incidentData.updates.map((update, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-[15px] h-[15px] rounded-full border-[3px] border-white bg-primary shadow-sm" />
                      
                      <div className="flex flex-col mb-1">
                        <span className="text-[13px] font-bold text-primary">
                          {update.status_change ? `Status Updated to ${update.status_change.toUpperCase().replace('_', ' ')}` : 'System Update Provided'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {new Date(update.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      
                      <div className={`mt-1.5 p-3 rounded bg-surface border border-border text-[13px] text-gray-700 leading-relaxed font-medium`}>
                        {update.message}
                      </div>
                    </div>
                  ))}
                  {incidentData.updates.length === 0 && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-[15px] h-[15px] rounded-full border-[3px] border-white bg-gray-300" />
                      <p className="text-[13px] text-gray-500 italic mt-0.5 font-medium">No updates have been posted to the audit log yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicTrackPage;
