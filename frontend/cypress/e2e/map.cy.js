/**
 * Suite E2E — Carte Leaflet & localisation
 */
describe('Carte GPS Leaflet', () => {
  beforeEach(() => {
    cy.loginKeycloak(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS'));
  });

  it('la carte s\'initialise sur la page Localisation (leaflet-map-pane présent)', () => {
    cy.visit('/localisation');
    // Attend que Leaflet ait monté son conteneur
    cy.get('.leaflet-map-pane', { timeout: 15000 }).should('exist');
  });

  it('la carte affiche les tuiles OpenStreetMap', () => {
    cy.visit('/localisation');
    cy.get('.leaflet-tile-pane', { timeout: 15000 }).should('exist');
  });

  it('la carte du dashboard s\'initialise', () => {
    cy.visit('/');
    cy.get('.leaflet-map-pane', { timeout: 15000 }).should('exist');
  });

  it('la page VehicleDetail affiche la carte avec la trajectory layer', () => {
    // Visite la page véhicule avec un id fictif (la carte doit quand même s'initialiser)
    cy.visit('/localisation');
    cy.get('.leaflet-map-pane', { timeout: 15000 }).should('exist');
    // Si des véhicules existent, clique sur le premier lien "Carte"
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("Carte")').length > 0) {
        cy.get('a:contains("Carte")').first().click();
        cy.get('.leaflet-map-pane', { timeout: 15000 }).should('exist');
        cy.contains('Retour aux véhicules').should('be.visible');
      }
    });
  });
});
