/**
 * Suite E2E — RBAC (contrôle d'accès par rôle)
 */
describe('Contrôle d\'accès par rôle (RBAC)', () => {
  it('technicien accède à /maintenance', () => {
    cy.loginKeycloak(Cypress.env('TECH_USER'), Cypress.env('TECH_PASS'));
    cy.visit('/maintenance');
    cy.contains('Maintenance', { timeout: 10000 }).should('be.visible');
  });

  it('technicien tente d\'accéder à /conducteurs → redirigé /unauthorized', () => {
    cy.loginKeycloak(Cypress.env('TECH_USER'), Cypress.env('TECH_PASS'));
    cy.visit('/conducteurs');
    cy.url({ timeout: 8000 }).should('include', '/unauthorized');
    cy.contains('Accès refusé').should('be.visible');
  });

  it('manager accède à /localisation → carte visible', () => {
    cy.loginKeycloak(Cypress.env('MANAGER_USER'), Cypress.env('MANAGER_PASS'));
    cy.visit('/localisation');
    cy.contains('Localisation temps réel', { timeout: 10000 }).should('be.visible');
  });

  it('utilisateur tente d\'accéder à /conducteurs → redirigé /unauthorized', () => {
    cy.loginKeycloak(Cypress.env('USER_USER'), Cypress.env('USER_PASS'));
    cy.visit('/conducteurs');
    cy.url({ timeout: 8000 }).should('include', '/unauthorized');
    cy.contains('Accès refusé').should('be.visible');
  });

  it('manager ne voit pas le bouton "Nouveau véhicule" (rôle admin requis)', () => {
    cy.loginKeycloak(Cypress.env('MANAGER_USER'), Cypress.env('MANAGER_PASS'));
    cy.visit('/vehicles');
    cy.contains('Véhicules', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Nouveau véhicule').should('not.exist');
  });
});
