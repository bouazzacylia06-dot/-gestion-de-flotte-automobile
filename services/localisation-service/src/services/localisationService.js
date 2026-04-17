// =============================================================================
// services/localisationService.js — Orchestrateur du flux GPS
//
// Coordonne les trois opérations pour chaque trame reçue :
//   1. Validation via GPSDataProcessor
//   2. Persistance dans TimescaleDB via LocalisationRepository
//   3. Vérification de géofencing (asynchrone, non bloquant pour le ACK gRPC)
// =============================================================================

const { randomUUID }   = require('crypto');
const gpsProcessor     = require('./gpsDataProcessor');
const geoFencing       = require('./geoFencingService');
const repository       = require('../repositories/localisationRepository');

// ─── Traitement d'une trame GPS ────────────────────────────────────────────────

/**
 * Traite une trame GPS entrante de bout en bout.
 *
 * @param {Object} rawGpsData - trame brute reçue (format proto GPSData)
 * @returns {Promise<{ accepted: boolean, reason?: string, data?: Object }>}
 */
async function processGPSFrame(rawGpsData) {
  const correlationId = rawGpsData.correlationId || rawGpsData.correlation_id || randomUUID();

  // ── 1. Validation & nettoyage ────────────────────────────────────────────
  // Normalise les noms de champs (snake_case gRPC → camelCase interne)
  const normalized = {
    vehicleId:     rawGpsData.vehicleId    || rawGpsData.vehicle_id,
    latitude:      rawGpsData.latitude,
    longitude:     rawGpsData.longitude,
    speed:         rawGpsData.speed,
    heading:       rawGpsData.heading,
    timestamp:     rawGpsData.timestamp,
    correlationId,
  };

  const result = gpsProcessor.process(normalized);

  if (!result.valid) {
    console.warn(JSON.stringify({
      level:         'WARN', service: 'localisation-service',
      message:       '[LocalisationService] Trame GPS rejetée',
      reason:        result.reason,
      vehicleId:     normalized.vehicleId,
      correlationId,
    }));
    return { accepted: false, reason: result.reason };
  }

  const { data } = result;

  // ── 2. Persistance TimescaleDB ───────────────────────────────────────────
  try {
    await repository.savePosition(data);
  } catch (err) {
    // Erreur DB : on log mais on ne bloque pas le ACK gRPC.
    // Le client ne doit pas être pénalisé par une indisponibilité DB transitoire.
    console.error(JSON.stringify({
      level:         'ERROR', service: 'localisation-service',
      message:       '[LocalisationService] Erreur persistance TimescaleDB',
      error:         err.message,
      vehicleId:     data.vehicleId,
      correlationId: data.correlationId,
    }));
  }

  // ── 3. Géofencing (fire-and-forget) ─────────────────────────────────────
  // Non bloquant : le ACK est renvoyé au client immédiatement.
  // L'alerte Kafka sera publiée en parallèle (quelques dizaines de ms).
  geoFencing.checkZoneCrossing(data).catch((err) => {
    console.error(JSON.stringify({
      level:     'ERROR', service: 'localisation-service',
      message:   '[LocalisationService] Erreur géofencing',
      error:     err.message,
      vehicleId: data.vehicleId,
    }));
  });

  return { accepted: true, data };
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

/**
 * Récupère l'historique des positions d'un véhicule depuis TimescaleDB.
 */
async function getHistory(vehicleId, from, to, limit) {
  return repository.getHistory(vehicleId, from, to, limit);
}

/**
 * Récupère la dernière position connue d'un véhicule.
 */
async function getLastPosition(vehicleId) {
  return repository.getLastPosition(vehicleId);
}

/**
 * Calcule un résumé de trajet pour une plage temporelle donnée.
 *
 * Optimisation O(1) vs O(n) : utilise time_bucket() côté TimescaleDB (getHourlyAverage)
 * au lieu de charger toutes les positions en mémoire (jusqu'à 86 400 lignes/jour/véhicule).
 * La distance est approximée via Haversine sur les barycentres horaires (~5% d'écart).
 */
async function getPositionSummary(vehicleId, from, to) {
  const [lastPosition, hourlyData] = await Promise.all([
    repository.getLastPosition(vehicleId),
    repository.getHourlyAverage(vehicleId, from, to),
  ]);

  const totalPositions = hourlyData.reduce(
    (sum, row) => sum + parseInt(row.count || 0, 10),
    0
  );

  // Distance approximée sur les barycentres horaires (économe en mémoire)
  let totalDistanceKm = 0;
  for (let i = 1; i < hourlyData.length; i++) {
    const prev = hourlyData[i - 1];
    const curr = hourlyData[i];
    totalDistanceKm += gpsProcessor.haversineDistance(
      parseFloat(prev.avg_latitude),  parseFloat(prev.avg_longitude),
      parseFloat(curr.avg_latitude),  parseFloat(curr.avg_longitude)
    );
  }

  return {
    vehicleId,
    lastPosition,
    totalPositions,
    totalDistanceKm:  Math.round(totalDistanceKm * 100) / 100,
    hourlyBreakdown:  hourlyData,
  };
}

module.exports = { processGPSFrame, getHistory, getLastPosition, getPositionSummary };
