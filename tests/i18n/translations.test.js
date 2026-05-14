// =============================================================================
// tests/i18n/translations.test.js
// Vérification de la complétude et cohérence des fichiers de traduction
// fr.json ↔ en.json — couvre TASK 2 (i18n) + TASK 3/4 (nouvelles clés)
// =============================================================================

const path = require('path');

const fr = require(path.join(__dirname, '../../frontend/src/i18n/fr.json'));
const en = require(path.join(__dirname, '../../frontend/src/i18n/en.json'));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Récupère toutes les feuilles d'un objet JSON sous forme "parent.enfant.cle" */
function getLeafKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, val]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    return typeof val === 'object' && val !== null && !Array.isArray(val)
      ? getLeafKeys(val, full)
      : [full];
  });
}

const frKeys = getLeafKeys(fr);
const enKeys = getLeafKeys(en);

// =============================================================================
describe('Structure des fichiers de traduction', () => {
// =============================================================================

  test('✅ fr.json et en.json ont le même nombre de clés', () => {
    expect(frKeys.length).toBe(enKeys.length);
  });

  test('✅ toutes les clés de en.json existent dans fr.json', () => {
    const missing = enKeys.filter((k) => !frKeys.includes(k));
    expect(missing).toEqual([]);
  });

  test('✅ toutes les clés de fr.json existent dans en.json', () => {
    const missing = frKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  test('✅ aucune valeur vide dans fr.json', () => {
    const empties = frKeys.filter((key) => {
      const parts = key.split('.');
      let val = fr;
      for (const p of parts) val = val?.[p];
      return val === '' || val === null || val === undefined;
    });
    expect(empties).toEqual([]);
  });

  test('✅ aucune valeur vide dans en.json', () => {
    const empties = enKeys.filter((key) => {
      const parts = key.split('.');
      let val = en;
      for (const p of parts) val = val?.[p];
      return val === '' || val === null || val === undefined;
    });
    expect(empties).toEqual([]);
  });
});

// =============================================================================
describe('Section nav (TASK 2 — Sidebar / Navbar)', () => {
// =============================================================================

  const NAV_KEYS = ['nav.dashboard', 'nav.vehicles', 'nav.conducteurs', 'nav.maintenance', 'nav.localisation', 'nav.logout'];

  test.each(NAV_KEYS)('✅ clé "%s" présente dans fr.json', (key) => {
    expect(frKeys).toContain(key);
  });

  test.each(NAV_KEYS)('✅ clé "%s" présente dans en.json', (key) => {
    expect(enKeys).toContain(key);
  });

  test('✅ nav.logout FR = "Déconnexion"', () => {
    expect(fr.nav.logout).toBe('Déconnexion');
  });

  test('✅ nav.logout EN = "Logout"', () => {
    expect(en.nav.logout).toBe('Logout');
  });
});

// =============================================================================
describe('Section dashboard (TASK 2)', () => {
// =============================================================================

  const DASHBOARD_KEYS = [
    'dashboard.title', 'dashboard.activeVehicles', 'dashboard.geoAlerts',
    'dashboard.plannedMaintenance', 'dashboard.activeDrivers', 'dashboard.realtimeData',
    'dashboard.recentActivity', 'dashboard.noRecentEvents', 'dashboard.events',
    'dashboard.subtitle.activeVehicles', 'dashboard.subtitle.geoAlerts',
    'dashboard.subtitle.maintenance', 'dashboard.subtitle.drivers',
  ];

  test.each(DASHBOARD_KEYS)('✅ "%s" présente dans les 2 langues', (key) => {
    expect(frKeys).toContain(key);
    expect(enKeys).toContain(key);
  });
});

// =============================================================================
describe('Section conducteurs — TASK 3 (assignation véhicule)', () => {
// =============================================================================

  test('✅ conducteurs.assignVehicle existe (FR + EN)', () => {
    expect(fr.conducteurs.assignVehicle).toBeDefined();
    expect(en.conducteurs.assignVehicle).toBeDefined();
    expect(fr.conducteurs.assignVehicle).not.toBe('');
    expect(en.conducteurs.assignVehicle).not.toBe('');
  });

  test('✅ conducteurs.noVehicle existe (FR + EN)', () => {
    expect(fr.conducteurs.noVehicle).toBeDefined();
    expect(en.conducteurs.noVehicle).toBeDefined();
  });

  test('✅ conducteurs.assignQuick existe (FR + EN)', () => {
    expect(fr.conducteurs.assignQuick).toBeDefined();
    expect(en.conducteurs.assignQuick).toBeDefined();
  });

  test('✅ conducteurs.assignedVehicleCol existe (FR + EN)', () => {
    expect(fr.conducteurs.assignedVehicleCol).toBeDefined();
    expect(en.conducteurs.assignedVehicleCol).toBeDefined();
  });

  const COND_KEYS = [
    'conducteurs.title', 'conducteurs.new', 'conducteurs.lastName', 'conducteurs.firstName',
    'conducteurs.license', 'conducteurs.status', 'conducteurs.actions',
    'conducteurs.search', 'conducteurs.noResults', 'conducteurs.noData',
  ];

  test.each(COND_KEYS)('✅ "%s" présente dans les 2 langues', (key) => {
    expect(frKeys).toContain(key);
    expect(enKeys).toContain(key);
  });
});

// =============================================================================
describe('Section localisation — TASK 4 (alertes géofencing)', () => {
// =============================================================================

  test('✅ localisation.addAlert est un objet non vide', () => {
    expect(typeof fr.localisation.addAlert).toBe('object');
    expect(typeof en.localisation.addAlert).toBe('object');
  });

  const ALERT_FORM_KEYS = [
    'localisation.addAlert.title', 'localisation.addAlert.vehicle', 'localisation.addAlert.type',
    'localisation.addAlert.zone',  'localisation.addAlert.lat',     'localisation.addAlert.lon',
    'localisation.addAlert.submit','localisation.addAlert.cancel',  'localisation.addAlert.success',
  ];

  test.each(ALERT_FORM_KEYS)('✅ "%s" présente dans les 2 langues', (key) => {
    expect(frKeys).toContain(key);
    expect(enKeys).toContain(key);
  });

  test.each(['ZONE_EXIT', 'FORBIDDEN', 'SPEED'])('✅ type d\'alerte "%s" traduit FR + EN', (type) => {
    expect(fr.localisation.addAlert.types[type]).toBeDefined();
    expect(en.localisation.addAlert.types[type]).toBeDefined();
    expect(fr.localisation.addAlert.types[type]).not.toBe('');
    expect(en.localisation.addAlert.types[type]).not.toBe('');
  });

  const LOC_KEYS = [
    'localisation.title', 'localisation.realtimeUpdate', 'localisation.alerts',
    'localisation.alertsLast24h', 'localisation.noAlerts', 'localisation.outOfZone',
    'localisation.planned', 'localisation.noPlanned',
    'localisation.legend.inService', 'localisation.legend.available',
    'localisation.legend.outOfZone', 'localisation.legend.maintenance', 'localisation.legend.inactive',
  ];

  test.each(LOC_KEYS)('✅ "%s" présente dans les 2 langues', (key) => {
    expect(frKeys).toContain(key);
    expect(enKeys).toContain(key);
  });
});

// =============================================================================
describe('Section maintenance (TASK 2)', () => {
// =============================================================================

  const MAINT_KEYS = [
    'maintenance.title', 'maintenance.planned', 'maintenance.inProgress', 'maintenance.done',
    'maintenance.report', 'maintenance.type', 'maintenance.cost', 'maintenance.date',
    'maintenance.vehicle', 'maintenance.viewTable', 'maintenance.viewKanban',
    'maintenance.editBtn', 'maintenance.deleteBtn', 'maintenance.confirmDelete',
  ];

  test.each(MAINT_KEYS)('✅ "%s" présente dans les 2 langues', (key) => {
    expect(frKeys).toContain(key);
    expect(enKeys).toContain(key);
  });
});

// =============================================================================
describe('Section vehicles (TASK 2)', () => {
// =============================================================================

  const VEHICLE_KEYS = [
    'vehicles.title', 'vehicles.new', 'vehicles.plate', 'vehicles.brand', 'vehicles.model',
    'vehicles.status', 'vehicles.maintenance', 'vehicles.confirmDelete',
    'vehicles.editVehicle', 'vehicles.noVehicles',
  ];

  test.each(VEHICLE_KEYS)('✅ "%s" présente dans les 2 langues', (key) => {
    expect(frKeys).toContain(key);
    expect(enKeys).toContain(key);
  });
});
