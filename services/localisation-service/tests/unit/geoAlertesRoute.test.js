// =============================================================================
// tests/unit/geoAlertesRoute.test.js
// Tests unitaires pour POST /localisations/geo-alerts (TASK 4)
// Reproduit la logique de l'endpoint dans un mini-app de test isolé
// pour éviter de bootstrapper gRPC + Kafka + TimescaleDB
// =============================================================================

// Mocks hoistés avant tout require()
jest.mock('../../src/repositories/localisationRepository', () => ({
  saveGeoAlert:       jest.fn().mockResolvedValue(undefined),
  getRecentGeoAlerts: jest.fn(),
}));

const express    = require('express');
const request    = require('supertest');
const repository = require('../../src/repositories/localisationRepository');

// ─── Mini-app identique à l'endpoint dans app.js ──────────────────────────────
function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.post('/localisations/geo-alerts', async (req, res) => {
    const { vehicleId, type, zoneId, latitude, longitude } = req.body;
    if (!vehicleId || !type) {
      return res.status(400).json({ message: 'vehicleId et type requis' });
    }
    const validTypes = ['ZONE_EXIT', 'FORBIDDEN', 'SPEED'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `type doit être parmi : ${validTypes.join(', ')}` });
    }
    try {
      await repository.saveGeoAlert(
        vehicleId,
        zoneId || null,
        type,
        latitude  != null ? parseFloat(latitude)  : null,
        longitude != null ? parseFloat(longitude) : null
      );
      const alerts = await repository.getRecentGeoAlerts(1);
      return res.status(201).json(alerts[0] || { vehicleId, type });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return app;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALERT_RESPONSE = {
  id:        'alert-uuid-001',
  vehicleId: 'v-001',
  zoneId:    'zone-A',
  type:      'ZONE_EXIT',
  latitude:  49.44,
  longitude: 1.09,
  createdAt: '2025-01-01T12:00:00.000Z',
};

let app;

beforeAll(() => {
  app = buildTestApp();
});

beforeEach(() => {
  jest.clearAllMocks();
  repository.getRecentGeoAlerts.mockResolvedValue([ALERT_RESPONSE]);
});

// =============================================================================
describe('POST /localisations/geo-alerts — TASK 4', () => {
// =============================================================================

  describe('Cas nominaux', () => {

    test('✅ ZONE_EXIT crée une alerte et retourne 201', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001', type: 'ZONE_EXIT', zoneId: 'zone-A', latitude: 49.44, longitude: 1.09 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ vehicleId: 'v-001', type: 'ZONE_EXIT' });
    });

    test('✅ FORBIDDEN est un type valide', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-002', type: 'FORBIDDEN' });
      expect(res.status).toBe(201);
    });

    test('✅ SPEED est un type valide', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-003', type: 'SPEED' });
      expect(res.status).toBe(201);
    });

    test('✅ champs optionnels (zoneId, lat, lon) peuvent être absents', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-004', type: 'ZONE_EXIT' });
      expect(res.status).toBe(201);
    });

    test('✅ saveGeoAlert appelé avec null pour champs optionnels manquants', async () => {
      await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-005', type: 'SPEED' });

      expect(repository.saveGeoAlert).toHaveBeenCalledWith('v-005', null, 'SPEED', null, null);
    });

    test('✅ saveGeoAlert appelé avec les coordonnées parsées en float', async () => {
      await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-006', type: 'FORBIDDEN', latitude: '49.44', longitude: '1.09' });

      const [, , , lat, lon] = repository.saveGeoAlert.mock.calls[0];
      expect(lat).toBe(49.44);
      expect(lon).toBe(1.09);
    });

    test('✅ saveGeoAlert appelé avec zoneId quand fourni', async () => {
      await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-007', type: 'ZONE_EXIT', zoneId: 'zone-nord' });

      expect(repository.saveGeoAlert).toHaveBeenCalledWith('v-007', 'zone-nord', 'ZONE_EXIT', null, null);
    });

    test('✅ retourne le résultat de getRecentGeoAlerts(1)', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001', type: 'ZONE_EXIT' });
      expect(res.body).toEqual(ALERT_RESPONSE);
    });

    test('✅ getRecentGeoAlerts appelé avec limit=1 après insertion', async () => {
      await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001', type: 'ZONE_EXIT' });
      expect(repository.getRecentGeoAlerts).toHaveBeenCalledWith(1);
    });
  });

  describe('Validations (400)', () => {

    test('❌ 400 si vehicleId manquant', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ type: 'ZONE_EXIT' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/vehicleId/);
    });

    test('❌ 400 si type manquant', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/type/);
    });

    test('❌ 400 si body vide', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({});
      expect(res.status).toBe(400);
    });

    test('❌ 400 si type invalide (ex: UNKNOWN)', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001', type: 'UNKNOWN' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ZONE_EXIT/);
    });

    test('❌ 400 si type invalide (ex: zone_exit minuscule)', async () => {
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001', type: 'zone_exit' });
      expect(res.status).toBe(400);
    });

    test('❌ saveGeoAlert NON appelé en cas d\'erreur de validation', async () => {
      await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001', type: 'INVALID' });
      expect(repository.saveGeoAlert).not.toHaveBeenCalled();
    });
  });

  describe('Gestion des erreurs DB (500)', () => {

    test('❌ 500 si saveGeoAlert lève une erreur', async () => {
      repository.saveGeoAlert.mockRejectedValueOnce(new Error('DB connection failed'));
      const res = await request(app)
        .post('/localisations/geo-alerts')
        .send({ vehicleId: 'v-001', type: 'ZONE_EXIT' });
      expect(res.status).toBe(500);
      expect(res.body.message).toBe('DB connection failed');
    });
  });
});

// =============================================================================
describe('localisationRepository — saveGeoAlert() (TASK 4)', () => {
// =============================================================================

  test('✅ saveGeoAlert est appelé une seule fois par requête valide', async () => {
    await request(app)
      .post('/localisations/geo-alerts')
      .send({ vehicleId: 'v-001', type: 'FORBIDDEN', zoneId: 'zone-A' });
    expect(repository.saveGeoAlert).toHaveBeenCalledTimes(1);
  });

  test('✅ saveGeoAlert reçoit les 5 paramètres dans le bon ordre', async () => {
    await request(app)
      .post('/localisations/geo-alerts')
      .send({ vehicleId: 'v-x', type: 'SPEED', zoneId: 'Z1', latitude: 49.0, longitude: 1.0 });

    const call = repository.saveGeoAlert.mock.calls[0];
    expect(call[0]).toBe('v-x');     // vehicleId
    expect(call[1]).toBe('Z1');      // zoneId
    expect(call[2]).toBe('SPEED');   // type
    expect(call[3]).toBe(49.0);      // latitude
    expect(call[4]).toBe(1.0);       // longitude
  });
});
