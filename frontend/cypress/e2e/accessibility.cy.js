// accessibility.cy.js — Tests d'accessibilité WCAG 2.1 Niveau AA
// Prérequis: npm install --save-dev cypress-axe axe-core
// Ajouter 'import "cypress-axe"' dans cypress/support/e2e.js

describe('Accessibilité WCAG 2.1 — Fleet Management', () => {
  const A11Y_CONFIG = {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    rules: {
      'color-contrast':                { enabled: true },
      'label':                         { enabled: true },
      'aria-required-attr':            { enabled: true },
      'button-name':                   { enabled: true },
      'image-alt':                     { enabled: true },
      'skip-link':                     { enabled: true },
    },
  };

  function logViolations(violations) {
    violations.forEach((v) => {
      cy.log(`❌ WCAG ${v.id} [${v.impact}]: ${v.description}`);
      v.nodes.forEach((node) => cy.log(`  → ${node.html}`));
    });
  }

  // ── PAGE DE LOGIN ─────────────────────────────────────────────────────
  describe('Page de connexion', () => {
    it('Page login : pas de violations WCAG critiques', () => {
      cy.visit('/login');
      cy.injectAxe();
      cy.checkA11y(null, A11Y_CONFIG, logViolations);
    });
  });

  // ── PAGES AUTHENTIFIÉES ───────────────────────────────────────────────
  describe('Pages authentifiées', () => {
    beforeEach(() => {
      // Utiliser la commande custom loginKeycloak définie dans commands.js
      cy.loginKeycloak?.('admin', 'admin123');
    });

    it('Dashboard : pas de violations WCAG critiques', () => {
      cy.visit('/');
      cy.injectAxe();
      cy.checkA11y(null, A11Y_CONFIG, logViolations);
    });

    it('Page Véhicules : tableaux et formulaires accessibles', () => {
      cy.visit('/vehicles');
      cy.injectAxe();
      cy.checkA11y(null, A11Y_CONFIG, logViolations);
    });

    it('Page Conducteurs : accessibilité OK', () => {
      cy.visit('/conducteurs');
      cy.injectAxe();
      cy.checkA11y(null, A11Y_CONFIG, logViolations);
    });

    it('Page Maintenance : accessibilité OK', () => {
      cy.visit('/maintenance');
      cy.injectAxe();
      cy.checkA11y(null, A11Y_CONFIG, logViolations);
    });
  });

  // ── NAVIGATION CLAVIER ────────────────────────────────────────────────
  describe('Navigation au clavier', () => {
    it('Le skip-link est le premier élément focusable', () => {
      cy.visit('/');
      cy.get('body').focus();
      cy.realPress('Tab');
      cy.focused().should('contain.text', 'Aller au contenu');
    });

    it('La navigation se fait entièrement au clavier (Tab)', () => {
      cy.visit('/');
      // Tab 3 fois et vérifier que le focus reste visible
      cy.realPress('Tab');
      cy.realPress('Tab');
      cy.realPress('Tab');
      cy.focused().should('be.visible');
    });
  });

  // ── CONTRASTE DES COULEURS ────────────────────────────────────────────
  describe('Contraste des couleurs (WCAG 1.4.3)', () => {
    it('Ratio de contraste ≥ 4.5:1 sur le dashboard', () => {
      cy.visit('/');
      cy.injectAxe();
      cy.checkA11y(null, {
        runOnly: { type: 'rule', values: ['color-contrast'] },
      }, logViolations);
    });
  });

  // ── FORMULAIRES ───────────────────────────────────────────────────────
  describe('Accessibilité des formulaires', () => {
    it('Tous les champs ont un label associé', () => {
      cy.visit('/vehicles');
      cy.injectAxe();
      cy.checkA11y('form, [role="dialog"]', {
        runOnly: { type: 'rule', values: ['label', 'aria-required-attr'] },
      }, logViolations);
    });
  });
});
