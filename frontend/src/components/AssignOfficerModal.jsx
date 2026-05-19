import { useState, useEffect } from 'react';
import { getOfficers } from '../services/userService';
import { assignIncident } from '../services/incidentService';

const AssignOfficerModal = ({ incident, isOpen, onClose, onSuccess }) => {
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFetching(true);
      getOfficers()
        .then(res => setOfficers(res.data.data))
        .catch(err => console.error(err))
        .finally(() => setFetching(false));
    }
  }, [isOpen]);

  if (!isOpen || !incident) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedOfficer) return;
    setLoading(true);
    try {
      await assignIncident(incident.id, { assigned_to: selectedOfficer });
      onSuccess();
    } catch (error) {
      console.error('Failed to assign', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h3 className="text-lg font-bold text-white mb-2">Assign Officer</h3>
        <p className="text-sm text-slate-400 mb-4">Assigning incident: <span className="text-white font-medium">{incident.title}</span></p>

        <form onSubmit={handleAssign}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Traffic Officer</label>
            {fetching ? (
              <div className="text-slate-500 text-sm animate-pulse">Loading officers...</div>
            ) : (
              <select 
                value={selectedOfficer} 
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2.5 outline-none focus:border-orange-500"
              >
                <option value="">-- Choose an officer --</option>
                {officers.map(officer => (
                  <option key={officer.id} value={officer.id}>{officer.name} ({officer.email})</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={loading || !selectedOfficer} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-semibold">
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignOfficerModal;
