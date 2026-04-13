// =============================================================================
// tests/integration/grpc.test.js
// Test d'intégration gRPC : démarre un vrai serveur local sur un port de test,
// crée un client gRPC et valide les 2 RPCs principaux.
// Repository et Kafka sont mockés pour isoler le transport gRPC.
// =============================================================================

// Mocks hoistés avant tout require()
jest.mock('../../src/repositories/localisationRepository', () => ({
  savePosition:    jest.fn().mockResolvedValue(undefined),
  getHistory:      jest.fn().mockResolvedValue([]),
  getLastPosition: jest.fn().mockResolvedValue(null),
  getActiveZones:  jest.fn().mockResolvedValue([]),
  saveGeoAlert:    jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/kafka/producer', () => ({
  connect:         jest.fn().mockResolvedValue(undefined),
  publishGeoAlert: jest.fn().mockResolvedValue(undefined),
  disconnect:      jest.fn().mockResolvedValue(undefined),
}));

const grpc        = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path        = require('path');

const grpcController = require('../../src/controllers/grpcController');

const PROTO_PATH = path.join(__dirname, '../../src/proto/localisation.proto');
const TEST_PORT  = 50099; // port dédié aux tests pour éviter conflit avec le service réel

let grpcServer;
let LocalisationClient;
let client;

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll((done) => {
  const packageDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: Number, enums: String, defaults: true, oneofs: true,
  });
  const { localisation } = grpc.loadPackageDefinition(packageDef);
  LocalisationClient = localisation.LocalisationService;

  // Démarrage du serveur de test
  grpcServer = new grpc.Server();
  grpcServer.addService(LocalisationClient.service, {
    StreamGPSPosition:  grpcController.streamGPSPosition,
    GetPositionHistory: grpcController.getPositionHistory,
    GetLastPosition:    grpcController.getLastPosition,
    GetPositionSummary: grpcController.getPositionSummary,
  });

  grpcServer.bindAsync(
    `localhost:${TEST_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) return done(err);
      client = new LocalisationClient(
        `localhost:${TEST_PORT}`,
        grpc.credentials.createInsecure()
      );
      done();
    }
  );
});

afterAll((done) => {
  client.close();
  grpcServer.tryShutdown(done);
});

// =============================================================================
describe('gRPC — StreamGPSPosition (bidirectionnel)', () => {
// =============================================================================

  test('✅ 10 positions valides → 10 ACK accepted=true', (done) => {
    const stream = client.StreamGPSPosition();
    const acks   = [];

    stream.on('data',  (ack) => acks.push(ack));
    stream.on('error', done);
    stream.on('end', () => {
      expect(acks).toHaveLength(10);
      expect(acks.every((a) => a.accepted === true)).toBe(true);
      // Vérifie que le correlationId est bien repris dans l'ACK
      expect(acks[0].correlation_id).toBe('corr-0');
      done();
    });

    for (let i = 0; i < 10; i++) {
      stream.write({
        vehicle_id:     'test-vehicle-001',
        latitude:       49.4400 + i * 0.001,
        longitude:       1.0900 + i * 0.001,
        speed:          30 + i * 2,
        heading:        (i * 36) % 360,
        timestamp:      Date.now() + i * 2000,
        correlation_id: `corr-${i}`,
      });
    }
    stream.end();
  }, 15000);

  test('✅ position avec vitesse aberrante → ACK accepted=false', (done) => {
    const stream = client.StreamGPSPosition();
    const acks   = [];

    stream.on('data',  (ack) => acks.push(ack));
    stream.on('error', done);
    stream.on('end', () => {
      expect(acks).toHaveLength(1);
      expect(acks[0].accepted).toBe(false);
      expect(acks[0].reason).toContain('Vitesse aberrante');
      done();
    });

    stream.write({
      vehicle_id: 'test-vehicle-bad-speed',
      latitude:   49.44,
      longitude:   1.09,
      speed:      999, // > 250 km/h
      heading:    0,
      timestamp:  Date.now(),
    });
    stream.end();
  }, 10000);

  test('✅ coordonnées hors-bornes → ACK accepted=false avec motif Latitude', (done) => {
    const stream = client.StreamGPSPosition();
    const acks   = [];

    stream.on('data',  (ack) => acks.push(ack));
    stream.on('error', done);
    stream.on('end', () => {
      expect(acks[0].accepted).toBe(false);
      expect(acks[0].reason).toContain('Latitude');
      done();
    });

    stream.write({
      vehicle_id: 'test-vehicle-bad-coords',
      latitude:   95,  // > 90 → invalide
      longitude:   1.09,
      timestamp:  Date.now(),
    });
    stream.end();
  }, 10000);

  test("✅ mix valide + invalide → ACKs corrects dans l'ordre", (done) => {
    const stream = client.StreamGPSPosition();
    const acks   = [];

    stream.on('data',  (ack) => acks.push(ack));
    stream.on('error', done);
    stream.on('end', () => {
      expect(acks).toHaveLength(3);
      expect(acks[0].accepted).toBe(true);   // valide
      expect(acks[1].accepted).toBe(false);  // vitesse aberrante
      expect(acks[2].accepted).toBe(true);   // valide
      done();
    });

    stream.write({ vehicle_id: 'v1', latitude: 49.44, longitude: 1.09, speed: 50, timestamp: Date.now() });
    stream.write({ vehicle_id: 'v1', latitude: 49.44, longitude: 1.09, speed: 999, timestamp: Date.now() });
    stream.write({ vehicle_id: 'v1', latitude: 49.45, longitude: 1.10, speed: 60, timestamp: Date.now() });
    stream.end();
  }, 10000);
});

// =============================================================================
describe('gRPC — GetPositionHistory (server-side streaming)', () => {
// =============================================================================

  test('✅ historique vide (mock) → stream se termine sans erreur', (done) => {
    const received = [];
    const call = client.GetPositionHistory({
      vehicle_id: 'vehicle-no-history',
      from:   Date.now() - 3600000,
      to:     Date.now(),
      limit:  50,
    });

    call.on('data',  (pos) => received.push(pos));
    call.on('error', done);
    call.on('end', () => {
      expect(received).toHaveLength(0); // mock retourne []
      done();
    });
  }, 5000);
});

// =============================================================================
describe('gRPC — GetLastPosition (unaire)', () => {
// =============================================================================

  test('✅ aucune position → erreur NOT_FOUND (code 5)', (done) => {
    client.GetLastPosition(
      { vehicle_id: 'no-such-vehicle', from: 0, to: 0, limit: 1 },
      (err, _response) => {
        expect(err).not.toBeNull();
        expect(err.code).toBe(grpc.status.NOT_FOUND);
        done();
      }
    );
  }, 5000);
});
