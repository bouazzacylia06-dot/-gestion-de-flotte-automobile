// =============================================================================
// tests/unit/position.test.js — Modèle Position
// =============================================================================

const Position = require('../../src/models/Position');

describe('Position — constructor', () => {
  test('✅ normalise tous les champs', () => {
    const p = new Position({ vehicleId: 'v1', latitude: 49.44, longitude: 1.09, speed: 50, heading: 90, timestamp: 1700000000000, correlationId: 'abc' });
    expect(p.vehicleId).toBe('v1');
    expect(p.latitude).toBe(49.44);
    expect(p.longitude).toBe(1.09);
    expect(p.speed).toBe(50);
    expect(p.heading).toBe(90);
    expect(p.timestamp).toBe(1700000000000);
    expect(p.correlationId).toBe('abc');
  });

  test('✅ valeurs par défaut : speed=0, heading=0, correlationId vide', () => {
    const p = new Position({ vehicleId: 'v1', latitude: 49.44, longitude: 1.09 });
    expect(p.speed).toBe(0);
    expect(p.heading).toBe(0);
    expect(p.correlationId).toBe('');
  });

  test('✅ timestamp par défaut = Date.now() si absent', () => {
    const before = Date.now();
    const p = new Position({ vehicleId: 'v1', latitude: 49.44, longitude: 1.09 });
    expect(p.timestamp).toBeGreaterThanOrEqual(before);
  });

  test('✅ convertit latitude/longitude string en float', () => {
    const p = new Position({ vehicleId: 'v1', latitude: '49.44', longitude: '1.09' });
    expect(typeof p.latitude).toBe('number');
    expect(typeof p.longitude).toBe('number');
  });
});

describe('Position — isValid()', () => {
  const base = { vehicleId: 'v1', latitude: 49.44, longitude: 1.09, speed: 50, heading: 90, timestamp: Date.now() };

  test('✅ position valide → true', () => {
    expect(new Position(base).isValid()).toBe(true);
  });

  test('❌ vehicleId vide → false', () => {
    expect(new Position({ ...base, vehicleId: '' }).isValid()).toBe(false);
  });

  test('❌ latitude > 90 → false', () => {
    expect(new Position({ ...base, latitude: 91 }).isValid()).toBe(false);
  });

  test('❌ longitude < -180 → false', () => {
    expect(new Position({ ...base, longitude: -181 }).isValid()).toBe(false);
  });

  test('❌ speed > 250 → false', () => {
    expect(new Position({ ...base, speed: 251 }).isValid()).toBe(false);
  });

  test('✅ bornes exactes ±90/±180/speed=250 → true', () => {
    expect(new Position({ ...base, latitude: 90, longitude: 180, speed: 250 }).isValid()).toBe(true);
    expect(new Position({ ...base, latitude: -90, longitude: -180, speed: 0 }).isValid()).toBe(true);
  });
});
