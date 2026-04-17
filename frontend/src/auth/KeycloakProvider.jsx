import { createContext, useContext, useEffect, useState } from 'react';
import keycloak from '../keycloak';

const KeycloakContext = createContext(null);

// Verrou module-level : évite la double initialisation en React 18 StrictMode
let _initPromise = null;

export function KeycloakProvider({ children }) {
  const [state, setState] = useState({
    authenticated: false,
    token: null,
    userInfo: null,
    roles: [],
    initialized: false,
  });

  useEffect(() => {
    // Si déjà en cours d'init (double appel StrictMode), on attend la même promesse
    if (!_initPromise) {
      _initPromise = keycloak.init({ onLoad: 'login-required', checkLoginIframe: false });
    }

    let refreshInterval = null;

    _initPromise
      .then((authenticated) => {
        const roles =
          keycloak.tokenParsed?.realm_access?.roles?.filter(
            (r) => ['admin', 'manager', 'technicien', 'utilisateur'].includes(r)
          ) || [];

        setState({
          authenticated,
          token: keycloak.token,
          userInfo: {
            name: keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || '',
            email: keycloak.tokenParsed?.email || '',
            preferred_username: keycloak.tokenParsed?.preferred_username || '',
          },
          roles,
          initialized: true,
        });

        // Rafraîchit le token automatiquement avant expiration
        refreshInterval = setInterval(() => {
          keycloak.updateToken(70).catch(() => {
            keycloak.logout();
          });
        }, 60000);
      })
      .catch(() => {
        setState((s) => ({ ...s, initialized: true }));
      });

    return () => { if (refreshInterval) clearInterval(refreshInterval); };
  }, []);

  if (!state.initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 text-sm">Connexion en cours…</span>
        </div>
      </div>
    );
  }

  return (
    <KeycloakContext.Provider value={{ keycloak, ...state }}>
      {children}
    </KeycloakContext.Provider>
  );
}

export function useKeycloak() {
  const ctx = useContext(KeycloakContext);
  if (!ctx) throw new Error('useKeycloak must be used inside KeycloakProvider');
  return ctx;
}
