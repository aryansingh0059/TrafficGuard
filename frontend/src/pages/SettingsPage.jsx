import React, { useState } from 'react';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import useAuthStore from '../store/authStore';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

const SettingsPage = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // System parameters
  const [alertSettings, setAlertSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    criticalOnly: true,
    systemLogs: true
  });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      showToast('Error', 'New passwords do not match', 'error');
      return;
    }
    setUpdatingPassword(true);
    try {
      await api.post('/user/change-password', passwordForm);
      showToast('Success', 'Password updated successfully', 'success');
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden">
      <GovHeader />
      <div className="flex flex-1 overflow-hidden">
        <GovSidebar />

        <main id="main-content" className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-[20px] font-bold text-primary uppercase tracking-wide">System Settings</h2>
            <p className="text-[12px] text-gray-500 font-medium">Control operator profiles, alert behaviors, and system state credentials.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Profile Overview */}
            <div className="bg-white p-5 rounded-lg border border-border shadow-sm space-y-4">
              <h3 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border pb-2">Profile Overview</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center text-primary font-black text-xl">
                  {user?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-primary">{user?.name}</h4>
                  <p className="text-[12px] text-gray-400 font-mono">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Portal Role:</span>
                  <span className="font-black text-primary capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Authorization:</span>
                  <span className="font-black text-success">Verified</span>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="bg-white p-5 rounded-lg border border-border shadow-sm lg:col-span-2">
              <h3 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border pb-2 mb-4">Update Security Credentials</h3>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="gov-form-label required">Current Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                      className="gov-form-input" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="gov-form-label required">New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      className="gov-form-input" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="gov-form-label required">Confirm New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passwordForm.new_password_confirmation}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password_confirmation: e.target.value})}
                      className="gov-form-input" 
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={updatingPassword}
                    className="gov-btn-primary px-5 py-2.5 text-[12px] uppercase font-bold tracking-wider"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Notification Parameters */}
            <div className="bg-white p-5 rounded-lg border border-border shadow-sm lg:col-span-3">
              <h3 className="text-primary font-bold text-sm uppercase tracking-wide border-b border-border pb-2 mb-4">Critical Dispatch & Alert Routing</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'emailAlerts', label: 'Email Dispatch Notifications', desc: 'Alert incident commanders instantly via email.' },
                  { key: 'smsAlerts', label: 'SMS Carrier Alerts', desc: 'Dispatch priority cellular reports directly.' },
                  { key: 'criticalOnly', label: 'Critical Severity Only', desc: 'Only page operators on red code incidents.' },
                  { key: 'systemLogs', label: 'Audit Log Storage', desc: 'Keep automated Spatie system changes logs.' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="p-4 rounded-lg border border-border flex flex-col justify-between hover:bg-surface/30 transition-all">
                    <div>
                      <h4 className="font-bold text-primary text-[13px]">{label}</h4>
                      <p className="text-[11px] text-gray-400 mt-1 leading-normal">{desc}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button 
                        type="button" 
                        onClick={() => {
                          setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }));
                          showToast('Setting Saved', `${label} parameter updated successfully.`, 'info');
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                          alertSettings[key] ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                          alertSettings[key] ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                        {alertSettings[key] ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
