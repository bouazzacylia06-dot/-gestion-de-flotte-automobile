// =============================================================================
// config/database.js — Pool de connexions TimescaleDB
// TimescaleDB est une extension PostgreSQL → même client pg
// =============================================================================

const { Pool } = require('pg');

// Priorité : variables TIMESCALEDB_* spécifiques, fallback POSTGRES_* génériques
const pool = new Pool({
  host:     process.env.TIMESCALEDB_HOST     || process.env.POSTGRES_HOST     || 'localhost',
  port:     parseInt(process.env.TIMESCALEDB_PORT || process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.TIMESCALEDB_DB       || process.env.POSTGRES_DB       || 'fleet',
  user:     process.env.TIMESCALEDB_USER     || process.env.POSTGRES_USER     || 'flotte',
  password: process.env.TIMESCALEDB_PASSWORD || process.env.POSTGRES_PASSWORD || 'flotte123',
  max:                    10,    // connexions max simultanées
  idleTimeoutMillis:      30000, // libère une connexion idle après 30 s
  connectionTimeoutMillis: 5000, // échec si connexion non établie en 5 s
});

pool.on('error', (err) => {
  console.error(JSON.stringify({
    level: 'ERROR', service: 'localisation-service',
    message: 'Erreur inattendue sur le pool TimescaleDB',
    error: err.message,
  }));
});

module.exports = pool;
