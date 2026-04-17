// =============================================================================
// tests/unit/localisationRepository.test.js
// Mock du pool pg pour tester les requêtes SQL sans base de données réelle
// =============================================================================

const mockQuery = jest.fn();
jest.mock('../../src/config/database', () => ({ query: mockQuery }));

const repo = require('../../src/repositories/localisationRepository');

// Ligne PostgreSQL fictive avec toutes les colonnes de la hypertable
const DB_ROW = {
  vehicle_id:     'v-001',
  latitude:       '49.4400',
  longitude:      '1.0900',
  speed:          '50',
  heading:        '90',
  time:           new Date('2025-01-01T12:00:00Z'),
  correlation_id: 'corr-abc',
};

// Résultat attendu après rowToGpsData()
const MAPPED_POS = {
  vehicleId:     'v-001',
  latitude:      49.44,
  longitude:     1.09,
  speed:         50,
  heading:       90,
  timestamp:     new Date('2025-01-01T12:00:00Z').getTime(),
  correlationId: 'corr-abc',
};

beforeEach(() => mockQuery.mockClear());

// =============================================================================
describe('localisationRepository — savePosition()', () => {
// =============================================================================

  test('✅ exécute une requête INSERT', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.savePosition({
      vehicleId: 'v-001', latitude: 49.44, longitude: 1.09,
      speed: 50, heading: 90, timestamp: 1700000000000, correlationId: 'abc',
    });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/INSERT/i);
    expect(sql).toMatch(/positions/i);
  });

  test('✅ vehicleId passé en paramètre préparé ($2)', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.savePosition({
      vehicleId: 'v-test', latitude: 49.44, longitude: 1.09,
      speed: 0, heading: 0, timestamp: Date.now(), correlationId: '',
    });
    const params = mockQuery.mock.calls[0][1];
    expect(params).toContain('v-test');
  });

  test('✅ timestamp epoch ms converti en objet Date', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const ts = 1700000000000;
    await repo.savePosition({
      vehicleId: 'v-001', latitude: 49.44, longitude: 1.09,
      speed: 0, heading: 0, timestamp: ts, correlationId: '',
    });
    const params = mockQuery.mock.calls[0][1];
    expect(params[0]).toBeInstanceOf(Date);
    expect(params[0].getTime()).toBe(ts);
  });

  test('❌ propage les erreurs DB', async () => {
    mockQuery.mockRejectedValue(new Error('connection refused'));
    await expect(
      repo.savePosition({ vehicleId: 'v-001', latitude: 49.44, longitude: 1.09, timestamp: Date.now() })
    ).rejects.toThrow('connection refused');
  });
});

// =============================================================================
describe('localisationRepository — getHistory()', () => {
// =============================================================================

  test('✅ retourne les lignes mappées par rowToGpsData()', async () => {
    mockQuery.mockResolvedValue({ rows: [DB_ROW] });
    const result = await repo.getHistory('v-001', Date.now() - 3600000, Date.now(), 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(MAPPED_POS);
  });

  test('✅ retourne tableau vide si aucune ligne', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const result = await repo.getHistory('v-absent', Date.now() - 3600000, Date.now(), 10);
    expect(result).toEqual([]);
  });

  test('✅ vehicleId null → requête sans filtre vehicleId', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.getHistory(null, Date.now() - 3600000, Date.now(), 50);
    const [sql] = mockQuery.mock.calls[0];
    // Pas de paramètre vehicle_id dans le WHERE
    expect(sql).not.toMatch(/vehicle_id = \$1/);
  });

  test('✅ requête avec LIMIT quand limit > 0', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.getHistory('v-001', Date.now() - 3600000, Date.now(), 10);
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/LIMIT/i);
  });

  test('✅ pas de LIMIT quand limit = 0', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.getHistory('v-001', Date.now() - 3600000, Date.now(), 0);
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).not.toMatch(/LIMIT/i);
  });
});

// =============================================================================
describe('localisationRepository — getLastPosition()', () => {
// =============================================================================

  test('✅ retourne null si aucune ligne', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const result = await repo.getLastPosition('v-inexistant');
    expect(result).toBeNull();
  });

  test('✅ retourne la position mappée si trouvée', async () => {
    mockQuery.mockResolvedValue({ rows: [DB_ROW] });
    const result = await repo.getLastPosition('v-001');
    expect(result).toEqual(MAPPED_POS);
  });

  test('✅ requête inclut ORDER BY time DESC LIMIT 1', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.getLastPosition('v-001');
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/ORDER\s+BY\s+time\s+DESC/i);
    expect(sql).toMatch(/LIMIT\s+1/i);
  });
});

// =============================================================================
describe('localisationRepository — saveGeoAlert()', () => {
// =============================================================================

  test('✅ exécute une requête INSERT geo_alerts', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.saveGeoAlert('v-001', 'zone-001', 'ZONE_ENTRY', 49.44, 1.09);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/INSERT/i);
    expect(sql).toMatch(/geo_alerts/i);
    expect(params).toContain('v-001');
    expect(params).toContain('ZONE_ENTRY');
  });
});
