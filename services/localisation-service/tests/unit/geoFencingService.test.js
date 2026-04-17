// =============================================================================
// tests/unit/geoFencingService.test.js
// =============================================================================

// jest.mock() est hoisted avant les require() par Jest
jest.mock('../../src/kafka/producer', () => ({
  publishGeoAlert: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/repositories/localisationRepository', () => ({
  getActiveZones: jest.fn().mockResolvedValue([]),
  saveGeoAlert:   jest.fn().mockResolvedValue(undefined),
}));

const {
  pointInPolygon,
  checkZoneCrossing,
  _setZonesForTest,
  _resetVehicleStateForTest,
} = require('../../src/services/geoFencingService');

const kafkaProducer = require('../../src/kafka/producer');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Zone rectangulaire : longitude [1.05–1.09], latitude [49.43–49.47]
// Rappel GeoJSON : [longitude, latitude] — ordre inverse de la convention GPS !
const AUTHORIZED_ZONE = {
  id:   'zone-auth-001',
  name: 'Zone Autorisée Test',
  type: 'AUTHORIZED',
  polygon: {
    type: 'Polygon',
    coordinates: [[[1.05, 49.43], [1.09, 49.43], [1.09, 49.47], [1.05, 49.47], [1.05, 49.43]]],
  },
};

const FORBIDDEN_ZONE = {
  id:   'zone-forb-001',
  name: 'Zone Interdite Test',
  type: 'FORBIDDEN',
  polygon: {
    type: 'Polygon',
    coordinates: [[[1.10, 49.44], [1.12, 49.44], [1.12, 49.46], [1.10, 49.46], [1.10, 49.44]]],
  },
};

// Point au centre de AUTHORIZED_ZONE
const INSIDE_POINT  = { lat: 49.45, lon: 1.07 };
// Point clairement hors des deux zones
const OUTSIDE_POINT = { lat: 49.50, lon: 1.20 };
// Point au centre de FORBIDDEN_ZONE
const FORBIDDEN_POINT = { lat: 49.45, lon: 1.11 };

// =============================================================================
describe('GeoFencingService — pointInPolygon()', () => {
// =============================================================================

  test('✅ point au centre de la zone → true', () => {
    expect(pointInPolygon(INSIDE_POINT.lat, INSIDE_POINT.lon, AUTHORIZED_ZONE.polygon.coordinates)).toBe(true);
  });

  test('✅ point clairement hors zone → false', () => {
    expect(pointInPolygon(OUTSIDE_POINT.lat, OUTSIDE_POINT.lon, AUTHORIZED_ZONE.polygon.coordinates)).toBe(false);
  });

  test('✅ point au centre de la zone interdite → true', () => {
    expect(pointInPolygon(FORBIDDEN_POINT.lat, FORBIDDEN_POINT.lon, FORBIDDEN_ZONE.polygon.coordinates)).toBe(true);
  });

  test('✅ même point hors zone autorisée → false', () => {
    expect(pointInPolygon(FORBIDDEN_POINT.lat, FORBIDDEN_POINT.lon, AUTHORIZED_ZONE.polygon.coordinates)).toBe(false);
  });

  test('✅ résultat booléen garanti (pas de undefined)', () => {
    const result = pointInPolygon(49.45, 1.07, AUTHORIZED_ZONE.polygon.coordinates);
    expect(typeof result).toBe('boolean');
  });

  test('✅ point sur le coin du polygone — résultat déterministe', () => {
    // Les coins peuvent être inside ou outside selon l'implémentation —
    // l'important est que le résultat soit toujours le même.
    const r1 = pointInPolygon(49.43, 1.05, AUTHORIZED_ZONE.polygon.coordinates);
    const r2 = pointInPolygon(49.43, 1.05, AUTHORIZED_ZONE.polygon.coordinates);
    expect(r1).toBe(r2);
  });
});

