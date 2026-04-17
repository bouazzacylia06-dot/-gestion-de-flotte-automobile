-- =============================================================================
-- init-localisation.sql — Schema TimescaleDB du Service Localisation
-- Gestion de Flotte Automobile — M1 GIL, Université de Rouen
--
-- Prérequis : image timescale/timescaledb-ha:pg15-latest
-- Ce fichier est monté dans /docker-entrypoint-initdb.d/ et exécuté
-- automatiquement au premier démarrage du conteneur.
-- =============================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
-- timescaledb : partitionnement automatique des séries temporelles par chunks
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
-- uuid-ossp   : génération d'UUID v4 en SQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Schema isolé ─────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS service_localisation;

-- =============================================================================
-- Table POSITIONS (hypertable TimescaleDB)
-- =============================================================================
-- Remarque architecturale :
--   La colonne 'time' DOIT être la PREMIÈRE dans le ORDER BY des requêtes
--   courantes. TimescaleDB crée des chunks (partitions) d'1 jour → ~86 400
--   lignes par véhicule/jour à 1 position/seconde. Les requêtes sur une plage
--   temporelle récente n'accèdent qu'aux derniers chunks (partition pruning).
CREATE TABLE IF NOT EXISTS service_localisation.positions (
    time           TIMESTAMPTZ      NOT NULL,
    vehicle_id     UUID             NOT NULL,
    latitude       DOUBLE PRECISION NOT NULL
                   CONSTRAINT chk_lat CHECK (latitude  >= -90  AND latitude  <=  90),
    longitude      DOUBLE PRECISION NOT NULL
                   CONSTRAINT chk_lon CHECK (longitude >= -180 AND longitude <= 180),
    speed          REAL
                   CONSTRAINT chk_spd CHECK (speed IS NULL OR speed >= 0),
    heading        REAL
                   CONSTRAINT chk_hdg CHECK (heading IS NULL OR (heading >= 0 AND heading < 360)),
    correlation_id TEXT
);

-- Conversion en hypertable TimescaleDB
-- chunk_time_interval = 1 jour → compression possible après 7 jours en prod
SELECT create_hypertable(
    'service_localisation.positions',
    'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists       => TRUE
);

-- Index composite : accès à l'historique d'un véhicule (pattern le plus fréquent)
-- DESC sur time → la requête "dernière position" est O(1)
CREATE INDEX IF NOT EXISTS idx_positions_vehicle_time
    ON service_localisation.positions (vehicle_id, time DESC);

-- =============================================================================
-- Table ZONES_GEOFENCING
-- =============================================================================
-- Stocke les polygones GeoJSON des zones autorisées/interdites.
-- Format polygon : { "type": "Polygon", "coordinates": [[[lon,lat], ...]] }
-- IMPORTANT : GeoJSON utilise [longitude, latitude] — ordre inverse de GPS !
CREATE TABLE IF NOT EXISTS service_localisation.zones_geofencing (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT        NOT NULL,
    type       TEXT        NOT NULL
               CONSTRAINT chk_zone_type CHECK (type IN ('AUTHORIZED', 'FORBIDDEN')),
    polygon    JSONB       NOT NULL,  -- GeoJSON Polygon
    active     BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index partiel : seules les zones actives sont interrogées à chaque trame GPS
CREATE INDEX IF NOT EXISTS idx_zones_active
    ON service_localisation.zones_geofencing (active)
    WHERE active = true;

-- =============================================================================
-- Table GEO_ALERTS (audit trail des franchissements de zones)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_localisation.geo_alerts (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID        NOT NULL,
    zone_id    UUID        NOT NULL
               REFERENCES service_localisation.zones_geofencing(id),
    type       TEXT        NOT NULL
               CONSTRAINT chk_alert_type CHECK (type IN ('ZONE_ENTRY', 'ZONE_EXIT')),
    latitude   DOUBLE PRECISION NOT NULL,
    longitude  DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_vehicle
    ON service_localisation.geo_alerts (vehicle_id, created_at DESC);

-- =============================================================================
-- SEED : 3 zones de géofencing autour de Rouen
-- =============================================================================
-- Toutes les coordonnées suivent l'ordre GeoJSON : [longitude, latitude]
INSERT INTO service_localisation.zones_geofencing (name, type, polygon, active) VALUES

-- Zone 1 : Campus Université de Rouen (AUTORISÉE)
-- Rectangle ~800m × 900m autour du campus de Mont-Saint-Aignan
(
    'Campus Université de Rouen',
    'AUTHORIZED',
    '{
      "type": "Polygon",
      "coordinates": [[
        [1.0640, 49.3890],
        [1.0780, 49.3890],
        [1.0780, 49.3970],
        [1.0640, 49.3970],
        [1.0640, 49.3890]
      ]]
    }',
    true
),

-- Zone 2 : Port de Rouen (INTERDITE)
-- Zone industrielle portuaire — accès interdit aux véhicules de flotte
(
    'Zone Interdite Port de Rouen',
    'FORBIDDEN',
    '{
      "type": "Polygon",
      "coordinates": [[
        [1.0800, 49.4400],
        [1.1200, 49.4400],
        [1.1200, 49.4700],
        [1.0800, 49.4700],
        [1.0800, 49.4400]
      ]]
    }',
    true
),

-- Zone 3 : Dépôt principal de la flotte (AUTORISÉE)
-- Zone de stationnement et d'entretien des véhicules
(
    'Dépôt Principal Flotte',
    'AUTHORIZED',
    '{
      "type": "Polygon",
      "coordinates": [[
        [1.0500, 49.4100],
        [1.0650, 49.4100],
        [1.0650, 49.4250],
        [1.0500, 49.4250],
        [1.0500, 49.4100]
      ]]
    }',
    true
)

