import { useState, useEffect } from 'react';
import { reportIncident } from '../services/incidentService';
import { extractErrors, extractMessage } from '../utils/errorHelpers';
import GovInputField from './GovInputField';

const ReportIncidentModal = ({ isOpen, onClose, onSuccess, initialLocation }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'accident',
    severity: 'medium',
    location_name: '',
    latitude: '',
    longitude: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  // Update lat/lng if the user clicks on the map while modal is open
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setForm(prev => ({
        ...prev,
        latitude: initialLocation.lat.toFixed(6),
        longitude: initialLocation.lng.toFixed(6)
      }));
      setErrors(prev => ({ ...prev, latitude: '', longitude: '' }));
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGlobalError('');

    try {
      await reportIncident(form);
      onSuccess();
      setForm({
        title: '', description: '', type: 'accident', severity: 'medium',
        location_name: '', latitude: '', longitude: ''
      });
    } catch (err) {
      const fieldErrors = extractErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setGlobalError(extractMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-8 mx-4 pointer-events-auto max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-[20px] font-bold text-primary mb-1">Report New Incident</h3>
        <p className="text-gray-600 text-[13px] mb-6 font-medium">
          Provide details about the incident. You can click on the map to set the exact coordinates.
        </p>

        {globalError && (
          <div className="mb-4 px-4 py-3 rounded bg-danger/10 border-l-4 border-danger text-danger text-[13px] font-bold" role="alert">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <GovInputField id="title" label="Title" placeholder="Brief summary" value={form.title} onChange={handleChange} error={errors.title} />
          
          <div className="mb-5 relative">
            <label className="gov-form-label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className={`gov-form-input !h-auto resize-y ${errors.description ? 'error' : ''}`}
              placeholder="Detailed description..."
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="gov-form-error" role="alert">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
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

          <GovInputField id="location_name" label="Location Name / Address" placeholder="e.g. NH-44, Ambala bypass" value={form.location_name} onChange={handleChange} error={errors.location_name} />

          <div className="grid grid-cols-2 gap-4 mb-2">
            <GovInputField id="latitude" label="Latitude" placeholder="Click map to set" value={form.latitude} onChange={handleChange} error={errors.latitude} />
            <GovInputField id="longitude" label="Longitude" placeholder="Click map to set" value={form.longitude} onChange={handleChange} error={errors.longitude} />
          </div>

          {!form.latitude && !form.longitude && (
            <p className="text-[11px] text-primary font-bold mb-4 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Tip: Click anywhere on the map behind this modal to auto-fill coordinates
            </p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 gov-btn-outline h-[40px]">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 gov-btn-primary h-[40px] flex items-center justify-center gap-2">
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              )}
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentModal;
