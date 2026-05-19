import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { submitPublicReport } from '../services/publicService';
import { Link, useNavigate } from 'react-router-dom';
import { divIcon } from 'leaflet';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const customMarkerIcon = divIcon({
  className: 'bg-transparent',
  html: `<div class="w-8 h-8 bg-[#b71c1c] rounded-full border-[3px] border-white shadow-lg flex items-center justify-center">
           <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position} icon={customMarkerIcon} />
  );
};

const PublicReportPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  
  // Form Data
  const [position, setPosition] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [type, setType] = useState('accident');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleNext = () => {
    if (step === 1 && !position) return alert('Please tap on the map to pinpoint the location.');
    if (step === 1 && !locationName.trim()) return alert('Please provide a specific location landmark.');
    if (step === 2 && !description.trim()) return alert('Please provide a detailed description of the incident.');
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleFileChange = (e) => {
    if (e.target.files.length > 3) {
      alert("You can only attach a maximum of 3 official images.");
      e.target.value = null; // reset
      return;
    }
    setImages(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return alert('Name and phone are required for emergency verification.');

    setLoading(true);
    const formData = new FormData();
    formData.append('reporter_name', name);
    formData.append('reporter_phone', phone);
    formData.append('type', type);
    formData.append('description', description);
    formData.append('location_name', locationName);
    formData.append('latitude', position.lat);
    formData.append('longitude', position.lng);
    
    Array.from(images).forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });

    try {
      const response = await submitPublicReport(formData);
      setTrackingId(response.data.data.tracking_id);
    } catch (err) {
      if (err.response?.status === 429) {
        alert('Rate limit exceeded. Please try again later.');
      } else {
        alert('Failed to submit report. Please check your inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(trackingId);
    alert('Tracking ID successfully copied to clipboard!');
  };

  if (trackingId) {
    return (
      <div className="min-h-screen flex flex-col bg-surface font-sans">
        <PublicHeader />
        <main id="main-content" className="flex-1 flex items-center justify-center p-4">
          <div className="gov-card max-w-lg w-full text-center py-10 px-8">
            <div className="w-20 h-20 bg-[#2e7d32]/10 border-[3px] border-[#2e7d32] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-10 h-10 text-[#2e7d32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            
            <h2 className="text-[22px] font-bold text-primary mb-2">Report Submitted Successfully</h2>
            <p className="text-[14px] text-gray-600 mb-8 font-medium">Your incident report has been securely registered in the Traffic & Accident Management System.</p>
            
            <div className="bg-[#fff9e6] border-[2px] border-accent rounded p-6 mb-8 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">Official Tracking ID</span>
              <p className="text-2xl font-mono font-bold text-primary mb-4 select-all tracking-tight">{trackingId}</p>
              <button onClick={copyTrackingId} className="gov-btn-outline w-full text-[13px] py-2 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy Tracking ID
              </button>
            </div>

            <div className="text-left mb-8">
              <h3 className="text-[14px] font-bold text-primary mb-4 border-b border-border pb-2">What happens next?</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
                  <p className="text-[13px] text-gray-700 leading-snug">The Traffic Police Control Room will review and authenticate your report.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
                  <p className="text-[13px] text-gray-700 leading-snug">An officer will be immediately dispatched to the exact coordinates if an active hazard is present.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</div>
                  <p className="text-[13px] text-gray-700 leading-snug">You can monitor live status updates using your Tracking ID on this portal.</p>
                </div>
              </div>
            </div>

            <button onClick={() => navigate('/track')} className="gov-btn-primary w-full py-3 text-[14px]">
              Track Your Report Now
            </button>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Location' },
      { num: 2, label: 'Details' },
      { num: 3, label: 'Contact' }
    ];

    return (
      <div className="flex items-center justify-between relative mb-10 w-full max-w-md mx-auto z-0">
        <div className="absolute top-4 left-0 w-full h-[2px] bg-border -z-10"></div>
        <div className="absolute top-4 left-0 h-[2px] bg-primary -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
        
        {steps.map((s) => (
          <div key={s.num} className="flex flex-col items-center">
            {step > s.num ? (
              <div className="w-8 h-8 rounded-full bg-[#2e7d32] text-white flex items-center justify-center border-2 border-white shadow-sm ring-4 ring-surface">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            ) : step === s.num ? (
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center border-2 border-white shadow-sm ring-4 ring-surface">
                {s.num}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface text-gray-400 font-bold flex items-center justify-center border-2 border-border shadow-sm ring-4 ring-surface">
                {s.num}
              </div>
            )}
            <span className={`mt-2 text-[13px] font-bold ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans">
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="bg-primary pt-12 pb-24 px-4 md:px-8 text-center relative overflow-hidden">
        {/* Subtle background emblem */}
        <div className="absolute inset-0 flex justify-center items-center opacity-5 pointer-events-none">
          <span className="text-white text-[200px] font-black">GOV</span>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <h2 className="text-white text-[28px] md:text-[36px] font-bold mb-3 tracking-tight">Report a Traffic Incident</h2>
          <p className="text-white/80 text-[15px] md:text-[16px] max-w-2xl font-medium mb-8">Help us keep Punjab roads safe — report accidents, hazards, and severe congestion in your area to dispatch immediate assistance.</p>
          <Link to="/track" className="gov-btn-outline !border-accent !text-accent hover:!bg-accent hover:!text-white border-[2px] !font-bold px-8 py-3 text-[14px]">
            Track Your Existing Report
          </Link>
        </div>
      </div>

      {/* Main Form Content */}
      <main id="main-content" className="flex-1 px-4 md:px-8 -mt-16 pb-16 z-10 relative">
        <div className="max-w-2xl mx-auto gov-card !p-8 md:!p-10 shadow-lg">
          
          {renderStepIndicator()}

          <div className="min-h-[400px]">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h3 className="text-[20px] font-bold text-primary mb-1">Geographic Location</h3>
                <p className="text-[13px] text-gray-500 mb-6 font-medium">Please pinpoint the exact coordinates of the incident to dispatch nearest units.</p>
                
                <div className="h-[300px] w-full rounded border border-border mb-6 relative z-0 shadow-inner">
                  <MapContainer center={[30.9010, 75.8573]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>

                <div className="mb-8">
                  <label className="gov-form-label required">Nearest Landmark / Street Name</label>
                  <p className="text-[12px] text-gray-500 italic mb-2">E.g., "NH-44 Northbound near Jalandhar Bypass exit"</p>
                  <input 
                    type="text" 
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                    placeholder="Enter precise landmark..."
                    className="gov-form-input"
                  />
                </div>

                <div className="flex justify-end">
                  <button onClick={handleNext} className="gov-btn-primary px-8 py-3 text-[14px]">
                    Confirm Location &amp; Continue
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h3 className="text-[20px] font-bold text-primary mb-1">Incident Details</h3>
                <p className="text-[13px] text-gray-500 mb-6 font-medium">Classify the incident and provide descriptive intelligence.</p>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="gov-form-label required">Incident Classification</label>
                    <p className="text-[12px] text-gray-500 italic mb-2">Select the category that best describes the situation.</p>
                    <select 
                      value={type} 
                      onChange={e => setType(e.target.value)}
                      className="gov-form-input !h-auto py-2.5"
                    >
                      <option value="accident">Severe Accident (Collision)</option>
                      <option value="congestion">Severe Traffic Congestion / Jam</option>
                      <option value="roadblock">Roadblock / Fallen Debris</option>
                      <option value="signal_failure">Traffic Signal Malfunction</option>
                      <option value="hazard">Dangerous Road Hazard / Pothole</option>
                    </select>
                  </div>

                  <div>
                    <label className="gov-form-label required">Official Description</label>
                    <p className="text-[12px] text-gray-500 italic mb-2">Include number of vehicles involved, presence of injuries, etc.</p>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Provide an objective description..."
                      rows={5}
                      className="gov-form-input !h-auto resize-y"
                    ></textarea>
                  </div>

                  <div>
                    <label className="gov-form-label">Photographic Evidence (Optional)</label>
                    <p className="text-[12px] text-gray-500 italic mb-2">Attach up to 3 images to assist dispatch units.</p>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="gov-form-input !h-auto !py-1.5 cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[12px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                    />
                    {images.length > 0 && <p className="text-[12px] text-success mt-2 font-bold">{images.length} file(s) attached successfully.</p>}
                  </div>
                </div>

                <div className="flex justify-between border-t border-border pt-6">
                  <button onClick={handleBack} className="gov-btn-outline px-6 py-2.5 text-[14px]">
                    Back
                  </button>
                  <button onClick={handleNext} className="gov-btn-primary px-8 py-2.5 text-[14px]">
                    Continue to Verification
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h3 className="text-[20px] font-bold text-primary mb-1">Citizen Verification</h3>
                <p className="text-[13px] text-gray-500 mb-6 font-medium">Your contact details are required strictly for official emergency follow-up.</p>

                <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                  <div>
                    <label className="gov-form-label required">Full Legal Name</label>
                    <p className="text-[12px] text-gray-500 italic mb-2">As per official identification.</p>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      required
                      className="gov-form-input"
                    />
                  </div>

                  <div>
                    <label className="gov-form-label required">Primary Mobile Number</label>
                    <p className="text-[12px] text-gray-500 italic mb-2">Active number for urgent SMS updates and officer contact.</p>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      required
                      className="gov-form-input"
                    />
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded text-[12px] text-gray-600 font-medium leading-relaxed mt-4">
                    By submitting this report, you confirm that the provided information is accurate to the best of your knowledge. Filing a false report is a punishable offense under applicable laws.
                  </div>

                  <div className="flex justify-between border-t border-border pt-6">
                    <button type="button" onClick={handleBack} className="gov-btn-outline px-6 py-2.5 text-[14px]">
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="gov-btn-primary px-10 py-3 text-[15px] flex items-center justify-center gap-2">
                      {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
                      {loading ? 'Submitting to Servers...' : 'Submit Official Report'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicReportPage;
