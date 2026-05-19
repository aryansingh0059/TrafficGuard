import { useState } from 'react';
import { addIncidentUpdate } from '../services/incidentService';
import useAuthStore from '../store/authStore';

const IncidentSlideOver = ({ incident, isOpen, onClose, onUpdateAdded }) => {
  const [updateMessage, setUpdateMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  if (!isOpen || !incident) return null;

  const severityColors = {
    critical: 'bg-[#b71c1c] text-white',
    high: 'bg-[#e65100] text-white',
    medium: 'bg-[#d4a017] text-white',
    low: 'bg-[#2e7d32] text-white',
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!updateMessage.trim()) return;
    setLoading(true);
    try {
      await addIncidentUpdate(incident.id, { message: updateMessage });
      setUpdateMessage('');
      onUpdateAdded(); // Refresh parent to get new timeline
    } catch (error) {
      console.error('Failed to add update', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]" onClick={onClose} />
      
      {/* Slide Over Panel */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[2010] transform transition-transform duration-300 flex flex-col border-l border-[#dde1e7] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Navy Header */}
        <div className="px-6 py-4 border-b border-[#dde1e7] flex items-center justify-between bg-primary shrink-0 shadow-sm">
          <h2 className="text-[16px] font-bold text-white tracking-wide">Incident Details — ID#{String(incident.id).substring(0,8)}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors" title="Close Panel">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface">
          
          {/* Overview Card */}
          <div className="bg-white border border-[#dde1e7] p-5 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-[5px] ${severityColors[incident.severity] || 'bg-gray-500 text-white'}`}>
                {incident.severity}
              </span>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-[5px] border border-gray-300 bg-gray-100 text-gray-700">
                {incident.type ? String(incident.type).replace('_', ' ') : 'N/A'}
              </span>
            </div>
            <h3 className="text-[18px] font-bold text-primary mb-2 leading-snug">{incident.title}</h3>
            <p className="text-gray-600 text-[13px] leading-relaxed">{incident.description}</p>
          </div>

          {/* Meta Information */}
          <div className="bg-white rounded-lg p-5 border border-[#dde1e7] shadow-sm">
            <h4 className="text-[12px] font-bold text-primary uppercase tracking-wider mb-4 border-b border-[#dde1e7] pb-2">Record Metadata</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500 font-medium">Tracking ID</span>
                <span className="text-primary font-mono font-bold text-right text-[11px] bg-primary/10 px-1.5 py-0.5 rounded select-all">{incident.tracking_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500 font-medium">Location</span>
                <span className="text-gray-900 font-bold text-right max-w-[60%]">{incident.location?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500 font-medium">Reported By</span>
                <span className="text-gray-900 font-bold">{incident.reporter?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500 font-medium">Assigned Officer</span>
                <span className="text-gray-900 font-bold">{incident.assigned_officer?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500 font-medium">Date & Time</span>
                <span className="text-gray-900 font-bold">
                  {incident.created_at && !isNaN(new Date(incident.created_at).getTime()) ? new Date(incident.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Timeline */}
          <div className="bg-white rounded-lg p-5 border border-[#dde1e7] shadow-sm">
            <h4 className="text-[12px] font-bold text-primary uppercase tracking-wider mb-5 border-b border-[#dde1e7] pb-2">Official Timeline</h4>
            
            <div className="relative border-l-[3px] border-[#dde1e7] ml-3 space-y-6 pb-2">
              {incident.updates && incident.updates.length > 0 ? (
                incident.updates.map((update) => (
                  <div key={update.id} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-1 w-[15px] h-[15px] rounded-full border-[3px] border-white bg-accent shadow-sm" />
                    
                    <div className="flex flex-col mb-1">
                      <span className="text-[13px] font-bold text-primary">{update.user?.name || 'System Auto'}</span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {update.created_at && !isNaN(new Date(update.created_at).getTime()) ? new Date(update.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      </span>
                    </div>
                    
                    <div className={`mt-1.5 p-3 rounded-lg border text-[13px] leading-relaxed ${update.type === 'status_change' || update.type === 'assignment' ? 'bg-[#fffdf5] border-accent/30 text-gray-800 font-medium' : 'bg-surface border-border text-gray-700'}`}>
                      {update.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-[15px] h-[15px] rounded-full border-[3px] border-white bg-gray-300" />
                  <p className="text-[13px] text-gray-500 italic mt-0.5">No updates recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Update Footer */}
        {(user?.role === 'admin' || user?.role === 'traffic_officer') && (
          <div className="p-5 border-t border-[#dde1e7] bg-white shrink-0">
            <form onSubmit={handleAddUpdate}>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2">Record New Update</label>
              <textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="Enter official statement or status update..."
                className="w-full bg-surface border border-border rounded-lg p-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none mb-3"
                rows="3"
              />
              <button 
                type="submit" 
                disabled={loading || !updateMessage.trim()}
                className="gov-btn-primary w-full py-2.5 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                )}
                {loading ? 'Submitting...' : 'Post Official Update'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default IncidentSlideOver;
