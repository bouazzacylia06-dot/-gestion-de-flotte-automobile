import { useKeycloak } from './KeycloakProvider';

/**
 * Hook centralisé pour l'authentification.
 * Retourne :
 *   isAuthenticated, token, userInfo, roles, hasRole(role), logout()
 */
export function useAuth() {
  const { keycloak, authenticated, token, userInfo, roles } = useKeycloak();

  return {
    isAuthenticated: authenticated,
    token,
    userInfo,
    roles,
    hasRole: (role) => roles.includes(role),
    logout: () =>
      keycloak.logout({ redirectUri: window.location.origin }),
  };
}
