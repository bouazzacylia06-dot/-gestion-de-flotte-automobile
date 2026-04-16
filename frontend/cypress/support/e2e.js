import './commands';
import 'cypress-axe'; // Tests d'accessibilité WCAG 2.1

// Ignore les erreurs non critiques provenant de Keycloak / Leaflet
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('keycloak') ||
    err.message.includes('Leaflet')
  ) {
    return false;
  }
});
