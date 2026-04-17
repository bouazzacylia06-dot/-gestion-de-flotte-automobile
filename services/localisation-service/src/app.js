// =============================================================================
// app.js — Point d'entrée du Service Localisation
//
// Démarre DEUX serveurs en parallèle :
//   • HTTP  :3003 — REST (compatibilité API Gateway GraphQL) + /health
//   • gRPC :50051 — streaming GPS bidirectionnel (traceurs embarqués)
// =============================================================================

const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const grpc        = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { randomUUID } = require('crypto');

const { authenticate, requireRole } = require('./middleware/authMiddleware');
const repository     = require('./repositories/localisationRepository');
const grpcController = require('./controllers/grpcController');
const kafkaProducer  = require('./kafka/producer');

// ─── Configuration ──────────────────────────────────────────────────────────
const HTTP_PORT  = parseInt(process.env.PORT      || '3003', 10);
const GRPC_PORT  = parseInt(process.env.GRPC_PORT || '50051', 10);
const PROTO_PATH = path.join(__dirname, 'proto', 'localisation.proto');

// ─── Chargement du fichier .proto ────────────────────────────────────────────
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,   // conserve snake_case du .proto tel quel
  longs:    Number, // int64 → number JS (epoch ms)
  enums:    String,
  defaults: true,
  oneofs:   true,
});
const { localisation: grpcPackage } = grpc.loadPackageDefinition(packageDef);

// =============================================================================
// Serveur Express — REST + /health
// =============================================================================
const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (_req, res) =>
  res.send('Service Localisation — gRPC :50051 + REST :3003 (Gestion de Flotte)')
);

// Endpoint de santé (Docker healthcheck + API Gateway)
app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', service: 'localisation-service' })
);

// ── Endpoints REST (compatibilité API Gateway GraphQL existante) ─────────────

app.get('/localisations', authenticate, async (_req, res) => {
  try {
    const now  = Date.now();
    const rows = await repository.getHistory(null, now - 86400000, now, 100);
    res.status(200).json(rows);
  } catch {
    res.status(200).json([]); // fallback si TimescaleDB indisponible
  }
});

// GET /localisations/history/:vehicleId?from=ISO&to=ISO&limit=500
app.get('/localisations/history/:vehicleId', authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const from  = req.query.from ? new Date(req.query.from).getTime() : Date.now() - 86400000;
    const to    = req.query.to   ? new Date(req.query.to).getTime()   : Date.now();
    const limit = Math.min(parseInt(req.query.limit || '500', 10), 2000);
    const positions = await repository.getHistory(vehicleId, from, to, limit);
    res.status(200).json(positions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /localisations/last/:vehicleId
app.get('/localisations/last/:vehicleId', authenticate, async (req, res) => {
  try {
    const pos = await repository.getLastPosition(req.params.vehicleId);
    if (!pos) return res.status(404).json({ message: 'No position found' });
    return res.status(200).json(pos);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get('/localisations/:vehicleId', authenticate, async (req, res) => {
  try {
    const pos = await repository.getLastPosition(req.params.vehicleId);
    if (!pos) return res.status(404).json({ message: 'Aucune position trouvée' });
    return res.status(200).json(pos);
  } catch {
    return res.status(404).json({ message: 'Aucune position trouvée' });
  }
});

app.post(
  '/localisations',
  authenticate,
  requireRole('admin', 'manager', 'technicien'),
  async (req, res) => {
    const { vehiculeId, latitude, longitude, timestamp, speed, heading } = req.body;
    if (!vehiculeId || latitude == null || longitude == null) {
      return res.status(400).json({ message: 'vehiculeId, latitude, longitude requis' });
    }
    try {
      const position = {
        vehicleId:     vehiculeId,
        latitude:      parseFloat(latitude),
        longitude:     parseFloat(longitude),
        speed:         speed   ? parseFloat(speed)   : 0,
        heading:       heading ? parseFloat(heading) : 0,
        timestamp:     timestamp ? new Date(timestamp).getTime() : Date.now(),
        correlationId: randomUUID(),
      };
      await repository.savePosition(position);
      return res.status(201).json({ id: randomUUID(), ...position });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

app.delete('/localisations/:id', authenticate, requireRole('admin'), (_req, res) =>
  res.status(204).send()
);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) =>
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
);

// =============================================================================
// Serveur gRPC
// =============================================================================
function createGrpcServer() {
  const server = new grpc.Server({
    'grpc.max_receive_message_length': 10 * 1024 * 1024,
    'grpc.max_send_message_length':    10 * 1024 * 1024,
  });

  server.addService(grpcPackage.LocalisationService.service, {
    StreamGPSPosition:  grpcController.streamGPSPosition,
    GetPositionHistory: grpcController.getPositionHistory,
    GetLastPosition:    grpcController.getLastPosition,
    GetPositionSummary: grpcController.getPositionSummary,
  });

  return server;
}

// =============================================================================
// Bootstrap
// =============================================================================
async function bootstrap() {
  // 1. Connexion Kafka Producer
  try {
    await kafkaProducer.connect();
  } catch (err) {
    console.warn(JSON.stringify({
      level:   'WARN', service: 'localisation-service',
      message: '[Bootstrap] Kafka indisponible — alertes géofencing désactivées',
      error:   err.message,
    }));
    // Non bloquant : le service fonctionne en mode dégradé sans Kafka
  }

  // 2. Démarrage serveur gRPC
  const grpcServer = createGrpcServer();
  await new Promise((resolve, reject) => {
    grpcServer.bindAsync(
      `0.0.0.0:${GRPC_PORT}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) return reject(err);
        console.log(JSON.stringify({
          level:   'INFO', service: 'localisation-service',
          message: `[gRPC] Serveur démarré sur le port ${port}`,
        }));
        resolve(port);
      }
    );
  });

  // 3. Démarrage serveur HTTP
  app.listen(HTTP_PORT, () => {
    console.log(JSON.stringify({
      level:   'INFO', service: 'localisation-service',
      message: `[HTTP] Service Localisation démarré sur le port ${HTTP_PORT}`,
    }));
  });

  // 4. Graceful shutdown (Docker envoie SIGTERM avant SIGKILL)
  process.on('SIGTERM', async () => {
    console.log(JSON.stringify({
      level:   'INFO', service: 'localisation-service',
      message: '[Bootstrap] SIGTERM reçu — arrêt gracieux',
    }));
    await kafkaProducer.disconnect();
    grpcServer.tryShutdown(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error(JSON.stringify({
    level:   'ERROR', service: 'localisation-service',
    message: '[Bootstrap] Erreur fatale au démarrage',
    error:   err.message,
  }));
  process.exit(1);
});
