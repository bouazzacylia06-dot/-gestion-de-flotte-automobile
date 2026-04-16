import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function UnauthorizedPage() {
  const { userInfo, roles, hasRole } = useAuth();
  const home = (hasRole('admin') || hasRole('manager')) ? '/dashboard'
    : hasRole('technicien') ? '/maintenance'
    : '/vehicles';

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Accès refusé</h1>
        <p className="text-gray-600 mb-1">
          Bonjour <span className="font-medium">{userInfo?.preferred_username}</span>,
        </p>
        <p className="text-gray-500 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          {roles.length > 0 && (
            <> (Rôle actuel : <span className="font-medium">{roles.join(', ')}</span>)</>
          )}
        </p>
        <Link
          to={home}
          className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-medium px-6 py-2 rounded-lg"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
