// =============================================================================
// services/geoFencingService.js — Détection de franchissement de zones
//
// Architecture :
//   1. Les zones GeoJSON sont chargées depuis TimescaleDB et mises en cache
//      (TTL 5 min) pour éviter une requête DB à chaque trame GPS (~0.5 Hz).
//   2. L'état courant de chaque véhicule (ensemble des zones où il se trouve)
//      est maintenu en mémoire pour détecter les ENTRÉES / SORTIES.
//   3. Lors d'un franchissement, une alerte est publiée sur Kafka ET
//      persistée en base pour l'audit trail.
// =============================================================================

const repository    = require('../repositories/localisationRepository');
const kafkaProducer = require('../kafka/producer');

// ─── Cache des zones ──────────────────────────────────────────────────────────

let zonesCache       = [];
let lastCacheUpdate  = 0;
const CACHE_TTL_MS   = 5 * 60 * 1000; // 5 minutes

// ─── État des véhicules ───────────────────────────────────────────────────────

// vehicleZoneState : Map<vehicleId, Set<zoneId>>
// Représente l'ensemble des zones où chaque véhicule se trouve actuellement.
const vehicleZoneState = new Map();

// vehicleLocks : Map<vehicleId, Promise>
// Sérialise les vérifications de zone par véhicule pour éviter les race conditions
// lorsque plusieurs trames GPS arrivent en rafale via le stream bidirectionnel gRPC.
const vehicleLocks = new Map();

// ─── Cache management ─────────────────────────────────────────────────────────

async function refreshZonesIfNeeded() {
  const now = Date.now();
  if (now - lastCacheUpdate > CACHE_TTL_MS) {
    try {
      zonesCache = await repository.getActiveZones();
      lastCacheUpdate = now;
      console.log(JSON.stringify({
        level:   'INFO', service: 'localisation-service',
        message: `[GeoFencing] Cache zones rafraîchi — ${zonesCache.length} zones actives`,
      }));
    } catch (err) {
      // Cache expiré mais DB inaccessible → on garde le dernier cache connu
      console.error(JSON.stringify({
        level:   'ERROR', service: 'localisation-service',
        message: '[GeoFencing] Impossible de rafraîchir le cache des zones',
        error:   err.message,
      }));
    }
  }
}

// ─── Algorithme point-in-polygon (Ray Casting) ────────────────────────────────

/**
 * Détermine si un point GPS est à l'intérieur d'un polygone GeoJSON.
 *
 * Algorithme de ray casting (Jordan Curve Theorem) :
 *   On lance un rayon horizontal depuis le point (lat, lon) vers +∞.
 *   Si le rayon croise un nombre IMPAIR de côtés du polygone → point INTÉRIEUR.
 *   Si le rayon croise un nombre PAIR  de côtés du polygone → point EXTÉRIEUR.
 *
 * IMPORTANT : GeoJSON utilise l'ordre [longitude, latitude] — l'inverse de
 * la convention GPS (latitude, longitude). Le code compense cet ordre.
 *
 * Complexité : O(n) où n est le nombre de sommets du polygone.
 *
 * @param {number}   lat          - latitude du point à tester (degrés)
 * @param {number}   lon          - longitude du point à tester (degrés)
 * @param {Array[][]}polygonCoords - tableau GeoJSON [[[lon,lat], [lon,lat], ...]]
 * @returns {boolean} true si le point est à l'intérieur du polygone
 */
