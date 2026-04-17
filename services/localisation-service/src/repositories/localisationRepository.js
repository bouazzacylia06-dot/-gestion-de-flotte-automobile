// =============================================================================
// repositories/localisationRepository.js — Couche d'accès TimescaleDB
//
// Toutes les requêtes utilisent des paramètres préparés ($1, $2…) pour
// prévenir les injections SQL. Les timestamps sont stockés en TIMESTAMPTZ
// (avec fuseau) → toujours convertir depuis/vers epoch ms côté Node.js.
// =============================================================================

const pool = require('../config/database');

const SCHEMA = 'service_localisation';

// ─── Écriture ─────────────────────────────────────────────────────────────────

/**
 * Persiste une position GPS validée dans TimescaleDB.
 * @param {{ vehicleId, latitude, longitude, speed, heading, timestamp, correlationId }} gpsData
 */
async function savePosition(gpsData) {
  const { vehicleId, latitude, longitude, speed, heading, timestamp, correlationId } = gpsData;

  await pool.query(
    `INSERT INTO ${SCHEMA}.positions
       (time, vehicle_id, latitude, longitude, speed, heading, correlation_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      new Date(timestamp),
      vehicleId,
      latitude,
      longitude,
      speed    ?? null,
      heading  ?? null,
      correlationId ?? null,
    ]
  );
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

/**
 * Récupère l'historique des positions dans une plage temporelle.
 * Si vehicleId est null/undefined, retourne toutes les positions (toutes flottes).
 * Utilise la construction dynamique de paramètres pour éviter l'injection SQL.
 *
 * @param {string|null} vehicleId  - UUID ou null pour toutes flottes
 * @param {number}      from       - epoch ms (0 = 24h avant maintenant)
 * @param {number}      to         - epoch ms (0 = maintenant)
 * @param {number}      [limit=100]- 0 = pas de limite (attention : coûteux)
 * @returns {Promise<Array>}
 */
async function getHistory(vehicleId, from, to, limit = 100) {
  const params   = [];
  const conditions = [];

  // Filtre véhicule optionnel
  if (vehicleId !== null && vehicleId !== undefined) {
    conditions.push(`vehicle_id = $${params.push(vehicleId)}`);
  }

  // Plage temporelle — valeurs par défaut si 0 ou absent
  const effectiveFrom = from || Date.now() - 86400000; // 24 h
  const effectiveTo   = to   || Date.now();
  conditions.push(`time >= $${params.push(new Date(effectiveFrom))}`);
  conditions.push(`time <= $${params.push(new Date(effectiveTo))}`);

  const where    = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitSql = limit > 0 ? `LIMIT $${params.push(limit)}` : '';

  const { rows } = await pool.query(
    `SELECT time, vehicle_id, latitude, longitude, speed, heading, correlation_id
     FROM   ${SCHEMA}.positions
     ${where}
     ORDER  BY time ASC
     ${limitSql}`,
    params
  );

  return rows.map(rowToGpsData);
}

/**
 * Récupère la dernière position connue d'un véhicule.
 * Grâce à l'index (vehicle_id, time DESC), cette requête est O(1) sur TimescaleDB.
 * @returns {Promise<Object|null>}
 */
async function getLastPosition(vehicleId) {
  const { rows } = await pool.query(
    `SELECT time, vehicle_id, latitude, longitude, speed, heading, correlation_id
     FROM   ${SCHEMA}.positions
     WHERE  vehicle_id = $1
     ORDER  BY time DESC
     LIMIT  1`,
    [vehicleId]
  );

  return rows.length > 0 ? rowToGpsData(rows[0]) : null;
}

/**
 * Agrégation TimescaleDB : position moyenne par heure via time_bucket().
 * time_bucket() est l'équivalent TimescaleDB de date_trunc() mais aligné sur
 * des intervalles arbitraires. Utile pour les résumés de trajet.
 *
 * @returns {Promise<Array<{ bucket, vehicle_id, avg_lat, avg_lon, avg_speed, count }>>}
 */
async function getHourlyAverage(vehicleId, from, to) {
  const effectiveFrom = from || Date.now() - 86400000;
  const effectiveTo   = to   || Date.now();

  const { rows } = await pool.query(
    `SELECT
       time_bucket('1 hour', time) AS bucket,
       vehicle_id,
       AVG(latitude)  AS avg_latitude,
       AVG(longitude) AS avg_longitude,
       AVG(speed)     AS avg_speed,
       COUNT(*)       AS count
     FROM   ${SCHEMA}.positions
     WHERE  vehicle_id = $1
       AND  time >= $2
       AND  time <= $3
     GROUP  BY bucket, vehicle_id
     ORDER  BY bucket ASC`,
    [vehicleId, new Date(effectiveFrom), new Date(effectiveTo)]
  );

  return rows;
}

// ─── GeoFencing ───────────────────────────────────────────────────────────────

/**
 * Charge toutes les zones de géofencing actives depuis la base.
 * Appelé au démarrage puis mis en cache 5 min dans GeoFencingService.
 */
async function getActiveZones() {
  const { rows } = await pool.query(
    `SELECT id, name, type, polygon
     FROM   ${SCHEMA}.zones_geofencing
     WHERE  active = true`
  );
  return rows;
}

/**
 * Persiste une alerte de franchissement de zone (audit trail).
 */
async function saveGeoAlert(vehicleId, zoneId, type, latitude, longitude) {
  await pool.query(
    `INSERT INTO ${SCHEMA}.geo_alerts (vehicle_id, zone_id, type, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5)`,
    [vehicleId, zoneId, type, latitude, longitude]
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convertit une ligne PostgreSQL en objet GPSData (compatible proto gRPC). */
function rowToGpsData(row) {
  return {
    vehicleId:     row.vehicle_id,
    latitude:      parseFloat(row.latitude),
    longitude:     parseFloat(row.longitude),
    speed:         row.speed   ? parseFloat(row.speed)   : 0,
    heading:       row.heading ? parseFloat(row.heading) : 0,
    timestamp:     row.time.getTime(), // TIMESTAMPTZ → epoch ms
    correlationId: row.correlation_id || '',
  };
}

module.exports = {
  savePosition,
  getHistory,
  getLastPosition,
  getHourlyAverage,
  getActiveZones,
  saveGeoAlert,
};
