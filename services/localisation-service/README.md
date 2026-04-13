# Service Localisation — gRPC + TimescaleDB + GeoFencing

Microservice de la **Semaine 5** — Gestion de Flotte Automobile (M1 GIL, Université de Rouen).

## Architecture

```
[GPS Traceur]  ──gRPC bidi──▶  LocalisationController
                                       │
                                       ▼
                               LocalisationService
                               ┌───────┴───────────────────────┐
                               ▼                               ▼
                     GPSDataProcessor               GeoFencingService
                     (validation/Haversine)         (ray-casting + cache)
                               │                               │
                               ▼                               ▼
                     LocalisationRepository          KafkaProducer
                     (TimescaleDB hypertable)        topic: geo-alerts
```

**Deux serveurs en parallèle :**
- `HTTP :3003` — REST API (compatibilité API Gateway GraphQL) + `/health`
- `gRPC :50051` — streaming GPS bidirectionnel (traceurs embarqués)

## Démarrage rapide (standalone)

```bash
# Depuis services/localisation-service/
docker compose up -d

# Vérifier que tout est healthy
docker compose ps

# Lancer le simulateur GPS (40 positions, traverse la zone interdite)
npm run simulate

# Ou avec un ID de véhicule spécifique
node gps-simulator.js fleet-007
```

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3003` | Port HTTP |
| `GRPC_PORT` | `50051` | Port gRPC |
| `TIMESCALEDB_HOST` | `localhost` | Hôte TimescaleDB |
| `TIMESCALEDB_PORT` | `5432` | Port TimescaleDB |
| `TIMESCALEDB_DB` | `fleet` | Base de données |
| `TIMESCALEDB_USER` | `flotte` | Utilisateur |
| `TIMESCALEDB_PASSWORD` | `flotte123` | Mot de passe |
| `KAFKA_BROKER` | `localhost:9092` | Broker Kafka |
| `KAFKA_GEO_ALERTS_TOPIC` | `geo-alerts` | Topic alertes |

## API gRPC (contrat `.proto`)

```protobuf
service LocalisationService {
  rpc StreamGPSPosition  (stream GPSData)    returns (stream PositionAck);
  rpc GetPositionHistory (HistoryRequest)    returns (stream GPSData);
  rpc GetLastPosition    (HistoryRequest)    returns (GPSData);
  rpc GetPositionSummary (HistoryRequest)    returns (PositionSummary);
}
```

### StreamGPSPosition — bidirectionnel

```javascript
// Exemple client Node.js
const stream = client.StreamGPSPosition();
stream.write({
  vehicle_id: 'fleet-007',
  latitude: 49.4400, longitude: 1.0900,
  speed: 50, heading: 90,
  timestamp: Date.now(),
  correlation_id: 'corr-001'
});
stream.on('data', (ack) => console.log(ack.accepted)); // true/false
```

Règles de validation :
- `latitude` ∈ [-90, +90] — sinon `accepted: false`
- `longitude` ∈ [-180, +180] — sinon `accepted: false`
- `speed` ≤ 250 km/h — sinon `accepted: false` (position aberrante)

## API REST (compatibilité API Gateway)

```
GET  /health                    → { status: "ok" }
GET  /localisations             → dernières positions (24h, 100 max)
GET  /localisations/:vehicleId  → dernière position du véhicule
POST /localisations             → créer une position (roles: admin/manager/tech)
```

## Tests

```bash
# Tous les tests (34 unitaires + 6 intégration)
npm test

# Unitaires seulement (sans dépendances réseau)
npm run test:unit

# Intégration gRPC (démarre un serveur local sur :50099)
npm run test:integration
```

### Résultats attendus

```
Tests: 40 passed, 40 total
  GPSDataProcessor — process()         : 16 tests
  GPSDataProcessor — haversineDistance : 5 tests
  GeoFencingService — pointInPolygon() : 6 tests
  GeoFencingService — checkZoneCrossing: 7 tests
  gRPC — StreamGPSPosition             : 4 tests
  gRPC — GetPositionHistory            : 1 test
  gRPC — GetLastPosition               : 1 test
```

## Schema TimescaleDB

```sql
-- 3 tables dans le schema service_localisation
positions          -- hypertable, chunk 1 jour, index (vehicle_id, time DESC)
zones_geofencing   -- polygones GeoJSON, cache 5 min en mémoire
geo_alerts         -- audit trail des franchissements
```

Seed : 3 zones autour de Rouen (Campus université, Port interdit, Dépôt flotte).

## GeoFencing

Le service détecte automatiquement les franchissements de zones et publie sur Kafka :

```json
{
  "vehicleId": "fleet-007",
  "type": "ZONE_EXIT",
  "zoneId": "...",
  "zoneName": "Campus Université de Rouen",
  "zoneType": "AUTHORIZED",
  "position": { "latitude": 49.39, "longitude": 1.08 },
  "timestamp": 1700000000000
}
```

**Niveaux de log :**
- `INFO`  — ZONE_ENTRY dans une zone autorisée
- `WARN`  — ZONE_ENTRY dans une zone interdite, ou ZONE_EXIT d'une zone autorisée

## Intégration dans le docker-compose principal

Ajouter dans `docker-compose.yaml` :

```yaml
  # Remplacer le service postgres par timescaledb OU ajouter en parallèle :
  timescaledb:
    image: timescale/timescaledb-ha:pg15-latest
    environment:
      POSTGRES_DB: fleet
      POSTGRES_USER: ${POSTGRES_USER:-flotte}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-flotte123}
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./db/init-localisation.sql:/docker-entrypoint-initdb.d/02-localisation.sql
    networks:
      - flotte-net

  # Modifier location-service pour ajouter le port gRPC et TimescaleDB :
  location-service:
    ports:
      - "3003:3003"
      - "50051:50051"    # ← nouveau : port gRPC
    environment:
      - TIMESCALEDB_HOST=timescaledb
      - GRPC_PORT=50051
```
