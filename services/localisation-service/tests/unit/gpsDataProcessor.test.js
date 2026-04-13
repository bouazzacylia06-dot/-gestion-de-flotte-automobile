// =============================================================================
// tests/unit/gpsDataProcessor.test.js
// =============================================================================

const { process, haversineDistance, MAX_SPEED_KMH } = require('../../src/services/gpsDataProcessor');

// ─── Fixture de base ──────────────────────────────────────────────────────────
const VALID_GPS = {
  vehicleId: 'vehicle-001',
  latitude:  49.4400,
  longitude:  1.0900,
  speed:     50,
  heading:   90,
  timestamp: Date.now(),
};

// =============================================================================
describe('GPSDataProcessor — process()', () => {
// =============================================================================

  test('✅ accepte une position valide complète', () => {
    const result = process(VALID_GPS);
    expect(result.valid).toBe(true);
    expect(result.data.vehicleId).toBe('vehicle-001');
    expect(result.data.latitude).toBe(49.4400);
    expect(result.data.longitude).toBe(1.0900);
    expect(result.data.speed).toBe(50);
    expect(result.data.heading).toBe(90);
  });

  test('✅ accepte une position sans speed ni heading (traceur basique)', () => {
    const result = process({ vehicleId: 'v1', latitude: 49.4, longitude: 1.09, timestamp: Date.now() });
    expect(result.valid).toBe(true);
    expect(result.data.speed).toBe(0);   // valeur par défaut
    expect(result.data.heading).toBe(0);
  });

  test('✅ accepte exactement MAX_SPEED_KMH (limite autorisée)', () => {
    const result = process({ ...VALID_GPS, speed: MAX_SPEED_KMH });
    expect(result.valid).toBe(true);
  });

  test('✅ trim le vehicleId', () => {
    const result = process({ ...VALID_GPS, vehicleId: '  vehicle-002  ' });
    expect(result.valid).toBe(true);
    expect(result.data.vehicleId).toBe('vehicle-002');
  });

  test('✅ génère un timestamp si absent', () => {
    const before = Date.now();
    const result = process({ vehicleId: 'v1', latitude: 49.4, longitude: 1.09 });
    const after  = Date.now();
    expect(result.valid).toBe(true);
    expect(result.data.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.data.timestamp).toBeLessThanOrEqual(after);
  });

  // ── Rejets ──────────────────────────────────────────────────────────────────

  test('❌ rejette vehicleId manquant', () => {
    const result = process({ latitude: 49.4, longitude: 1.09, timestamp: Date.now() });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('vehicleId');
  });

  test('❌ rejette vehicleId vide après trim', () => {
    const result = process({ ...VALID_GPS, vehicleId: '   ' });
    expect(result.valid).toBe(false);
  });

  test('❌ rejette latitude > 90', () => {
    const result = process({ ...VALID_GPS, latitude: 90.001 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Latitude');
  });

  test('❌ rejette latitude < -90', () => {
    const result = process({ ...VALID_GPS, latitude: -90.001 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Latitude');
  });

  test('❌ rejette longitude > 180', () => {
    const result = process({ ...VALID_GPS, longitude: 180.001 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Longitude');
  });

  test('❌ rejette longitude < -180', () => {
    const result = process({ ...VALID_GPS, longitude: -180.001 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Longitude');
  });

  test('❌ rejette vitesse aberrante (> 250 km/h)', () => {
    const result = process({ ...VALID_GPS, speed: MAX_SPEED_KMH + 0.1 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Vitesse aberrante');
    expect(result.reason).toContain(String(MAX_SPEED_KMH));
  });

  test('❌ rejette vitesse négative', () => {
    const result = process({ ...VALID_GPS, speed: -1 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Vitesse aberrante');
  });

  test('❌ rejette latitude NaN', () => {
    const result = process({ ...VALID_GPS, latitude: NaN });
    expect(result.valid).toBe(false);
  });

  // ── Cas limites ──────────────────────────────────────────────────────────────

  test('✅ accepte les coordonnées aux bornes exactes (±90, ±180)', () => {
    expect(process({ ...VALID_GPS, latitude:  90, longitude:  180 }).valid).toBe(true);
    expect(process({ ...VALID_GPS, latitude: -90, longitude: -180 }).valid).toBe(true);
  });

  test("✅ accepte speed = 0 (véhicule à l'arrêt)", () => {
    const result = process({ ...VALID_GPS, speed: 0 });
    expect(result.valid).toBe(true);
  });
});

// =============================================================================
describe('GPSDataProcessor — haversineDistance()', () => {
// =============================================================================

  test('✅ Paris → Londres ≈ 340 km', () => {
    // Paris (48.8566, 2.3522) | Londres (51.5074, -0.1278)
    const dist = haversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(350);
  });

  test('✅ retourne 0 pour le même point', () => {
    expect(haversineDistance(49.44, 1.09, 49.44, 1.09)).toBe(0);
  });

  test('✅ est symétrique (A→B = B→A)', () => {
    const d1 = haversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
    const d2 = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });

  test("✅ distance croissante avec l'éloignement", () => {
    const d1 = haversineDistance(49.44, 1.09, 49.44, 1.10); // ~0.7 km
    const d2 = haversineDistance(49.44, 1.09, 49.44, 1.20); // ~7.5 km
    expect(d2).toBeGreaterThan(d1);
  });

  test('✅ Rouen → Le Havre ≈ 72 km (distance orthodromique)', () => {
    // Rouen (49.4431, 1.0993) | Le Havre (49.4944, 0.1079)
    // NB: la distance orthodromique (Haversine) ≈ 72 km,
    //     la distance routière ≈ 85 km (via l'A13)
    const dist = haversineDistance(49.4431, 1.0993, 49.4944, 0.1079);
    expect(dist).toBeGreaterThan(65);
    expect(dist).toBeLessThan(80);
  });
});
