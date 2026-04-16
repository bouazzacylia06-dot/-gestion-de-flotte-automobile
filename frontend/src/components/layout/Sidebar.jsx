import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

const sections = [
  { to: '/dashboard',    icon: '📊', label: 'Dashboard',    roles: ['admin', 'manager'] },
  { to: '/vehicles',     icon: '🚗', label: 'Véhicules',     roles: ['admin', 'manager', 'utilisateur'] },
  { to: '/conducteurs',  icon: '👤', label: 'Conducteurs',   roles: ['admin', 'manager'] },
  { to: '/maintenance',  icon: '🔧', label: 'Maintenance',   roles: ['admin', 'manager', 'technicien'] },
  { to: '/localisation', icon: '📍', label: 'Localisation',  roles: ['admin', 'manager', 'utilisateur'] },
];

export default function Sidebar() {
  const { hasRole } = useAuth();
  const visible = sections.filter((s) => s.roles.some((r) => hasRole(r)));

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-gray-900 text-gray-300 min-h-screen pt-6">
      <nav>
        <ul className="space-y-1 px-2">
          {visible.map((s) => (
            <li key={s.to}>
              <NavLink
                to={s.to}
                end={s.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'hover:bg-gray-800'
                  }`
                }
              >
                <span className="text-lg">{s.icon}</span>
                {s.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
