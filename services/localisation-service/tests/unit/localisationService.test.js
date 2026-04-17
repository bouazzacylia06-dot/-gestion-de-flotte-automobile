// =============================================================================
// tests/unit/localisationService.test.js
// =============================================================================

jest.mock('../../src/repositories/localisationRepository', () => ({
  savePosition:       jest.fn().mockResolvedValue(undefined),
  getHistory:         jest.fn().mockResolvedValue([]),
  getLastPosition:    jest.fn().mockResolvedValue(null),
  getHourlyAverage:   jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/services/geoFencingService', () => ({
  checkZoneCrossing: jest.fn().mockResolvedValue(undefined),
}));

const service    = require('../../src/services/localisationService');
const repository = require('../../src/repositories/localisationRepository');
const geoFencing = require('../../src/services/geoFencingService');

const VALID_FRAME = {
  vehicle_id: 'v-001',
  latitude:   49.44,
  longitude:   1.09,
  speed:      50,
  heading:    90,
  timestamp:  Date.now(),
};

// =============================================================================
describe('localisationService — processGPSFrame()', () => {
// =============================================================================

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('✅ frame valide → accepted=true', async () => {
    const r = await service.processGPSFrame(VALID_FRAME);
    expect(r.accepted).toBe(true);
  });

  test('✅ frame valide → savePosition appelé une fois', async () => {
    await service.processGPSFrame(VALID_FRAME);
    expect(repository.savePosition).toHaveBeenCalledTimes(1);
  });

  test('✅ frame valide → checkZoneCrossing déclenché (fire-and-forget)', async () => {
    await service.processGPSFrame(VALID_FRAME);
    // fire-and-forget : on laisse la promesse se résoudre
    await Promise.resolve();
    expect(geoFencing.checkZoneCrossing).toHaveBeenCalledTimes(1);
  });

  test('✅ normalisation snake_case → camelCase (vehicle_id → vehicleId)', async () => {
    await service.processGPSFrame(VALID_FRAME);
    const savedArg = repository.savePosition.mock.calls[0][0];
    expect(savedArg).toHaveProperty('vehicleId', 'v-001');
    expect(savedArg).not.toHaveProperty('vehicle_id');
  });

  test('❌ latitude hors bornes → accepted=false, savePosition non appelé', async () => {
    const r = await service.processGPSFrame({ ...VALID_FRAME, latitude: 999 });
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/latitude/i);
    expect(repository.savePosition).not.toHaveBeenCalled();
  });

  test('❌ vehicleId vide → accepted=false', async () => {
    const r = await service.processGPSFrame({ ...VALID_FRAME, vehicle_id: '' });
    expect(r.accepted).toBe(false);
    expect(repository.savePosition).not.toHaveBeenCalled();
  });

  test('❌ vitesse > 250 → accepted=false', async () => {
    const r = await service.processGPSFrame({ ...VALID_FRAME, speed: 300 });
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/vitesse aberrante/i);
  });

  test('❌ longitude invalide → accepted=false', async () => {
    const r = await service.processGPSFrame({ ...VALID_FRAME, longitude: 200 });
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/longitude/i);
  });

  test('✅ erreur DB silencieuse → accepted=true quand même (non bloquant)', async () => {
    repository.savePosition.mockRejectedValueOnce(new Error('DB timeout'));
    const r = await service.processGPSFrame(VALID_FRAME);
    // L'erreur DB ne doit pas bloquer le ACK gRPC
    expect(r.accepted).toBe(true);
  });

  test('✅ correlationId auto-généré si absent', async () => {
    const frame = { vehicle_id: 'v-002', latitude: 49.44, longitude: 1.09, timestamp: Date.now() };
    const r = await service.processGPSFrame(frame);
    expect(r.accepted).toBe(true);
    const savedArg = repository.savePosition.mock.calls[0][0];
    expect(typeof savedArg.correlationId).toBe('string');
    expect(savedArg.correlationId.length).toBeGreaterThan(0);
  });
});

// =============================================================================
describe('localisationService — getHistory()', () => {
// =============================================================================

  test('✅ délègue au repository avec les bons paramètres', async () => {
    const from = Date.now() - 3600000;
    const to   = Date.now();
    await service.getHistory('v-001', from, to, 100);
    expect(repository.getHistory).toHaveBeenCalledWith('v-001', from, to, 100);
  });

  test('✅ retourne le résultat du repository', async () => {
    const fakePositions = [{ vehicleId: 'v-001', latitude: 49.44, longitude: 1.09 }];
    repository.getHistory.mockResolvedValueOnce(fakePositions);
    const result = await service.getHistory('v-001', 0, 0, 10);
    expect(result).toEqual(fakePositions);
  });
});

// =============================================================================
describe('localisationService — getLastPosition()', () => {
// =============================================================================

  test('✅ retourne null si aucune position', async () => {
    repository.getLastPosition.mockResolvedValueOnce(null);
    const result = await service.getLastPosition('v-inexistant');
    expect(result).toBeNull();
  });

  test('✅ retourne la position si trouvée', async () => {
    const pos = { vehicleId: 'v-001', latitude: 49.44, longitude: 1.09, timestamp: Date.now() };
    repository.getLastPosition.mockResolvedValueOnce(pos);
    const result = await service.getLastPosition('v-001');
    expect(result).toEqual(pos);
  });
});

// =============================================================================
describe('localisationService — getPositionSummary()', () => {
// =============================================================================

  test('✅ retourne un résumé cohérent', async () => {
    const lastPos = { vehicleId: 'v-001', latitude: 49.44, longitude: 1.09, timestamp: Date.now() };
    repository.getLastPosition.mockResolvedValueOnce(lastPos);
    repository.getHourlyAverage.mockResolvedValueOnce([
      { count: '10', avg_latitude: 49.44, avg_longitude: 1.09 },
      { count: '5',  avg_latitude: 49.45, avg_longitude: 1.10 },
    ]);

    const result = await service.getPositionSummary('v-001', 0, 0);
    expect(result.vehicleId).toBe('v-001');
    expect(result.totalPositions).toBe(15); // 10 + 5
    expect(result.lastPosition).toEqual(lastPos);
  });

  test('✅ totalPositions=0 si aucune donnée horaire', async () => {
    repository.getLastPosition.mockResolvedValueOnce(null);
    repository.getHourlyAverage.mockResolvedValueOnce([]);
    const result = await service.getPositionSummary('v-vide', 0, 0);
    expect(result.totalPositions).toBe(0);
    expect(result.lastPosition).toBeNull();
  });
});
