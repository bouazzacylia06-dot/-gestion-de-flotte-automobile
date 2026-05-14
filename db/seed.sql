-- =============================================================================
-- db/seed.sql
-- Gestion de Flotte Automobile — M1 GIL, Université de Rouen
-- Version  : 1.0.0
-- Date     : 2026-04-24
-- Auteur   : Alexandre Fontaine <a.fontaine@flotte-normandie.fr>
--            Architecte système senior — 12 ans d'expérience microservices
--
-- Objectif : Peupler la base de données avec des données de développement
--            réalistes et cohérentes pour la plateforme de gestion de flotte.
--            20 véhicules · 55+ positions GPS · alertes géofencing.
--
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !!!   DEV / STAGING ONLY — NE PAS EXÉCUTER EN PRODUCTION   !!!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
--
-- Ce fichier est monté dans /docker-entrypoint-initdb.d/ et exécuté
-- automatiquement au PREMIER démarrage du conteneur PostgreSQL.
-- Il ne s'exécute PAS si le volume pgdata est déjà initialisé.
-- Pour re-seeder manuellement : ./scripts/reseed.sh [--clean]
--
-- Idempotence : les INSERT sur vehicles utilisent ON CONFLICT DO NOTHING.
--              Les positions (hypertable sans PK) sont sans conflit par design.
--              Les sections conducteurs/maintenance sont conditionnelles (DO $$).
--
-- Architecture réelle (important) :
--   · service_vehicles   → PostgreSQL (service_vehicles.vehicles)
--   · service_localisation → PostgreSQL/TimescaleDB (positions, zones, alerts)
--   · conducteur-service   → Map en mémoire (pas de table PostgreSQL)
--   · maintenance-service  → Map en mémoire (pas de table PostgreSQL)
--   Les sections conducteurs/maintenance sont future-proof (DO $$ conditionnel).
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- =============================================================================
-- SECTION 1 — service_vehicles.vehicles
-- 20 véhicules : mix marques françaises (Renault, Peugeot, Citroën)
--                & internationales (Toyota, Volkswagen, Mercedes, BMW)
-- Distribution : 8 AVAILABLE · 8 IN_USE · 3 MAINTENANCE · 1 RETIRED
--
-- UUIDs de référence (format v4 déterministe) :
--   VEH_001..VEH_020 → '11000000-0000-4000-a000-0000000000XX'
-- =============================================================================

INSERT INTO service_vehicles.vehicles
    (id,                                        immatriculation,  marque,        "modèle",                statut)
VALUES

-- ─── AVAILABLE (8) — en attente d'affectation au dépôt principal ─────────────

-- VEH_001 — Renault Clio V · citadine polyvalente · acquisition 2023
('11000000-0000-4000-a000-000000000001', 'AB-001-RA',      'Renault',     'Clio V',                'AVAILABLE'),

-- VEH_002 — Peugeot 208 · compacte urbaine · faible consommation
('11000000-0000-4000-a000-000000000002', 'CD-002-PB',      'Peugeot',     '208 Active Pack',       'AVAILABLE'),

-- VEH_003 — Citroën C3 · idéale missions urbaines courtes · diesel
('11000000-0000-4000-a000-000000000003', 'EF-003-CC',      'Citroën',     'C3 Feel Edition',       'AVAILABLE'),

-- VEH_011 — Citroën Berlingo · utilitaire léger polyvalent · 3 places
('11000000-0000-4000-a000-000000000011', 'VW-011-CB',      'Citroën',     'Berlingo M BlueHDi',    'AVAILABLE'),

-- VEH_014 — Toyota Proace · 9 places · missions formation / délégations
('11000000-0000-4000-a000-000000000014', 'TY-014-TP',      'Toyota',      'Proace Verso L2',       'AVAILABLE'),

-- VEH_017 — Renault Zoé E-Tech · 100% électrique · 395 km autonomie WLTP
('11000000-0000-4000-a000-000000000017', 'EL-017-RZ',      'Renault',     'Zoé E-Tech 100kW',      'AVAILABLE'),

-- VEH_018 — Peugeot e-208 · électrique citadine · acquisition 2024
('11000000-0000-4000-a000-000000000018', 'EL-018-PE',      'Peugeot',     'e-208 GT 136ch',        'AVAILABLE'),

-- VEH_020 — BMW iX1 · SUV électrique premium · usage direction
('11000000-0000-4000-a000-000000000020', 'BM-020-IX',      'BMW',         'iX1 xDrive30',          'AVAILABLE'),

-- ─── IN_USE (8) — véhicules en mission active (assignment actif) ──────────────

-- VEH_004 — Renault Mégane IV Estate · mission Rouen ↔ Le Havre · J. Martin
('11000000-0000-4000-a000-000000000004', 'AB-004-RM',      'Renault',     'Mégane IV Estate',      'IN_USE'),

