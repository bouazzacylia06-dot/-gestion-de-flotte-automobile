import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

const navLinks = [
  { to: '/dashboard',    label: 'Dashboard',    icon: '⊞', roles: ['admin', 'manager'] },
  { to: '/vehicles',     label: 'Véhicules',    icon: '🚗', roles: ['admin', 'manager', 'utilisateur'] },
  { to: '/conducteurs',  label: 'Conducteurs',  icon: '👤', roles: ['admin', 'manager'] },
  { to: '/maintenance',  label: 'Maintenance',  icon: '🔧', roles: ['admin', 'manager', 'technicien'] },
  { to: '/localisation', label: 'Localisation', icon: '📍', roles: ['admin', 'manager'] },
];

const ROLE_CONFIG = {
  admin:       { label: 'Admin',       cls: 'bg-red-500/20 text-red-200 border border-red-400/30' },
  manager:     { label: 'Manager',     cls: 'bg-blue-500/20 text-blue-200 border border-blue-400/30' },
  technicien:  { label: 'Technicien',  cls: 'bg-amber-500/20 text-amber-200 border border-amber-400/30' },
  utilisateur: { label: 'Utilisateur', cls: 'bg-gray-500/20 text-gray-300 border border-gray-400/30' },
};

export default function Navbar() {
  const { userInfo, roles, hasRole, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = navLinks.filter((l) => l.roles.some((r) => hasRole(r)));
  const primaryRole  = ['admin', 'manager', 'technicien', 'utilisateur'].find((r) => roles.includes(r));
  const roleCfg      = ROLE_CONFIG[primaryRole] || null;

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg relative z-40">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/dashboard" className="text-xl font-bold tracking-tight flex items-center gap-2 group">
            <span className="text-2xl transition-transform group-hover:scale-110 duration-200 inline-block">🚗</span>
            <span className="hidden sm:inline bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              FleetManager
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex gap-0.5">
            {visibleLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    location.pathname === l.to
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none">{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* User info + logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white leading-tight">{userInfo?.preferred_username}</p>
              {roleCfg && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleCfg.cls}`}>
                  {roleCfg.label}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="text-xs bg-white/10 hover:bg-red-600 border border-white/10 hover:border-red-500 transition-all px-3 py-1.5 rounded-lg"
            >
              Déconnexion
            </button>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile side panel */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible'}`}
      >
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        {/* panel */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 bg-slate-900 shadow-2xl transition-transform duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="text-white font-bold flex items-center gap-2">
              <span>🚗</span> FleetManager
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="px-3 py-4 flex-1 overflow-y-auto">
            {roleCfg && (
              <div className="px-2 mb-4">
                <p className="text-slate-400 text-xs mb-1">{userInfo?.preferred_username}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleCfg.cls}`}>
                  {roleCfg.label}
                </span>
              </div>
            )}
            <ul className="space-y-1">
              {visibleLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === l.to
                        ? 'bg-white/15 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{l.icon}</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-5 py-4 border-t border-white/10">
            <button
              onClick={logout}
              className="w-full text-sm bg-red-600/80 hover:bg-red-600 text-white font-medium py-2 rounded-xl transition-all"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
