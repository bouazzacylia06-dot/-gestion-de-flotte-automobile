#!/usr/bin/env node
// =============================================================================
// gps-simulator.js — Simulateur de traceur GPS embarqué
//
// Simule un véhicule effectuant un trajet circulaire autour du Dépôt de Rouen,
// puis dévie volontairement vers la Zone Interdite Port de Rouen pour tester
// la détection de géofencing.
//
// Usage :
//   node gps-simulator.js [vehicleId]
//   GRPC_HOST=localhost GRPC_PORT=50051 node gps-simulator.js fleet-007
//
// Variables d'environnement :
//   GRPC_HOST    (défaut: localhost)
//   GRPC_PORT    (défaut: 50051)
//   INTERVAL_MS  (défaut: 2000 — 1 trame toutes les 2 s)
// =============================================================================

const grpc        = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path        = require('path');
const { randomUUID } = require('crypto');

// ─── Configuration ─────────────────────────────────────────────────────────
const GRPC_HOST   = process.env.GRPC_HOST   || 'localhost';
const GRPC_PORT   = process.env.GRPC_PORT   || '50051';
const VEHICLE_ID  = process.argv[2]         || randomUUID();
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '2000', 10);

// ─── Chargement du contrat gRPC ─────────────────────────────────────────────
const PROTO_PATH = path.join(__dirname, 'src', 'proto', 'localisation.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: Number, enums: String, defaults: true, oneofs: true,
});
const { localisation } = grpc.loadPackageDefinition(packageDef);

// ─── Connexion au serveur gRPC ──────────────────────────────────────────────
const client = new localisation.LocalisationService(
  `${GRPC_HOST}:${GRPC_PORT}`,
  grpc.credentials.createInsecure()
);

// =============================================================================
// Définition du trajet simulé
// =============================================================================

// Centre du trajet circulaire : Dépôt Principal Flotte (Rouen)
const DEPOT_LAT = 49.4175;
const DEPOT_LON = 1.0575;
const RADIUS    = 0.015; // ~1.5 km de rayon

// Zone Interdite Port de Rouen : [lon 1.08-1.12, lat 49.44-49.47]
// → On vise le centre (49.455, 1.10) pour traverser la zone
const PORT_LAT = 49.455;
const PORT_LON = 1.100;

const TOTAL_STEPS = 40;    // 40 × 2 s = 80 secondes de simulation
const DETOUR_START = 18;   // à partir de la position 18 → déviation
const DETOUR_END   = 28;   // retour au trajet normal à 28

/**
 * Calcule la position GPS à l'étape `step`.
 * Étapes 18-28 : déviation progressive vers la zone interdite.
 * Autres étapes : trajet circulaire normal.
 */
function getPosition(step) {
  if (step >= DETOUR_START && step <= DETOUR_END) {
    // Interpolation linéaire vers/depuis le Port de Rouen
    const mid      = (DETOUR_START + DETOUR_END) / 2;
    const progress = step <= mid
      ? (step - DETOUR_START) / (mid - DETOUR_START)  // aller
      : 1 - (step - mid) / (DETOUR_END - mid);        // retour

    const angle = (DETOUR_START * (2 * Math.PI)) / TOTAL_STEPS;
    const baseLat = DEPOT_LAT + RADIUS * Math.cos(angle);
    const baseLon = DEPOT_LON + RADIUS * Math.sin(angle);

    return {
      lat: baseLat + (PORT_LAT - baseLat) * progress,
      lon: baseLon + (PORT_LON - baseLon) * progress,
    };
  }

  // Trajet circulaire normal
  const angle = (step * (2 * Math.PI)) / TOTAL_STEPS;
  return {
    lat: DEPOT_LAT + RADIUS * Math.cos(angle),
    lon: DEPOT_LON + RADIUS * Math.sin(angle),
  };
}

// =============================================================================
// Simulation
// =============================================================================

console.log('═══════════════════════════════════════════════════════');
console.log('  GPS Simulator — Gestion de Flotte Automobile');
console.log('═══════════════════════════════════════════════════════');
console.log(`  Véhicule   : ${VEHICLE_ID}`);
console.log(`  Serveur    : ${GRPC_HOST}:${GRPC_PORT}`);
console.log(`  Intervalle : ${INTERVAL_MS} ms`);
console.log(`  Trajet     : ${TOTAL_STEPS} positions (${(TOTAL_STEPS * INTERVAL_MS / 1000).toFixed(0)} s)`);
console.log(`  Déviation  : étapes ${DETOUR_START}–${DETOUR_END} → Zone Interdite Port de Rouen`);
console.log('═══════════════════════════════════════════════════════\n');

// Ouvre le stream bidirectionnel
const stream = client.StreamGPSPosition();
let step = 0;

// ── Réception des ACK serveur ────────────────────────────────────────────────
stream.on('data', (ack) => {
  const icon     = ack.accepted ? '✅' : '❌';
  const reason   = ack.accepted ? '' : ` ← REJETÉ: ${ack.reason}`;
  console.log(`  ${icon} ACK #${String(step - 1).padStart(2)} | accepted=${ack.accepted}${reason}`);
});

stream.on('error', (err) => {
  console.error(`\n  [ERREUR gRPC] ${err.message}`);
  console.error('  → Vérifiez que le service est démarré sur le port ' + GRPC_PORT);
  clearInterval(intervalId);
  process.exit(1);
});

stream.on('end', () => {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Simulation terminée avec succès');
  console.log(`  ${TOTAL_STEPS} trames envoyées — consultez les logs du service`);
  console.log('  pour voir les alertes géofencing sur Kafka (topic: geo-alerts)');
  console.log('═══════════════════════════════════════════════════════');
  process.exit(0);
});

// ── Envoi des trames GPS ─────────────────────────────────────────────────────
const intervalId = setInterval(() => {
  const { lat, lon } = getPosition(step);

  // Vitesse simulée : 40-60 km/h avec légère variation sinusoïdale
  const speed   = 50 + 10 * Math.sin(step * 0.3);
  // Cap calculé à partir du mouvement entre 2 positions
  const heading = (step * (360 / TOTAL_STEPS)) % 360;

  // Étiquette visuelle pour la phase de déviation
  const isDetour = step >= DETOUR_START && step <= DETOUR_END;
  const label    = isDetour ? '⚠️  DÉVIATION ZONE INTERDITE' : '📍';

  console.log(
    `  ${label} #${String(step).padStart(2)} → lat=${lat.toFixed(5)}, lon=${lon.toFixed(5)}, ` +
    `speed=${speed.toFixed(1)} km/h, heading=${heading.toFixed(0)}°`
  );

  stream.write({
    vehicle_id:     VEHICLE_ID,
    latitude:       lat,
    longitude:      lon,
    speed:          speed,
    heading:        heading,
    timestamp:      Date.now(),
    correlation_id: `sim-${VEHICLE_ID}-${step}`,
  });

  step++;

  if (step >= TOTAL_STEPS) {
    clearInterval(intervalId);
    stream.end();
  }
}, INTERVAL_MS);

// ── CTRL+C → fermeture propre ────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n\n  [Simulateur] Interruption — fermeture du stream gRPC...');
  clearInterval(intervalId);
  stream.end();
});
