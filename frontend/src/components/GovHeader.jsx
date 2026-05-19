import React from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const RoleBadge = ({ role }) => {
  if (!role) return null;
  const isAdmin = role === 'admin';
  return (
    <span
      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
        isAdmin
          ? 'bg-white text-primary'
          : 'bg-white/20 text-white/90'
      }`}
    >
      {role.replace('_', ' ')}
    </span>
  );
};

const GovHeader = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // clears token, user from store + localStorage
    navigate('/login');
  };

  return (
    <header className="bg-primary text-white border-b-4 border-accent sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">

        {/* Left: Mobile Hamburger & Emblem */}
        <div className="flex items-center gap-4">
          <button className="md:hidden text-white hover:text-white/80 p-1" aria-label="Open mobile menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L3 6v6.5c0 5.05 3.81 9.85 9 11.5 5.19-1.65 9-6.45 9-11.5V6l-9-4zm0 2.18l7 3.12v5.2c0 4.08-2.82 8.01-7 9.51-4.18-1.5-7-5.43-7-9.51V7.3l7-3.12z" />
            </svg>
          </div>
          <h1 className="text-[14px] md:hidden font-bold tracking-wide uppercase leading-tight line-clamp-2">
            Traffic Management
          </h1>
        </div>

        {/* Center: Desktop System Name */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block text-center">
          <h1 className="text-[15px] font-bold tracking-wide uppercase">
            Traffic &amp; Accident Management System
          </h1>
          <p className="text-[10px] text-white/60 tracking-widest uppercase font-medium">
            Ministry of Road Transport — Government of India
          </p>
        </div>

        {/* Right: User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end hidden sm:flex gap-0.5">
            <span className="text-[13px] font-bold leading-tight">{user?.name || 'Authorized Personnel'}</span>
            <RoleBadge role={user?.role} />
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[13px] font-medium hover:text-accent-light transition-colors border border-white/20 rounded px-3 py-1.5"
            title="Logout securely"
            aria-label="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default GovHeader;
