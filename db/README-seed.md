# Database Seeding — Gestion de Flotte Automobile

> **DEV / STAGING ONLY — Ne pas utiliser en production.**

## Vue d'ensemble

Le fichier `db/seed.sql` est monté dans `/docker-entrypoint-initdb.d/` et s'exécute **automatiquement** au premier démarrage du conteneur PostgreSQL (volume `pgdata` vide). Il ne se ré-exécute **pas** sur un volume existant.

Les services conducteur et maintenance utilisent un stockage en mémoire (Map) — leurs sections dans le seed sont conditionnelles (`DO $$ IF EXISTS`) et s'activeront si ces services migrent vers PostgreSQL.

## Données insérées

| Table | Lignes | Description |
|---|---|---|
| `service_vehicles.vehicles` | 20 | 8 AVAILABLE · 8 IN_USE · 3 MAINTENANCE · 1 RETIRED |
| `service_localisation.positions` | 55 | Trajectoires GPS 7 derniers jours, Normandie + Paris |
| `service_localisation.zones_geofencing` | 3 | Seeded par `init-localisation.sql` (non modifié) |
| `service_localisation.geo_alerts` | 5 | Alertes zone interdite port de Rouen |
| `service_conducteurs.drivers` | 10 | *Conditionnel — table absente actuellement* |
| `service_conducteurs.assignments` | 15 | *Conditionnel — table absente actuellement* |
| `service_maintenance.maintenance_records` | 12 | *Conditionnel — table absente actuellement* |

## UUIDs de référence

### Véhicules `VEH_001..VEH_020` — format `11000000-0000-4000-a000-0000000000XX`

| ID | Immatriculation | Marque / Modèle | Statut |
|---|---|---|---|
| VEH_001 | AB-001-RA | Renault Clio V | AVAILABLE |
| VEH_002 | CD-002-PB | Peugeot 208 Active Pack | AVAILABLE |
| VEH_003 | EF-003-CC | Citroën C3 Feel Edition | AVAILABLE |
| VEH_004 | AB-004-RM | Renault Mégane IV Estate | IN_USE |
| VEH_005 | CD-005-P3 | Peugeot 3008 Allure Pack | IN_USE |
| VEH_006 | TY-006-YC | Toyota Yaris Cross | IN_USE |
| VEH_007 | VW-007-PL | Volkswagen Polo TSI 95 | IN_USE |
| VEH_008 | MB-008-CA | Mercedes Classe A 200d | MAINTENANCE |
| VEH_009 | AB-009-RK | Renault Kangoo dCi 95 | MAINTENANCE |
| VEH_010 | BM-010-B1 | BMW Série 1 118i | RETIRED |
| VEH_011 | VW-011-CB | Citroën Berlingo M | AVAILABLE |
| VEH_012 | AB-012-RT | Renault Trafic L2H1 | IN_USE |
| VEH_013 | CD-013-PE | Peugeot Expert Compact | IN_USE |
| VEH_014 | TY-014-TP | Toyota Proace Verso L2 | AVAILABLE |
| VEH_015 | VW-015-VT | Volkswagen Transporter T6.1 | IN_USE |
| VEH_016 | MB-016-MV | Mercedes Vito 116 CDI | MAINTENANCE |
| VEH_017 | EL-017-RZ | Renault Zoé E-Tech | AVAILABLE |
| VEH_018 | EL-018-PE | Peugeot e-208 GT | AVAILABLE |
| VEH_019 | EL-019-EB | Citroën ë-Berlingo XL | IN_USE |
| VEH_020 | BM-020-IX | BMW iX1 xDrive30 | AVAILABLE |

### Conducteurs `DRV_001..DRV_010` — format `22000000-0000-4000-a000-0000000000XX`

`DRV_001` Jean Martin · `DRV_002` Marie Dubois · `DRV_003` Pierre Bernard · `DRV_004` Sophie Moreau · `DRV_005` Thomas Laurent · `DRV_006` Isabelle Simon · `DRV_007` Antoine Michel · `DRV_008` Céline Lefebvre · `DRV_009` Nicolas Garcia · `DRV_010` Valérie Roux

## Utilisation

### Premier démarrage (automatique)
```bash
docker compose down -v   # reset volume
docker compose up -d     # seed exécuté automatiquement
```

### Re-seeding additif (véhicules dupliqués ignorés)
```bash
chmod 755 scripts/reseed.sh
./scripts/reseed.sh
```

### Re-seeding complet (TRUNCATE + re-insert)
```bash
./scripts/reseed.sh --clean
```

### Dry-run (voir sans exécuter)
```bash
./scripts/reseed.sh --clean --dry-run
```

### Vérification manuelle
```bash
docker compose exec postgres psql -U flotte -d fleet \
  -c "SELECT statut, COUNT(*) FROM service_vehicles.vehicles GROUP BY statut;"
```
