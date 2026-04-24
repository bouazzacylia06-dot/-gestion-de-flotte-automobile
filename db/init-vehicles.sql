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

-- =============================================================================
-- Données initiales — 20 véhicules normands réalistes
-- =============================================================================
INSERT INTO service_vehicles.vehicles (id, immatriculation, marque, "modèle", statut) VALUES
  ('11000000-0000-4000-a000-000000000001', 'AA-001-RN', 'Renault',    'Kangoo',              'IN_USE'),
  ('11000000-0000-4000-a000-000000000002', 'AA-002-RN', 'Renault',    'Trafic',              'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000003', 'AA-003-PG', 'Peugeot',    'Partner',             'IN_USE'),
  ('11000000-0000-4000-a000-000000000004', 'AA-004-PG', 'Peugeot',    'Expert',              'MAINTENANCE'),
  ('11000000-0000-4000-a000-000000000005', 'AA-005-CT', 'Citroën',    'Berlingo',            'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000006', 'AA-006-CT', 'Citroën',    'Jumpy',               'IN_USE'),
  ('11000000-0000-4000-a000-000000000007', 'AA-007-RN', 'Renault',    'Master',              'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000008', 'AA-008-PG', 'Peugeot',    'Boxer',               'IN_USE'),
  ('11000000-0000-4000-a000-000000000009', 'AA-009-VW', 'Volkswagen', 'Transporter',         'MAINTENANCE'),
  ('11000000-0000-4000-a000-000000000010', 'AA-010-TY', 'Toyota',     'ProAce',              'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000011', 'AA-011-RN', 'Renault',    'Mégane',              'IN_USE'),
  ('11000000-0000-4000-a000-000000000012', 'AA-012-PG', 'Peugeot',    '308',                 'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000013', 'AA-013-CT', 'Citroën',    'C4',                  'IN_USE'),
  ('11000000-0000-4000-a000-000000000014', 'AA-014-TY', 'Toyota',     'Corolla',             'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000015', 'AA-015-VW', 'Volkswagen', 'Golf',                'IN_USE'),
  ('11000000-0000-4000-a000-000000000016', 'AA-016-RN', 'Renault',    'Clio',                'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000017', 'AA-017-PG', 'Peugeot',    '208',                 'IN_USE'),
  ('11000000-0000-4000-a000-000000000018', 'AA-018-CT', 'Citroën',    'Jumper',              'AVAILABLE'),
  ('11000000-0000-4000-a000-000000000019', 'AA-019-TY', 'Toyota',     'RAV4',                'RETIRED'),
  ('11000000-0000-4000-a000-000000000020', 'AA-020-RN', 'Renault',    'Kadjar',              'AVAILABLE')
ON CONFLICT (id) DO NOTHING;
