/**
 * cy.loginKeycloak(username, password)
 * Login via l'UI Keycloak (SSO classique) puis retour sur l'app.
 */
Cypress.Commands.add('loginKeycloak', (username, password) => {
  cy.visit('/');

  // Keycloak redirige automatiquement vers sa page de login (login-required)
  cy.origin(
    Cypress.env('KEYCLOAK_URL'),
    { args: { username, password } },
    ({ username, password }) => {
      cy.get('#username', { timeout: 10000 }).should('be.visible').clear().type(username);
      cy.get('#password').clear().type(password);
      cy.get('#kc-login').click();
    }
  );

  // Attend le retour sur l'app
  cy.url({ timeout: 15000 }).should('include', Cypress.config('baseUrl').replace('http://', '').replace('https://', ''));
});

/**
 * cy.logoutKeycloak()
 * Clique sur le bouton Déconnexion dans la navbar.
 */
Cypress.Commands.add('logoutKeycloak', () => {
  cy.contains('button', 'Déconnexion').click();
});
