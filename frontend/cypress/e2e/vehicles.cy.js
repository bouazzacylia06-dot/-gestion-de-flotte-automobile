/**
 * Suite E2E — CRUD Véhicules
 */
describe('Gestion des véhicules', () => {
  beforeEach(() => {
    cy.loginKeycloak(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS'));
    cy.visit('/vehicles');
    cy.contains('Véhicules', { timeout: 10000 }).should('be.visible');
  });

  it('liste des véhicules s\'affiche', () => {
    // La table ou le message "Aucun véhicule" doit être visible
    cy.get('table, [data-cy=empty]').should('exist');
  });

  it('admin peut ouvrir le formulaire de création', () => {
    cy.contains('button', 'Nouveau véhicule').should('be.visible').click();
    cy.contains('Nouveau véhicule').should('be.visible');
    cy.get('input[name="immatriculation"]').should('be.visible');
  });

  it('admin crée un véhicule et il apparaît dans la liste', () => {
    const immat = `TEST-${Date.now()}`;
    cy.contains('button', 'Nouveau véhicule').click();
    cy.get('input[name="immatriculation"]').type(immat);
    cy.get('input[name="marque"]').type('Renault');
    cy.get('input[name="modele"]').type('Kangoo');
    cy.contains('button', 'Enregistrer').click();
    cy.contains(immat, { timeout: 8000 }).should('be.visible');
  });

  it('utilisateur sans rôle admin ne voit pas le bouton Nouveau véhicule', () => {
    // On se déconnecte et on se reconnecte en tant qu'utilisateur
    cy.logoutKeycloak();
    cy.origin(Cypress.env('KEYCLOAK_URL'), { args: { u: Cypress.env('USER_USER'), p: Cypress.env('USER_PASS') } }, ({ u, p }) => {
      cy.get('#username').type(u);
      cy.get('#password').type(p);
      cy.get('#kc-login').click();
    });
    cy.visit('/vehicles');
    cy.contains('button', 'Nouveau véhicule').should('not.exist');
  });
});
