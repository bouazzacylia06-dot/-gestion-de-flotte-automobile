import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const ROLE_CONFIG = {
  admin:       { label: 'Administrateur', cls: 'bg-red-500/15 text-red-300 border border-red-500/20' },
  manager:     { label: 'Manager',        cls: 'bg-blue-500/15 text-blue-300 border border-blue-500/20' },
  technicien:  { label: 'Technicien',     cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/20' },
  utilisateur: { label: 'Utilisateur',    cls: 'bg-slate-500/15 text-slate-300 border border-slate-500/20' },
};

export default function Navbar() {
  const { userInfo, roles, hasRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard',    label: t('nav.dashboard'),    icon: '📊', roles: ['admin', 'manager'] },
    { to: '/vehicles',     label: t('nav.vehicles'),     icon: '🚗', roles: ['admin', 'manager', 'utilisateur'] },
    { to: '/conducteurs',  label: t('nav.conducteurs'),  icon: '👤', roles: ['admin', 'manager'] },
    { to: '/maintenance',  label: t('nav.maintenance'),  icon: '🔧', roles: ['admin', 'manager', 'technicien'] },
    { to: '/localisation', label: t('nav.localisation'), icon: '📍', roles: ['admin', 'manager'] },
  ];

  const visibleLinks = navLinks.filter((l) => l.roles.some((r) => hasRole(r)));
  const primaryRole  = ['admin', 'manager', 'technicien', 'utilisateur'].find((r) => roles.includes(r));
  const roleCfg      = ROLE_CONFIG[primaryRole] || null;
  const initial      = (userInfo?.preferred_username || '?')[0].toUpperCase();

  return (
    <>
      <nav className="bg-fleet-sidebar border-b border-fleet-border text-white relative z-40">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo — visible mobile only (sidebar shows it on desktop) */}
          <Link to="/dashboard" className="lg:hidden text-lg font-bold tracking-tight flex items-center gap-2 group">
            <span className="text-xl transition-transform group-hover:scale-110 duration-200 inline-block">🚗</span>
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              FleetManager
            </span>
          </Link>

          {/* Desktop spacer (sidebar handles nav) */}
          <div className="hidden lg:block flex-1" />

          {/* Tablet nav (md+, hidden on lg where sidebar takes over) */}
          <ul className="hidden md:flex lg:hidden gap-0.5">
            {visibleLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    location.pathname === l.to
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none">{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right: language switcher + user info + logout */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-700/60">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-violet-500/20">
                {initial}
              </div>
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
                className="text-xs bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-all px-3 py-1.5 rounded-lg ml-1"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
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

      {/* Mobile panel */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible'}`}
      >
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 bg-fleet-sidebar border-r border-fleet-border shadow-2xl transition-transform duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-fleet-border">
            <span className="text-white font-bold flex items-center gap-2">
              <span>🚗</span> FleetManager
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              ✕
            </button>
          </div>

          <div className="px-3 py-4 flex-1 overflow-y-auto">
            {roleCfg && (
              <div className="px-2 mb-4">
                <p className="text-slate-500 text-xs mb-1">{userInfo?.preferred_username}</p>
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
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{l.icon}</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Language switcher mobile */}
            <div className="mt-4 px-2">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-fleet-border">
            <button
              onClick={logout}
              className="w-full text-sm bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-300 font-medium py-2 rounded-xl transition-all"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
