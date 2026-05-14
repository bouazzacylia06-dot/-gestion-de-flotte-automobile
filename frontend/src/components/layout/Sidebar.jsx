import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Sidebar() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();

  const sections = [
    { to: '/dashboard',    icon: '📊', label: t('nav.dashboard'),    roles: ['admin', 'manager'] },
    { to: '/vehicles',     icon: '🚗', label: t('nav.vehicles'),     roles: ['admin', 'manager', 'utilisateur'] },
    { to: '/conducteurs',  icon: '👤', label: t('nav.conducteurs'),  roles: ['admin', 'manager'] },
    { to: '/maintenance',  icon: '🔧', label: t('nav.maintenance'),  roles: ['admin', 'manager', 'technicien'] },
    { to: '/localisation', icon: '📍', label: t('nav.localisation'), roles: ['admin', 'manager', 'utilisateur'] },
  ];

  const visible = sections.filter((s) => s.roles.some((r) => hasRole(r)));

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-fleet-sidebar text-slate-400 min-h-screen border-r border-fleet-border flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-fleet-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-lg shadow-violet-500/25">
            🚗
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">FleetManager</p>
            <p className="text-slate-500 text-xs leading-tight mt-0.5">Gestion de flotte intelligente</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {visible.map((s) => (
            <li key={s.to}>
              <NavLink
                to={s.to}
                end={s.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/25 to-violet-500/5 text-white font-semibold border border-violet-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <span className="text-base leading-none">{s.icon}</span>
                {s.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Language switcher */}
      <div className="px-4 pb-3 border-t border-fleet-border pt-3">
        <LanguageSwitcher />
      </div>

      {/* Status */}
      <div className="px-4 py-4 border-t border-fleet-border">
        <div className="flex items-start gap-2.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0 mt-1" />
          <div>
            <p className="text-green-400 text-xs font-semibold">Système en ligne</p>
            <p className="text-slate-500 text-xs">Tous les services</p>
            <p className="text-slate-500 text-xs">Opérationnels</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
