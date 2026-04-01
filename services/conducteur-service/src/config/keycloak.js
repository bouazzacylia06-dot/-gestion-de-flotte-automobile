/**
 * Configuration Keycloak pour le service conducteur
 */

const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'flotte-realm',
  'auth-server-url': process.env.KEYCLOAK_URL || 'http://localhost:8080',
  'ssl-required': process.env.KEYCLOAK_SSL_REQUIRED || 'none',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'conducteur-service',
  'public-client': false,
  'confidential-port': 0,
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret',
  },
};

module.exports = keycloakConfig;
