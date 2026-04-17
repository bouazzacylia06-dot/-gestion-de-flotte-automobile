import { useEffect } from 'react';
import keycloak from '../keycloak';

export default function LoginPage() {
  useEffect(() => {
    // Si Keycloak est déjà initialisé, on déclenche le login
    if (keycloak.authenticated === false) {
      keycloak.login();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="text-center">
        <div className="text-5xl mb-4">🚗</div>
        <h1 className="text-2xl font-bold text-sky-700 mb-2">FleetManager</h1>
        <p className="text-gray-500 mb-6">Redirection vers l'authentification…</p>
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
