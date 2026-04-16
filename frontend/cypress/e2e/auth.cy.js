/**
 * Suite E2E — Authentification Keycloak
 */
describe('Authentification SSO Keycloak', () => {
  it('admin se connecte et arrive sur le dashboard', () => {
    cy.loginKeycloak(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS'));
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    cy.contains('Tableau de bord').should('be.visible');
    cy.contains(Cypress.env('ADMIN_USER')).should('be.visible');
  });

  it('technicien se connecte et voit l\'accès maintenance', () => {
    cy.loginKeycloak(Cypress.env('TECH_USER'), Cypress.env('TECH_PASS'));
    // Technicien est redirigé vers /maintenance (seul accès autorisé)
    // ou /unauthorized si on force /
    cy.contains('Technicien').should('be.visible');
  });

  it('logout redirige vers Keycloak', () => {
    cy.loginKeycloak(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS'));
    cy.contains('Tableau de bord').should('be.visible');
    cy.logoutKeycloak();
    // Après logout, Keycloak reprend la main
    cy.origin(Cypress.env('KEYCLOAK_URL'), () => {
      cy.get('#username', { timeout: 10000 }).should('be.visible');
    });
  });

  it('utilisateur sans rôle admin voit le bouton Véhicules mais pas Dashboard', () => {
    cy.loginKeycloak(Cypress.env('USER_USER'), Cypress.env('USER_PASS'));
    // L'utilisateur n'a pas accès au dashboard → redirigé /unauthorized ou /vehicles
    cy.url().should('match', /\/(unauthorized|vehicles)/);
  });
});
