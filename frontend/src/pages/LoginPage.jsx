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
    <div className="min-h-screen flex items-center justify-center bg-fleet-bg">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-violet-500/25">
          🚗
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">FleetManager</h1>
        <p className="text-slate-400 mb-6">Redirection vers l'authentification…</p>
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