function pointInPolygon(lat, lon, polygonCoords) {
  // Ring extérieur du polygone (index 0)
  // En GeoJSON : ring[i] = [longitude, latitude]
  const ring = polygonCoords[0];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // xi = longitude du sommet i, yi = latitude
    const [xj, yj] = ring[j];

    // Condition 1 : le côté (j→i) traverse la latitude du point (yi vs yj)
    // Condition 2 : l'intersection du rayon horizontal est à gauche du point
    const intersect =
      (yi > lat) !== (yj > lat) &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

// ─── Détection des franchissements ────────────────────────────────────────────

/**
 * Point d'entrée public — sérialise les vérifications par véhicule pour éviter
 * que deux trames GPS arrivant en rafale lisent le même état avant qu'il soit mis à jour.
 *
 * Logique (voir _checkZoneCrossingSerial) :
 *   Avant = vehicleZoneState[vehicleId] (zones où il était)
 *   Après = zones où il est maintenant
 *   ZONE_EXIT  : était dedans et n'y est plus
 *   ZONE_ENTRY : n'y était pas et y est maintenant
 *
 * @param {{ vehicleId, latitude, longitude, timestamp }} gpsData
 */
function checkZoneCrossing(gpsData) {
  const { vehicleId } = gpsData;
  const prev = vehicleLocks.get(vehicleId) || Promise.resolve();
  const next = prev.then(() => _checkZoneCrossingSerial(gpsData));
  // Stocker une promesse qui ne peut pas rejeter pour éviter les chaînes rompues
  vehicleLocks.set(vehicleId, next.catch(() => {}));
  return next;
}

async function _checkZoneCrossingSerial(gpsData) {
  await refreshZonesIfNeeded();
  if (zonesCache.length === 0) return;

  const { vehicleId, latitude, longitude, timestamp } = gpsData;

  // Zones où le véhicule se trouve MAINTENANT
  const currentZones = new Set();
  for (const zone of zonesCache) {
    if (pointInPolygon(latitude, longitude, zone.polygon.coordinates)) {
      currentZones.add(zone.id);
    }
  }

  // Zones où le véhicule se trouvait AVANT (Set vide si première trame)
  const previousZones = vehicleZoneState.get(vehicleId) || new Set();

  // ── Détection ZONE_EXIT : était dedans, n'y est plus ─────────────────────
  for (const zoneId of previousZones) {
    if (!currentZones.has(zoneId)) {
      const zone = zonesCache.find((z) => z.id === zoneId);
      if (zone) await emitAlert(vehicleId, zone, 'ZONE_EXIT', latitude, longitude, timestamp);
    }
  }

  // ── Détection ZONE_ENTRY : n'y était pas, y est maintenant ───────────────
  for (const zoneId of currentZones) {
    if (!previousZones.has(zoneId)) {
      const zone = zonesCache.find((z) => z.id === zoneId);
      if (zone) await emitAlert(vehicleId, zone, 'ZONE_ENTRY', latitude, longitude, timestamp);
    }
  }

  // Mise à jour de l'état courant du véhicule
  vehicleZoneState.set(vehicleId, currentZones);
} // fin _checkZoneCrossingSerial

// ─── Émission d'alerte ────────────────────────────────────────────────────────

async function emitAlert(vehicleId, zone, type, latitude, longitude, timestamp) {
  const alert = {
    vehicleId,
    type,        // "ZONE_ENTRY" | "ZONE_EXIT"
    zoneId:    zone.id,
    zoneName:  zone.name,
    zoneType:  zone.type,   // "AUTHORIZED" | "FORBIDDEN"
    position:  { latitude, longitude },
    timestamp: timestamp || Date.now(),
  };

  // Niveau de log : WARN si sortie d'une zone autorisée ou entrée dans une zone interdite
  const isCritical =
    (type === 'ZONE_EXIT'  && zone.type === 'AUTHORIZED') ||
    (type === 'ZONE_ENTRY' && zone.type === 'FORBIDDEN');

  console.log(JSON.stringify({
    level:     isCritical ? 'WARN' : 'INFO',
    service:   'localisation-service',
    message:   `[GeoFencing] ${type} — ${zone.name} (${zone.type})`,
    vehicleId,
    zoneId:    zone.id,
    latitude,
    longitude,
  }));

  // Publication Kafka + persistance en DB en parallèle (non bloquant)
  await Promise.allSettled([
    kafkaProducer.publishGeoAlert(alert),
    repository.saveGeoAlert(vehicleId, zone.id, type, latitude, longitude),
  ]);
}

// ─── Helpers pour les tests ───────────────────────────────────────────────────

/** Injecte un cache de zones statiques (tests unitaires). */
function _setZonesForTest(zones) {
  zonesCache      = zones;
  lastCacheUpdate = Date.now() + CACHE_TTL_MS; // bloque le prochain refresh
}

/** Réinitialise l'état des véhicules (tests unitaires). */
function _resetVehicleStateForTest() {
  vehicleZoneState.clear();
  vehicleLocks.clear();
}

module.exports = {
  checkZoneCrossing,
  pointInPolygon,
  _setZonesForTest,
  _resetVehicleStateForTest,
};
