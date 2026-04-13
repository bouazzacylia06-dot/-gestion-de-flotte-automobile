// =============================================================================
// services/gpsDataProcessor.js — Validation et nettoyage des trames GPS
//
// Ce composant est le gardien de la qualité des données :
// - Rejette les coordonnées impossibles (hors Terre)
// - Rejette les vitesses physiquement impossibles (> 250 km/h pour un véhicule)
// - Calcule la distance entre deux points via la formule de Haversine
// =============================================================================

/** Vitesse maximale admissible pour un véhicule terrestre de flotte. */
const MAX_SPEED_KMH   = 250;

/** Rayon moyen de la Terre en km (WGS-84 mean radius). */
const EARTH_RADIUS_KM = 6371;

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Valide et normalise une trame GPS brute.
 *
 * @param {Object} gpsData - trame brute reçue du traceur
 * @returns {{ valid: boolean, reason?: string, data?: Object }}
 *   - valid=true  → data contient la trame normalisée prête à persister
 *   - valid=false → reason décrit le motif de rejet
 */
function process(gpsData) {
  const { vehicleId, latitude, longitude, speed, heading, timestamp, correlationId } = gpsData;

  // ── 1. vehicleId ──────────────────────────────────────────────────────────
  if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim() === '') {
    return { valid: false, reason: 'vehicleId manquant ou invalide' };
  }

  // ── 2. Coordonnées GPS ───────────────────────────────────────────────────
  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return { valid: false, reason: `Latitude invalide: ${latitude} (attendu: [-90, 90])` };
  }
  if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { valid: false, reason: `Longitude invalide: ${longitude} (attendu: [-180, 180])` };
  }

  // ── 3. Vitesse aberrante ─────────────────────────────────────────────────
  // Un véhicule terrestre ne peut physiquement dépasser 250 km/h.
  // Au-delà : erreur de traceur GPS (bruit de signal) ou fraude.
  // Règle : speed === null est autorisé (traceur sans capteur de vitesse).
  if (speed != null && (typeof speed !== 'number' || speed > MAX_SPEED_KMH || speed < 0)) {
    return {
      valid:  false,
      reason: `Vitesse aberrante: ${speed} km/h (max autorisé: ${MAX_SPEED_KMH} km/h)`,
    };
  }

  // ── 4. Timestamp ─────────────────────────────────────────────────────────
  const ts = timestamp || Date.now();
  if (typeof ts !== 'number' || isNaN(ts) || ts <= 0) {
    return { valid: false, reason: `Timestamp invalide: ${timestamp}` };
  }

  // ── Données normalisées ───────────────────────────────────────────────────
  return {
    valid: true,
    data: {
      vehicleId:     vehicleId.trim(),
      latitude,
      longitude,
      speed:         speed   ?? 0,
      heading:       heading ?? 0,
      timestamp:     ts,
      correlationId: correlationId || '',
    },
  };
}

// ─── Calcul géographique ──────────────────────────────────────────────────────

/**
 * Calcule la distance orthodromique (grand cercle) entre deux points GPS
 * en utilisant la formule de Haversine.
 *
 * Théorie :
 *   Soit deux points (φ1,λ1) et (φ2,λ2) en radians.
 *   a = sin²(Δφ/2) + cos(φ1)·cos(φ2)·sin²(Δλ/2)
 *   c = 2·atan2(√a, √(1−a))   ← angle central en radians
 *   d = R·c                    ← distance en km (R = 6371 km)
 *
 * Précision : < 0.5 % pour des distances < 1 000 km.
 * Limitation : ne tient pas compte de l'altitude (négligeable pour la flotte).
 *
 * @param {number} lat1 - latitude  point 1 (degrés décimaux)
 * @param {number} lon1 - longitude point 1 (degrés décimaux)
 * @param {number} lat2 - latitude  point 2 (degrés décimaux)
 * @param {number} lon2 - longitude point 2 (degrés décimaux)
 * @returns {number} distance en kilomètres (≥ 0)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  // atan2 est plus stable numériquement que asin pour les petits angles
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

module.exports = { process, haversineDistance, MAX_SPEED_KMH };
