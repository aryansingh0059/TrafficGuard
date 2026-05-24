import React from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '../services/authService';
import logoSrc from '../assets/logo.png';

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

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Ignore network errors or expired sessions
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-[1050] shadow-lg">
      <div className="px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">

        {/* ── Left: Logo + Brand name ─────────────────────────────── */}
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-3 shrink-0 hover:opacity-90 transition-opacity"
          aria-label="TrafficGuard home"
        >
          {/* Logo image */}
          <img
            src={logoSrc}
            alt="TrafficGuard logo"
            className="h-9 w-9 rounded-full object-cover bg-white/10 border border-white/20 shrink-0"
          />

          {/* Word-mark */}
          <div className="flex flex-col leading-tight">
            <span className="text-[17px] font-black tracking-tight text-white">
              Traffic<span className="text-accent">Guard</span>
            </span>
            <span className="text-[9px] text-white/55 uppercase tracking-[.12em] font-semibold hidden sm:block">
              Traffic &amp; Accident Management
            </span>
          </div>
        </Link>

        {/* ── Centre: ministry tag (desktop only) ─────────────────── */}
        <div className="hidden lg:flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
            Ministry of Road Transport — Government of India
          </span>
        </div>

        {/* ── Right: User info + Logout ───────────────────────────── */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Live indicator dot */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Live</span>
          </div>

          {/* Track Status */}
          {user?.role !== 'admin' && (
            <Link
              to="/track"
              className="flex items-center gap-1.5 text-[12.5px] font-bold text-white hover:text-accent hover:border-accent/40 border border-white/15 rounded-md px-3 py-1.5 transition-all bg-white/5 shadow-sm"
              title="Track Incident Status"
            >
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline uppercase tracking-wide text-[10.5px]">Track Status</span>
            </Link>
          )}

          {/* User name + badge */}
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <span className="text-[13px] font-bold leading-tight">{user?.name || 'Authorized Personnel'}</span>
            <RoleBadge role={user?.role} />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-7 bg-white/20" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[12px] font-semibold hover:text-accent transition-colors border border-white/20 rounded-md px-3 py-1.5 hover:border-accent/50"
            title="Logout securely"
            aria-label="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>

      {/* Indian tricolour stripe */}
      <div className="flex w-full" style={{ height: '4px' }}>
        <div
          className="flex-1"
          style={{
            background: '#FF9933',
            boxShadow: '0 0 8px 1px rgba(255,153,51,0.7)',
          }}
        />
        <div
          className="flex-1"
          style={{
            background: '#ffffff',
            boxShadow: '0 0 6px 1px rgba(255,255,255,0.4)',
          }}
        />
        <div
          className="flex-1"
          style={{
            background: '#138808',
            boxShadow: '0 0 8px 1px rgba(19,136,8,0.7)',
          }}
        />
      </div>
    </header>
  );
};

export default GovHeader;