-- VEH_005 — Peugeot 3008 · mission longue durée Paris · client Société Générale
('11000000-0000-4000-a000-000000000005', 'CD-005-P3',      'Peugeot',     '3008 Allure Pack',      'IN_USE'),

-- VEH_006 — Toyota Yaris Cross · livraisons urbaines Rouen intra-muros
('11000000-0000-4000-a000-000000000006', 'TY-006-YC',      'Toyota',      'Yaris Cross Design',    'IN_USE'),

-- VEH_007 — Volkswagen Polo · déplacement inter-sites Rouen ↔ Lisieux
('11000000-0000-4000-a000-000000000007', 'VW-007-PL',      'Volkswagen',  'Polo 1.0 TSI 95',       'IN_USE'),

-- VEH_012 — Renault Trafic L2H1 · livraisons B2B Normandie · T. Laurent
('11000000-0000-4000-a000-000000000012', 'AB-012-RT',      'Renault',     'Trafic L2H1 dCi 120',   'IN_USE'),

-- VEH_013 — Peugeot Expert · mission logistique fournisseurs · I. Simon
('11000000-0000-4000-a000-000000000013', 'CD-013-PE',      'Peugeot',     'Expert Compact 115ch',  'IN_USE'),

-- VEH_015 — Volkswagen Transporter · déménagement client Paris 15e · A. Michel
('11000000-0000-4000-a000-000000000015', 'VW-015-VT',      'Volkswagen',  'Transporter T6.1 L2',   'IN_USE'),

-- VEH_019 — Citroën ë-Berlingo · tournée commerciale électrique · C. Lefebvre
('11000000-0000-4000-a000-000000000019', 'EL-019-EB',      'Citroën',     'ë-Berlingo XL 136ch',   'IN_USE'),

-- ─── MAINTENANCE (3) — immobilisés pour intervention technique ───────────────

-- VEH_008 — Mercedes Classe A · freins avant usés · commande pièces en cours
('11000000-0000-4000-a000-000000000008', 'MB-008-CA',      'Mercedes',    'Classe A 200d 150ch',   'MAINTENANCE'),

-- VEH_009 — Renault Kangoo · révision annuelle 100 000 km · atelier interne
('11000000-0000-4000-a000-000000000009', 'AB-009-RK',      'Renault',     'Kangoo dCi 95 L1',      'MAINTENANCE'),

-- VEH_016 — Mercedes Vito · courroie distribution hors cote · prestataire ext.
('11000000-0000-4000-a000-000000000016', 'MB-016-MV',      'Mercedes',    'Vito 116 CDI L2 163ch', 'MAINTENANCE'),

-- ─── RETIRED (1) — hors service définitif (déclassement administratif) ────────

-- VEH_010 — BMW Série 1 · retraité à 127 000 km · usage intensif 2019-2024
('11000000-0000-4000-a000-000000000010', 'BM-010-B1',      'BMW',         'Série 1 118i 140ch',    'RETIRED')

ON CONFLICT (immatriculation) DO NOTHING;

-- =============================================================================
-- Mise à jour optionnelle des colonnes V006 (type_carburant, consommation,
-- date_derniere_revision). Ce bloc est no-op si la migration V006 n'a pas
-- été appliquée — robustesse garantie par le IF EXISTS.
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'service_vehicles'
      AND  table_name   = 'vehicles'
      AND  column_name  = 'type_carburant'
  ) THEN
    UPDATE service_vehicles.vehicles SET type_carburant = 'ESSENCE',    consommation_moyenne = 5.8,  date_derniere_revision = '2026-01-15' WHERE immatriculation = 'AB-001-RA';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ESSENCE',    consommation_moyenne = 5.5,  date_derniere_revision = '2026-02-10' WHERE immatriculation = 'CD-002-PB';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 4.9,  date_derniere_revision = '2025-11-20' WHERE immatriculation = 'EF-003-CC';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ESSENCE',    consommation_moyenne = 6.2,  date_derniere_revision = '2026-03-05' WHERE immatriculation = 'AB-004-RM';
    UPDATE service_vehicles.vehicles SET type_carburant = 'HYBRIDE',    consommation_moyenne = 5.1,  date_derniere_revision = '2026-01-28' WHERE immatriculation = 'CD-005-P3';
    UPDATE service_vehicles.vehicles SET type_carburant = 'HYBRIDE',    consommation_moyenne = 4.7,  date_derniere_revision = '2026-02-14' WHERE immatriculation = 'TY-006-YC';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ESSENCE',    consommation_moyenne = 5.9,  date_derniere_revision = '2025-12-10' WHERE immatriculation = 'VW-007-PL';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 5.3,  date_derniere_revision = '2026-01-10' WHERE immatriculation = 'MB-008-CA';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 5.7,  date_derniere_revision = '2025-10-15' WHERE immatriculation = 'AB-009-RK';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ESSENCE',    consommation_moyenne = 7.2,  date_derniere_revision = '2024-06-20' WHERE immatriculation = 'BM-010-B1';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 4.8,  date_derniere_revision = '2026-03-12' WHERE immatriculation = 'VW-011-CB';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 7.8,  date_derniere_revision = '2026-02-28' WHERE immatriculation = 'AB-012-RT';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 7.2,  date_derniere_revision = '2026-01-20' WHERE immatriculation = 'CD-013-PE';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 8.1,  date_derniere_revision = '2025-12-05' WHERE immatriculation = 'TY-014-TP';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 9.4,  date_derniere_revision = '2026-03-18' WHERE immatriculation = 'VW-015-VT';
    UPDATE service_vehicles.vehicles SET type_carburant = 'DIESEL',     consommation_moyenne = 8.8,  date_derniere_revision = '2025-11-30' WHERE immatriculation = 'MB-016-MV';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ELECTRIQUE', consommation_moyenne = 14.5, date_derniere_revision = '2026-02-08' WHERE immatriculation = 'EL-017-RZ';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ELECTRIQUE', consommation_moyenne = 15.2, date_derniere_revision = '2026-03-25' WHERE immatriculation = 'EL-018-PE';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ELECTRIQUE', consommation_moyenne = 18.1, date_derniere_revision = '2026-04-10' WHERE immatriculation = 'EL-019-EB';
    UPDATE service_vehicles.vehicles SET type_carburant = 'ELECTRIQUE', consommation_moyenne = 19.8, date_derniere_revision = '2026-04-05' WHERE immatriculation = 'BM-020-IX';
  END IF;
