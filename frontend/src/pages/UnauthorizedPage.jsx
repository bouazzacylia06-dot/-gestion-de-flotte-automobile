import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function UnauthorizedPage() {
  const { userInfo, roles, hasRole } = useAuth();
  const home = (hasRole('admin') || hasRole('manager')) ? '/dashboard'
    : hasRole('technicien') ? '/maintenance'
    : '/vehicles';

  return (
    <div className="min-h-screen flex items-center justify-center bg-fleet-bg">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
          🚫
        </div>
        <h1 className="text-2xl font-bold text-red-400 mb-2">Accès refusé</h1>
        <p className="text-slate-300 mb-1">
          Bonjour <span className="font-medium text-white">{userInfo?.preferred_username}</span>,
        </p>
        <p className="text-slate-400 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          {roles.length > 0 && (
            <> (Rôle actuel : <span className="font-medium text-slate-300">{roles.join(', ')}</span>)</>
          )}
        </p>
        <Link
          to={home}
          className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-2 rounded-xl transition-all"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
