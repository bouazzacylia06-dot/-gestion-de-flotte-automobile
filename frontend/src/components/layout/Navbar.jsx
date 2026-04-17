import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

const navLinks = [
  { to: '/dashboard',    label: 'Dashboard',     roles: ['admin', 'manager'] },
  { to: '/vehicles',     label: 'Véhicules',      roles: ['admin', 'manager', 'utilisateur'] },
  { to: '/conducteurs',  label: 'Conducteurs',    roles: ['admin', 'manager'] },
  { to: '/maintenance',  label: 'Maintenance',    roles: ['admin', 'manager', 'technicien'] },
  { to: '/localisation', label: 'Localisation',   roles: ['admin', 'manager'] },
];

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  technicien: 'Technicien',
  utilisateur: 'Utilisateur',
};

const ROLE_COLORS = {
  admin:      'bg-red-100 text-red-700',
  manager:    'bg-blue-100 text-blue-700',
  technicien: 'bg-yellow-100 text-yellow-700',
  utilisateur:'bg-green-100 text-green-700',
};

export default function Navbar() {
  const { userInfo, roles, hasRole, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = navLinks.filter((l) => l.roles.some((r) => hasRole(r)));
  const primaryRole = ['admin', 'manager', 'technicien', 'utilisateur'].find((r) =>
    roles.includes(r)
  );

  return (
    <nav className="bg-sky-700 text-white shadow-md">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/dashboard" className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <span className="hidden sm:inline">FleetManager</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-1">
          {visibleLinks.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'bg-sky-900'
                    : 'hover:bg-sky-600'
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* User info + logout */}
        <div className="hidden md:flex items-center gap-3">
          {primaryRole && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[primaryRole]}`}
            >
              {ROLE_LABELS[primaryRole]}
            </span>
          )}
          <span className="text-sm">{userInfo?.preferred_username}</span>
          <button
            onClick={logout}
            className="text-xs bg-sky-900 hover:bg-red-600 transition-colors px-3 py-1.5 rounded"
          >
            Déconnexion
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded hover:bg-sky-600"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-sky-800 px-4 pb-4">
          <ul className="flex flex-col gap-1 mb-3">
            {visibleLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded text-sm ${
                    location.pathname === l.to ? 'bg-sky-900' : 'hover:bg-sky-600'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <span className="text-sm">{userInfo?.preferred_username}</span>
            <button
              onClick={logout}
              className="text-xs bg-sky-900 hover:bg-red-600 px-3 py-1.5 rounded"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