END $$;

-- =============================================================================
-- SECTION 2 — service_localisation.positions (hypertable TimescaleDB)
-- 55 positions GPS couvrant les 7 derniers jours (2026-04-17..2026-04-24)
-- Zone principale : Normandie (Rouen lat≈49.44 lon≈1.09)
-- Zone secondaire : Île-de-France (Paris lat≈48.85 lon≈2.35)
--
-- Timestamps absolus → idempotence garantie sur re-run avec --clean.
-- Sans --clean : les lignes s'ajoutent (pas de PK, pas de doublon détectable).
-- =============================================================================

INSERT INTO service_localisation.positions
    (time,                          vehicle_id,                              latitude,  longitude,  speed,   heading)
VALUES

-- ─── VEH_004 — Renault Mégane IV — Mission Rouen ↔ Le Havre (7 positions) ───
-- Scénario : mission logistique aller-retour sur 2 jours, A13

('2026-04-17 06:30:00+01', '11000000-0000-4000-a000-000000000004',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-17 08:15:00+01', '11000000-0000-4000-a000-000000000004',  49.4780,   0.9640,   108.0, 272.0),
('2026-04-17 09:45:00+01', '11000000-0000-4000-a000-000000000004',  49.4900,   0.1420,    55.0, 275.0),
('2026-04-18 07:00:00+01', '11000000-0000-4000-a000-000000000004',  49.4941,   0.1076,     0.0,   0.0),
('2026-04-18 13:30:00+01', '11000000-0000-4000-a000-000000000004',  49.4780,   0.9640,   103.0,  92.0),
('2026-04-18 15:15:00+01', '11000000-0000-4000-a000-000000000004',  49.4431,   1.0993,    32.0,  88.0),
('2026-04-18 16:00:00+01', '11000000-0000-4000-a000-000000000004',  49.4175,   1.0575,     0.0,   0.0),

-- ─── VEH_005 — Peugeot 3008 — Mission longue durée Paris (6 positions) ──────
-- Scénario : déplacement client Société Générale La Défense, 6 jours

('2026-04-18 06:30:00+01', '11000000-0000-4000-a000-000000000005',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-18 08:55:00+01', '11000000-0000-4000-a000-000000000005',  49.0050,   1.7230,   129.0, 152.0),
('2026-04-18 10:30:00+01', '11000000-0000-4000-a000-000000000005',  48.8922,   2.2356,     0.0,   0.0),
('2026-04-20 14:00:00+01', '11000000-0000-4000-a000-000000000005',  48.8566,   2.3522,    22.0,  45.0),
('2026-04-22 09:00:00+01', '11000000-0000-4000-a000-000000000005',  48.8922,   2.2356,     0.0,   0.0),
('2026-04-23 07:45:00+01', '11000000-0000-4000-a000-000000000005',  49.0050,   1.7230,   134.0, 332.0),

-- ─── VEH_006 — Toyota Yaris Cross — Livraisons urbaines Rouen (7 positions) ──
-- Scénario : tournée quotidienne de livraisons B2C intra-muros

('2026-04-19 08:00:00+01', '11000000-0000-4000-a000-000000000006',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-19 09:20:00+01', '11000000-0000-4000-a000-000000000006',  49.4431,   1.0993,    38.0,  88.0),
('2026-04-21 10:00:00+01', '11000000-0000-4000-a000-000000000006',  49.4200,   1.0700,    25.0, 182.0),
('2026-04-22 11:30:00+01', '11000000-0000-4000-a000-000000000006',  49.4600,   1.1100,    44.0,  12.0),
('2026-04-22 14:15:00+01', '11000000-0000-4000-a000-000000000006',  49.4500,   1.1200,    36.0,  95.0),
('2026-04-23 08:30:00+01', '11000000-0000-4000-a000-000000000006',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-24 09:00:00+01', '11000000-0000-4000-a000-000000000006',  49.4431,   1.0993,    24.0,  47.0),

-- ─── VEH_007 — Volkswagen Polo — Déplacement inter-sites Rouen↔Lisieux (6) ──
-- Scénario : réunion partenariat technique, aller J+0 retour J+1

('2026-04-20 07:15:00+01', '11000000-0000-4000-a000-000000000007',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-20 08:30:00+01', '11000000-0000-4000-a000-000000000007',  49.1810,   0.5820,    96.0, 212.0),
('2026-04-20 09:30:00+01', '11000000-0000-4000-a000-000000000007',  49.1463,   0.2214,     0.0,   0.0),
('2026-04-21 08:00:00+01', '11000000-0000-4000-a000-000000000007',  49.1463,   0.2214,     0.0,   0.0),
('2026-04-21 09:15:00+01', '11000000-0000-4000-a000-000000000007',  49.1810,   0.5820,    99.0,  31.0),
('2026-04-21 10:30:00+01', '11000000-0000-4000-a000-000000000007',  49.4175,   1.0575,     0.0,   0.0),

-- ─── VEH_012 — Renault Trafic — Livraisons B2B Normandie (7 positions) ───────
-- Scénario : tournée hebdomadaire, passage involontaire zone port (alerte)

('2026-04-17 05:45:00+01', '11000000-0000-4000-a000-000000000012',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-17 07:30:00+01', '11000000-0000-4000-a000-000000000012',  49.4431,   1.0993,    40.0,  92.0),
('2026-04-19 10:00:00+01', '11000000-0000-4000-a000-000000000012',  49.4700,   1.0850,    58.0,  18.0),
('2026-04-20 13:00:00+01', '11000000-0000-4000-a000-000000000012',  49.4550,   1.1050,    12.0,  62.0),
('2026-04-21 09:15:00+01', '11000000-0000-4000-a000-000000000012',  49.4431,   1.0993,    33.0, 275.0),
('2026-04-22 13:45:00+01', '11000000-0000-4000-a000-000000000012',  49.3000,   1.1500,    86.0, 182.0),
('2026-04-23 15:30:00+01', '11000000-0000-4000-a000-000000000012',  49.4175,   1.0575,     0.0,   0.0),

-- ─── VEH_013 — Peugeot Expert — Mission logistique Barentin/Yvetot (6) ───────
-- Scénario : collecte et livraison pièces fournisseurs zone Haute-Normandie

('2026-04-17 06:45:00+01', '11000000-0000-4000-a000-000000000013',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-19 08:15:00+01', '11000000-0000-4000-a000-000000000013',  49.4431,   1.0993,    46.0,  90.0),
('2026-04-21 10:30:00+01', '11000000-0000-4000-a000-000000000013',  49.5060,   1.0580,    74.0,   2.0),
('2026-04-22 11:15:00+01', '11000000-0000-4000-a000-000000000013',  49.6185,   0.7545,    90.0, 318.0),
('2026-04-23 09:00:00+01', '11000000-0000-4000-a000-000000000013',  49.4431,   1.0993,    34.0, 138.0),
('2026-04-24 07:15:00+01', '11000000-0000-4000-a000-000000000013',  49.4175,   1.0575,     0.0,   0.0),

-- ─── VEH_015 — VW Transporter — Déménagement client Paris 15e (6 positions) ──
-- Scénario : transport matériel lourd aller J+0, livraison J+1, retour J+2

('2026-04-18 05:30:00+01', '11000000-0000-4000-a000-000000000015',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-18 07:45:00+01', '11000000-0000-4000-a000-000000000015',  49.4431,   1.0993,    28.0,  90.0),
('2026-04-18 10:15:00+01', '11000000-0000-4000-a000-000000000015',  48.9800,   1.7300,   116.0, 152.0),
('2026-04-19 09:00:00+01', '11000000-0000-4000-a000-000000000015',  48.8477,   2.2935,    19.0,  47.0),
('2026-04-20 14:00:00+01', '11000000-0000-4000-a000-000000000015',  48.8566,   2.3522,     0.0,   0.0),
('2026-04-21 16:30:00+01', '11000000-0000-4000-a000-000000000015',  49.4175,   1.0575,     0.0,   0.0),

-- ─── VEH_019 — Citroën ë-Berlingo — Tournée commerciale électrique (6) ───────
-- Scénario : prospection clients zone nord Rouen, véhicule 100% électrique

('2026-04-19 07:45:00+01', '11000000-0000-4000-a000-000000000019',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-20 09:00:00+01', '11000000-0000-4000-a000-000000000019',  49.4431,   1.0993,    29.0,  90.0),
('2026-04-21 10:30:00+01', '11000000-0000-4000-a000-000000000019',  49.4700,   1.1050,    36.0,  15.0),
('2026-04-22 11:00:00+01', '11000000-0000-4000-a000-000000000019',  49.4100,   1.0950,    23.0, 182.0),
('2026-04-23 09:30:00+01', '11000000-0000-4000-a000-000000000019',  49.4431,   1.0993,    20.0, 272.0),
('2026-04-24 08:00:00+01', '11000000-0000-4000-a000-000000000019',  49.4175,   1.0575,     0.0,   0.0),

-- ─── VEH_001 — Renault Clio — Stationnée au dépôt (2 positions) ─────────────
-- Scénario : véhicule AVAILABLE, traceur actif au dépôt

('2026-04-22 08:00:00+01', '11000000-0000-4000-a000-000000000001',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-24 08:00:00+01', '11000000-0000-4000-a000-000000000001',  49.4175,   1.0575,     0.0,   0.0),

-- ─── VEH_017 — Renault Zoé — En recharge au dépôt (2 positions) ─────────────
-- Scénario : véhicule AVAILABLE, connecté à la borne de recharge

('2026-04-21 16:00:00+01', '11000000-0000-4000-a000-000000000017',  49.4175,   1.0575,     0.0,   0.0),
('2026-04-23 08:00:00+01', '11000000-0000-4000-a000-000000000017',  49.4175,   1.0575,     0.0,   0.0)

;

-- =============================================================================
-- SECTION 3 — service_localisation.geo_alerts
-- Alertes géofencing générées lors des passages en zones surveillées.
-- Les zone_id sont récupérés par subquery (UUIDs dynamiques dans initdb).
-- Non idempotent (pas de PK déterministe) — géré par reseed.sh --clean.
-- =============================================================================

-- Alerte 1 : VEH_012 entre dans la zone interdite du port (2026-04-20 12:45)
INSERT INTO service_localisation.geo_alerts (vehicle_id, zone_id, type, latitude, longitude, created_at)
SELECT
    '11000000-0000-4000-a000-000000000012',
    zg.id,
    'ZONE_ENTRY',
    49.4520,
    1.1020,
    '2026-04-20 12:45:00+01'
FROM service_localisation.zones_geofencing zg
WHERE zg.name = 'Zone Interdite Port de Rouen'
LIMIT 1;

-- Alerte 2 : VEH_012 sort de la zone interdite du port (2026-04-20 13:05)
INSERT INTO service_localisation.geo_alerts (vehicle_id, zone_id, type, latitude, longitude, created_at)
SELECT
    '11000000-0000-4000-a000-000000000012',
    zg.id,
    'ZONE_EXIT',
    49.4560,
    1.1070,
    '2026-04-20 13:05:00+01'
FROM service_localisation.zones_geofencing zg
WHERE zg.name = 'Zone Interdite Port de Rouen'
LIMIT 1;

-- Alerte 3 : VEH_015 entre dans zone interdite port (passage rapide A13→Paris)
INSERT INTO service_localisation.geo_alerts (vehicle_id, zone_id, type, latitude, longitude, created_at)
SELECT
    '11000000-0000-4000-a000-000000000015',
    zg.id,
    'ZONE_ENTRY',
    49.4510,
    1.1010,
    '2026-04-18 10:10:00+01'
FROM service_localisation.zones_geofencing zg
WHERE zg.name = 'Zone Interdite Port de Rouen'
LIMIT 1;

-- Alerte 4 : VEH_015 sort de la zone interdite port
INSERT INTO service_localisation.geo_alerts (vehicle_id, zone_id, type, latitude, longitude, created_at)
SELECT
    '11000000-0000-4000-a000-000000000015',
    zg.id,
    'ZONE_EXIT',
    49.4530,
    1.1040,
    '2026-04-18 10:22:00+01'
FROM service_localisation.zones_geofencing zg
WHERE zg.name = 'Zone Interdite Port de Rouen'
LIMIT 1;

-- Alerte 5 : VEH_004 arrive au dépôt (zone autorisée)
INSERT INTO service_localisation.geo_alerts (vehicle_id, zone_id, type, latitude, longitude, created_at)
SELECT
    '11000000-0000-4000-a000-000000000004',
    zg.id,
    'ZONE_ENTRY',
    49.4180,
    1.0580,
    '2026-04-18 16:00:00+01'
FROM service_localisation.zones_geofencing zg
WHERE zg.name = 'Dépôt Principal Flotte'
LIMIT 1;

-- =============================================================================
-- SECTION 4 — service_conducteurs (conditionnel — future-proof)
-- Ce bloc est NO-OP si la table drivers n'existe pas (service en mémoire).
-- Il s'activera automatiquement si le service migre vers PostgreSQL.
--
-- UUIDs conducteurs : '22000000-0000-4000-a000-0000000000XX'
-- UUIDs assignments : '33000000-0000-4000-a000-0000000000XX'
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE  table_schema = 'service_conducteurs'
      AND  table_name   = 'drivers'
  ) THEN

    INSERT INTO service_conducteurs.drivers
        (id,                                       keycloak_id,      "numéro_permis",     nom,        "prénom",    "téléphone",           email)
    VALUES
    ('22000000-0000-4000-a000-000000000001', 'user-uuid-001', 'PERMIS-FR-ML7845', 'Martin',   'Jean',      '+33 6 12 34 56 78', 'j.martin@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000002', 'user-uuid-002', 'PERMIS-FR-MD9231', 'Dubois',   'Marie',     '+33 6 23 45 67 89', 'm.dubois@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000003', 'user-uuid-003', 'PERMIS-FR-BP4567', 'Bernard',  'Pierre',    '+33 6 34 56 78 90', 'p.bernard@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000004', 'user-uuid-004', 'PERMIS-FR-MS8901', 'Moreau',   'Sophie',    '+33 6 45 67 89 01', 's.moreau@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000005', 'user-uuid-005', 'PERMIS-FR-LT2345', 'Laurent',  'Thomas',    '+33 6 56 78 90 12', 't.laurent@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000006', 'user-uuid-006', 'PERMIS-FR-SI6789', 'Simon',    'Isabelle',  '+33 6 67 89 01 23', 'i.simon@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000007', 'user-uuid-007', 'PERMIS-FR-MA1234', 'Michel',   'Antoine',   '+33 6 78 90 12 34', 'a.michel@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000008', 'user-uuid-008', 'PERMIS-FR-LC5678', 'Lefebvre', 'Céline',    '+33 6 89 01 23 45', 'c.lefebvre@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000009', 'user-uuid-009', 'PERMIS-FR-GN9012', 'Garcia',   'Nicolas',   '+33 6 90 12 34 56', 'n.garcia@flotte-rouen.fr'),
    ('22000000-0000-4000-a000-000000000010', 'user-uuid-010', 'PERMIS-FR-RV3456', 'Roux',     'Valérie',   '+33 6 01 23 45 67', 'v.roux@flotte-rouen.fr')
    ON CONFLICT ("numéro_permis") DO NOTHING;

    INSERT INTO service_conducteurs.assignments
        (id,                                       driver_id,                               vehicle_id,                              "date_début",                date_fin,                    motif)
    VALUES
    -- Assignments actifs (date_fin NULL = véhicule IN_USE)
    ('33000000-0000-4000-a000-000000000001', '22000000-0000-4000-a000-000000000001', '11000000-0000-4000-a000-000000000004', '2026-04-17 06:00:00+01', NULL,                      'Mission logistique Rouen – Le Havre, client Norbert Dentressangle'),
    ('33000000-0000-4000-a000-000000000002', '22000000-0000-4000-a000-000000000002', '11000000-0000-4000-a000-000000000005', '2026-04-18 06:00:00+01', NULL,                      'Déplacement longue durée Paris, client Société Générale La Défense'),
    ('33000000-0000-4000-a000-000000000003', '22000000-0000-4000-a000-000000000003', '11000000-0000-4000-a000-000000000006', '2026-04-19 07:30:00+01', NULL,                      'Tournée livraisons urbaines Rouen intra-muros, 3 clients'),
    ('33000000-0000-4000-a000-000000000004', '22000000-0000-4000-a000-000000000004', '11000000-0000-4000-a000-000000000007', '2026-04-20 07:00:00+01', NULL,                      'Déplacement inter-sites Rouen – Lisieux, réunion partenariat'),
    ('33000000-0000-4000-a000-000000000005', '22000000-0000-4000-a000-000000000005', '11000000-0000-4000-a000-000000000012', '2026-04-17 05:30:00+01', NULL,                      'Livraison B2B Normandie, tournée hebdomadaire secteur nord'),
    ('33000000-0000-4000-a000-000000000006', '22000000-0000-4000-a000-000000000006', '11000000-0000-4000-a000-000000000013', '2026-04-17 06:30:00+01', NULL,                      'Mission logistique fournisseurs Barentin – Yvetot, collecte pièces'),
    ('33000000-0000-4000-a000-000000000007', '22000000-0000-4000-a000-000000000007', '11000000-0000-4000-a000-000000000015', '2026-04-18 05:00:00+01', NULL,                      'Déménagement client Paris 15e, transport matériel lourd'),
    ('33000000-0000-4000-a000-000000000008', '22000000-0000-4000-a000-000000000008', '11000000-0000-4000-a000-000000000019', '2026-04-19 07:30:00+01', NULL,                      'Tournée commerciale zone Bois-Guillaume / Sotteville, 7 RDV'),
    -- Assignments historiques terminés
    ('33000000-0000-4000-a000-000000000009', '22000000-0000-4000-a000-000000000009', '11000000-0000-4000-a000-000000000001', '2026-04-10 08:00:00+01', '2026-04-15 18:00:00+01', 'Livraison documents administratifs préfecture, mission ponctuelle'),
    ('33000000-0000-4000-a000-000000000010', '22000000-0000-4000-a000-000000000010', '11000000-0000-4000-a000-000000000002', '2026-04-08 09:00:00+01', '2026-04-12 17:30:00+01', 'Formation conduite économique et éco-responsable, 4 jours'),
    ('33000000-0000-4000-a000-000000000011', '22000000-0000-4000-a000-000000000001', '11000000-0000-4000-a000-000000000010', '2026-02-01 08:00:00+01', '2026-03-15 18:00:00+01', 'Mission commerciale régionale avant mise en retraite définitive VEH_010'),
    ('33000000-0000-4000-a000-000000000012', '22000000-0000-4000-a000-000000000003', '11000000-0000-4000-a000-000000000008', '2026-04-05 07:30:00+01', '2026-04-12 18:00:00+01', 'Transport matériel informatique client, avant immobilisation technique'),
    ('33000000-0000-4000-a000-000000000013', '22000000-0000-4000-a000-000000000005', '11000000-0000-4000-a000-000000000009', '2026-03-20 08:00:00+01', '2026-04-02 17:00:00+01', 'Collecte pièces atelier avant révision planifiée 100 000 km'),
    ('33000000-0000-4000-a000-000000000014', '22000000-0000-4000-a000-000000000007', '11000000-0000-4000-a000-000000000011', '2026-04-01 07:00:00+01', '2026-04-10 18:00:00+01', 'Mission inter-agences Normandie, tournée 3 villes'),
    ('33000000-0000-4000-a000-000000000015', '22000000-0000-4000-a000-000000000009', '11000000-0000-4000-a000-000000000014', '2026-03-15 09:00:00+01', '2026-03-18 17:30:00+01', 'Transport délégation universitaire visite partenaire industriel')
    ON CONFLICT (id) DO NOTHING;

  END IF;
END $$;

-- =============================================================================
-- SECTION 5 — service_maintenance (conditionnel — future-proof)
-- Ce bloc est NO-OP si la table maintenance_records n'existe pas.
-- 12 interventions : 3 EN_COURS (= 3 véhicules MAINTENANCE) · 4 TERMINÉ
--                    3 PLANIFIÉ · 1 ANNULÉ · 1 TERMINÉ historique
--
-- UUIDs maintenances : '44000000-0000-4000-a000-0000000000XX'
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE  table_schema = 'service_maintenance'
      AND  table_name   = 'maintenance_records'
  ) THEN

    INSERT INTO service_maintenance.maintenance_records
        (id,                                       vehicle_id,                              type_maintenance,  description,                                                   "coût",   cout_estime,  "date_début",                date_fin,                    statut)
    VALUES
    -- EN_COURS (3 — véhicules immobilisés MAINTENANCE)
    ('44000000-0000-4000-a000-000000000001', '11000000-0000-4000-a000-000000000008', 'CURATIVE',   'Remplacement plaquettes et disques de frein avant — pièces en attente', 320.00,  350.00,       '2026-04-14 08:00:00+01', NULL,                      'EN_COURS'),
    ('44000000-0000-4000-a000-000000000002', '11000000-0000-4000-a000-000000000009', 'PREVENTIVE', 'Révision complète 100 000 km : vidange, filtres, distribution, géom.',    480.00,  500.00,       '2026-04-20 07:30:00+01', NULL,                      'EN_COURS'),
    ('44000000-0000-4000-a000-000000000003', '11000000-0000-4000-a000-000000000016', 'CURATIVE',   'Remplacement courroie de distribution + kit tendeur, prestataire agréé', 650.00,  680.00,       '2026-04-22 09:00:00+01', NULL,                      'EN_COURS'),
    -- TERMINÉ (5 — historique des interventions réalisées)
    ('44000000-0000-4000-a000-000000000004', '11000000-0000-4000-a000-000000000004', 'PREVENTIVE', 'Vidange moteur + filtre huile + filtre à air, 60 000 km',                  95.00,   90.00,       '2026-03-05 08:00:00+01', '2026-03-05 11:30:00+01', 'TERMINÉ'),
    ('44000000-0000-4000-a000-000000000005', '11000000-0000-4000-a000-000000000005', 'PREVENTIVE', 'Contrôle technique biennal réglementaire, résultat favorable',              82.00,   85.00,       '2026-02-14 09:00:00+01', '2026-02-14 10:30:00+01', 'TERMINÉ'),
    ('44000000-0000-4000-a000-000000000006', '11000000-0000-4000-a000-000000000010', 'CURATIVE',   'Réparation boîte de vitesses automatique, dernier entretien avant retraite', 1240.00, 1200.00, '2024-10-08 08:00:00+01', '2024-10-11 17:00:00+01', 'TERMINÉ'),
    ('44000000-0000-4000-a000-000000000007', '11000000-0000-4000-a000-000000000006', 'PREVENTIVE', 'Remplacement 4 pneumatiques Michelin Energy Saver, équilibrage',            420.00,  400.00,       '2026-01-22 08:30:00+01', '2026-01-22 12:00:00+01', 'TERMINÉ'),
    ('44000000-0000-4000-a000-000000000012', '11000000-0000-4000-a000-000000000007', 'PREVENTIVE', 'Vidange + filtre + contrôle niveaux 50 000 km, atelier interne',            88.00,   90.00,       '2025-12-10 08:00:00+01', '2025-12-10 10:00:00+01', 'TERMINÉ'),
    -- PLANIFIÉ (3 — interventions à venir confirmées)
    ('44000000-0000-4000-a000-000000000008', '11000000-0000-4000-a000-000000000012', 'PREVENTIVE', 'Révision annuelle 1 an / 40 000 km, RDV atelier confirmé',                 NULL,    320.00,       '2026-05-12 08:00:00+01', NULL,                      'PLANIFIÉ'),
    ('44000000-0000-4000-a000-000000000009', '11000000-0000-4000-a000-000000000013', 'CURATIVE',   'Inspection système de freinage avant (bruit suspect signalé conducteur)', NULL,    280.00,       '2026-05-06 08:30:00+01', NULL,                      'PLANIFIÉ'),
    ('44000000-0000-4000-a000-000000000010', '11000000-0000-4000-a000-000000000001', 'PREVENTIVE', 'Contrôle technique biennal, date limite 2026-06-30',                        NULL,     85.00,       '2026-06-15 09:00:00+01', NULL,                      'PLANIFIÉ'),
    -- ANNULÉ (1)
    ('44000000-0000-4000-a000-000000000011', '11000000-0000-4000-a000-000000000015', 'PREVENTIVE', 'Remplacement filtres habitacle — annulé, atelier complet, reporté',         NULL,     60.00,       '2026-04-10 08:00:00+01', NULL,                      'ANNULÉ')
    ON CONFLICT (id) DO NOTHING;

  END IF;
END $$;

-- =============================================================================
-- SEED VERIFICATION — Comptages attendus après seeding réussi
-- Exécuter manuellement pour valider :
--   docker compose exec postgres psql -U flotte -d fleet -f /dev/stdin < db/seed.sql
-- =============================================================================

SELECT '════ SEED VERIFICATION ════'                                                         AS info;
SELECT 'service_vehicles.vehicles'           AS "Table",      COUNT(*) AS "Total",
       COUNT(*) FILTER (WHERE statut = 'AVAILABLE')   AS "AVAILABLE",
       COUNT(*) FILTER (WHERE statut = 'IN_USE')      AS "IN_USE",
       COUNT(*) FILTER (WHERE statut = 'MAINTENANCE') AS "MAINTENANCE",
       COUNT(*) FILTER (WHERE statut = 'RETIRED')     AS "RETIRED"
FROM   service_vehicles.vehicles;

SELECT 'service_localisation.positions'      AS "Table",      COUNT(*) AS "Total"
FROM   service_localisation.positions;

SELECT 'service_localisation.zones_geofencing' AS "Table",   COUNT(*) AS "Total"
FROM   service_localisation.zones_geofencing;

SELECT 'service_localisation.geo_alerts'     AS "Table",      COUNT(*) AS "Total",
       COUNT(*) FILTER (WHERE type = 'ZONE_ENTRY') AS "ZONE_ENTRY",
       COUNT(*) FILTER (WHERE type = 'ZONE_EXIT')  AS "ZONE_EXIT"
FROM   service_localisation.geo_alerts;

SELECT '── Dernières 5 positions GPS ──' AS info;
SELECT vehicle_id, latitude, longitude, speed, time
FROM   service_localisation.positions
ORDER  BY time DESC
LIMIT  5;

-- =============================================================================
-- END OF SEED v1.0.0
-- Expected counts :
--   vehicles          : 20 (8 AVAILABLE · 8 IN_USE · 3 MAINTENANCE · 1 RETIRED)
--   positions         : 55
--   zones_geofencing  :  3 (seeded by init-localisation.sql)
--   geo_alerts        :  5
-- =============================================================================

COMMIT;
