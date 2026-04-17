import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    experimentalModifyObstructiveThirdPartyCode: true,
  },
  env: {
    KEYCLOAK_URL: 'http://localhost:8080',
    KEYCLOAK_REALM: 'flotte',
    ADMIN_USER:   'admin',
    ADMIN_PASS:   'admin123',
    TECH_USER:    'technicien',
    TECH_PASS:    'tech123',
    MANAGER_USER: 'manager',
    MANAGER_PASS: 'manager123',
    USER_USER:    'utilisateur',
    USER_PASS:    'user123',
  },
});