// =============================================================================
describe('GeoFencingService — checkZoneCrossing()', () => {
// =============================================================================

  beforeEach(() => {
    _resetVehicleStateForTest();
    jest.clearAllMocks();
  });

  test('✅ premier point DANS la zone → ZONE_ENTRY publiée', async () => {
    _setZonesForTest([AUTHORIZED_ZONE]);

    await checkZoneCrossing({
      vehicleId: 'veh-001',
      latitude:  INSIDE_POINT.lat,
      longitude: INSIDE_POINT.lon,
      timestamp: Date.now(),
    });

    expect(kafkaProducer.publishGeoAlert).toHaveBeenCalledTimes(1);
    expect(kafkaProducer.publishGeoAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type:      'ZONE_ENTRY',
        vehicleId: 'veh-001',
        zoneId:    AUTHORIZED_ZONE.id,
      })
    );
  });

  test('✅ même zone deux fois consécutives → pas de double ZONE_ENTRY', async () => {
    _setZonesForTest([AUTHORIZED_ZONE]);
    const pos = { vehicleId: 'veh-002', latitude: INSIDE_POINT.lat, longitude: INSIDE_POINT.lon, timestamp: Date.now() };

    await checkZoneCrossing(pos);
    await checkZoneCrossing(pos);

    expect(kafkaProducer.publishGeoAlert).toHaveBeenCalledTimes(1);
  });

  test('✅ entrée puis sortie → ZONE_ENTRY + ZONE_EXIT publiées', async () => {
    _setZonesForTest([AUTHORIZED_ZONE]);

    await checkZoneCrossing({ vehicleId: 'veh-003', latitude: INSIDE_POINT.lat, longitude: INSIDE_POINT.lon, timestamp: Date.now() });
    await checkZoneCrossing({ vehicleId: 'veh-003', latitude: OUTSIDE_POINT.lat, longitude: OUTSIDE_POINT.lon, timestamp: Date.now() });

    const types = kafkaProducer.publishGeoAlert.mock.calls.map((c) => c[0].type);
    expect(types).toContain('ZONE_ENTRY');
    expect(types).toContain('ZONE_EXIT');
    expect(kafkaProducer.publishGeoAlert).toHaveBeenCalledTimes(2);
  });

  test('✅ aucune zone configurée → aucune alerte', async () => {
    _setZonesForTest([]);

    await checkZoneCrossing({ vehicleId: 'veh-004', latitude: INSIDE_POINT.lat, longitude: INSIDE_POINT.lon, timestamp: Date.now() });

    expect(kafkaProducer.publishGeoAlert).not.toHaveBeenCalled();
  });

  test('✅ entrée dans zone interdite → alerte avec zoneType=FORBIDDEN', async () => {
    _setZonesForTest([FORBIDDEN_ZONE]);

    await checkZoneCrossing({
      vehicleId: 'veh-005',
      latitude:  FORBIDDEN_POINT.lat,
      longitude: FORBIDDEN_POINT.lon,
      timestamp: Date.now(),
    });

    expect(kafkaProducer.publishGeoAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type:     'ZONE_ENTRY',
        zoneType: 'FORBIDDEN',
      })
    );
  });

  test('✅ deux véhicules indépendants — états non mixés', async () => {
    _setZonesForTest([AUTHORIZED_ZONE]);

    // Véhicule A entre dans la zone
    await checkZoneCrossing({ vehicleId: 'veh-A', latitude: INSIDE_POINT.lat, longitude: INSIDE_POINT.lon, timestamp: Date.now() });
    // Véhicule B est hors zone dès le début
    await checkZoneCrossing({ vehicleId: 'veh-B', latitude: OUTSIDE_POINT.lat, longitude: OUTSIDE_POINT.lon, timestamp: Date.now() });

    // Seul véhicule A a déclenché une alerte
    expect(kafkaProducer.publishGeoAlert).toHaveBeenCalledTimes(1);
    expect(kafkaProducer.publishGeoAlert.mock.calls[0][0].vehicleId).toBe('veh-A');
  });

  test('✅ alerte contient position complète', async () => {
    _setZonesForTest([AUTHORIZED_ZONE]);

    await checkZoneCrossing({
      vehicleId: 'veh-006',
      latitude:  INSIDE_POINT.lat,
      longitude: INSIDE_POINT.lon,
      timestamp: 1700000000000,
    });

    expect(kafkaProducer.publishGeoAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { latitude: INSIDE_POINT.lat, longitude: INSIDE_POINT.lon },
        timestamp: 1700000000000,
      })
    );
  });
});
