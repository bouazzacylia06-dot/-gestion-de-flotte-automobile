-- =============================================================================
-- Fleet Management - PostgreSQL Schema for vehicule-service
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS service_vehicles;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status_enum') THEN
        CREATE TYPE vehicle_status_enum AS ENUM (
            'AVAILABLE',
            'IN_USE',
            'MAINTENANCE',
            'RETIRED'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS service_vehicles.vehicles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    immatriculation VARCHAR(20) NOT NULL,
    marque        VARCHAR(100) NOT NULL,
    "modèle"      VARCHAR(100) NOT NULL,
    statut        vehicle_status_enum NOT NULL DEFAULT 'AVAILABLE',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_vehicles_immatriculation UNIQUE (immatriculation)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_statut ON service_vehicles.vehicles(statut);
CREATE INDEX IF NOT EXISTS idx_vehicles_marque  ON service_vehicles.vehicles(marque);

CREATE OR REPLACE FUNCTION service_vehicles.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON service_vehicles.vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON service_vehicles.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION service_vehicles.update_updated_at_column();
