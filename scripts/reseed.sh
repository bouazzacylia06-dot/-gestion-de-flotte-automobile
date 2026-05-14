#!/usr/bin/env bash
# =============================================================================
# scripts/reseed.sh
# Gestion de Flotte Automobile — M1 GIL, Université de Rouen
# Version : 1.0.0
#
# Usage : ./scripts/reseed.sh [--clean] [--dry-run] [--help]
#
#   --clean    Vide les tables seeded (TRUNCATE) avant de ré-insérer.
#              Ordre respecté pour les FK. Les zones_geofencing ne sont
#              pas truncatées (gérées par init-localisation.sql).
#   --dry-run  Affiche les commandes sans les exécuter.
#   --help     Affiche cette aide.
#
#   Sans --clean : mode additif (ON CONFLICT DO NOTHING sur vehicles,
#                  positions dupliquées acceptées pour la hypertable).
#
# Prérequis  : Docker démarré, service postgres healthy.
# Chmod      : chmod 755 scripts/reseed.sh
# =============================================================================

set -euo pipefail

# ─── Couleurs ANSI ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()     { error "$*"; exit 1; }

# ─── Résolution du répertoire racine du projet ───────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEED_FILE="${PROJECT_ROOT}/db/seed.sql"

# ─── Parsing des arguments ───────────────────────────────────────────────────
OPT_CLEAN=false
OPT_DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --clean)   OPT_CLEAN=true ;;
    --dry-run) OPT_DRY_RUN=true ;;
    --help|-h)
      sed -n '3,20p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      die "Argument inconnu : '$arg'. Utilisez --help pour l'aide."
      ;;
  esac
done

# ─── Bannière ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Fleet Reseed — Gestion de Flotte Automobile    ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
[ "$OPT_DRY_RUN" = true ] && warn "Mode DRY-RUN activé — aucune commande ne sera exécutée."
[ "$OPT_CLEAN"   = true ] && warn "Mode --clean : TRUNCATE des tables avant re-seeding."
echo ""

# ─── Vérification du fichier seed ────────────────────────────────────────────
[ -f "$SEED_FILE" ] || die "Fichier seed introuvable : ${SEED_FILE}"
info "Fichier seed : ${SEED_FILE}"

# ─── Vérification Docker ─────────────────────────────────────────────────────
info "Vérification de Docker..."
if ! docker info >/dev/null 2>&1; then
  die "Docker n'est pas démarré ou l'utilisateur n'a pas les droits Docker."
fi
success "Docker est disponible."

# ─── Détection du conteneur postgres ─────────────────────────────────────────
info "Recherche du conteneur postgres..."
cd "$PROJECT_ROOT"

CONTAINER_ID=$(docker compose ps -q postgres 2>/dev/null || true)
if [ -z "$CONTAINER_ID" ]; then
  die "Le service 'postgres' n'est pas démarré. Lancez : docker compose up -d postgres"
fi

CONTAINER_NAME=$(docker inspect --format='{{.Name}}' "$CONTAINER_ID" | sed 's/^\///')
info "Conteneur trouvé : ${CONTAINER_NAME} (${CONTAINER_ID:0:12})"

# ─── Vérification état healthy ────────────────────────────────────────────────
HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$CONTAINER_ID")
info "État de santé : ${HEALTH}"

if [ "$HEALTH" != "healthy" ] && [ "$HEALTH" != "no-healthcheck" ]; then
  die "Le conteneur postgres n'est pas healthy (état : ${HEALTH}). Attendez qu'il démarre."
fi
success "Conteneur postgres prêt."

# ─── Paramètres de connexion (via variables d'environnement du compose) ───────
PG_USER=$(docker inspect --format='{{range .Config.Env}}{{.}}{{"\n"}}{{end}}' "$CONTAINER_ID" \
  | grep '^POSTGRES_USER=' | cut -d= -f2 || echo "flotte")
PG_DB=$(docker inspect --format='{{range .Config.Env}}{{.}}{{"\n"}}{{end}}' "$CONTAINER_ID" \
  | grep '^POSTGRES_DB=' | cut -d= -f2 || echo "fleet")

PG_USER="${PG_USER:-flotte}"
PG_DB="${PG_DB:-fleet}"

info "Connexion : psql -U ${PG_USER} -d ${PG_DB}"

# ─── Fonction d'exécution SQL ─────────────────────────────────────────────────
run_sql() {
  local sql="$1"
  local desc="${2:-}"
  [ -n "$desc" ] && info "  → ${desc}"
  if [ "$OPT_DRY_RUN" = true ]; then
    echo -e "${YELLOW}    [DRY-RUN] SQL: ${sql}${NC}"
  else
    docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -c "$sql" --quiet
  fi
}

# ─── Mode --clean : TRUNCATE dans l'ordre des dépendances FK ─────────────────
if [ "$OPT_CLEAN" = true ]; then
  echo ""
  echo -e "${BOLD}── TRUNCATE des tables seeded ──────────────────────${NC}"
  warn "Suppression de toutes les données seeded (vehicles, positions, geo_alerts)..."

  # geo_alerts AVANT vehicles (FK zone_id → zones_geofencing, pas de FK vehicle)
  run_sql "TRUNCATE service_localisation.geo_alerts;" \
          "TRUNCATE service_localisation.geo_alerts"

  # positions (hypertable, pas de FK)
  run_sql "TRUNCATE service_localisation.positions;" \
          "TRUNCATE service_localisation.positions"

  # vehicles (pas de FK entrant depuis localisation — UUIDs stockés sans contrainte)
  run_sql "TRUNCATE service_vehicles.vehicles;" \
          "TRUNCATE service_vehicles.vehicles"

  success "Tables vidées."
  echo ""
fi

# ─── Exécution du seed ────────────────────────────────────────────────────────
echo -e "${BOLD}── Exécution du seed ───────────────────────────────${NC}"
info "Application de db/seed.sql..."

if [ "$OPT_DRY_RUN" = true ]; then
  warn "[DRY-RUN] docker compose exec -T postgres psql -U ${PG_USER} -d ${PG_DB} -f /dev/stdin < ${SEED_FILE}"
else
  if ! docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" \
       -v ON_ERROR_STOP=1 -f /dev/stdin < "$SEED_FILE" 2>&1; then
    die "Le seed a échoué. Vérifiez les logs ci-dessus."
  fi
fi

success "Seed appliqué."

# ─── Résumé post-seed ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Résumé post-seed ────────────────────────────────${NC}"

if [ "$OPT_DRY_RUN" = true ]; then
  warn "[DRY-RUN] Résumé non disponible en mode dry-run."
  echo ""
  echo -e "${GREEN}${BOLD}✓ Dry-run terminé — aucune modification effectuée.${NC}"
  exit 0
fi

VEHICLES_TOTAL=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_vehicles.vehicles;" 2>/dev/null || echo "?")
VEHICLES_AVAILABLE=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_vehicles.vehicles WHERE statut='AVAILABLE';" 2>/dev/null || echo "?")
VEHICLES_IN_USE=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_vehicles.vehicles WHERE statut='IN_USE';" 2>/dev/null || echo "?")
VEHICLES_MAINT=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_vehicles.vehicles WHERE statut='MAINTENANCE';" 2>/dev/null || echo "?")
VEHICLES_RETIRED=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_vehicles.vehicles WHERE statut='RETIRED';" 2>/dev/null || echo "?")
POSITIONS_TOTAL=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_localisation.positions;" 2>/dev/null || echo "?")
ZONES_TOTAL=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_localisation.zones_geofencing;" 2>/dev/null || echo "?")
ALERTS_TOTAL=$(docker compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -At \
  -c "SELECT COUNT(*) FROM service_localisation.geo_alerts;" 2>/dev/null || echo "?")

printf "\n"
printf "  %-38s %s\n" "Table" "Lignes"
printf "  %-38s %s\n" "──────────────────────────────────────" "──────"
printf "  %-38s ${GREEN}%s${NC}\n" "service_vehicles.vehicles"            "$VEHICLES_TOTAL"
printf "  %-38s ${GREEN}%s${NC}\n" "  ↳ AVAILABLE"                        "$VEHICLES_AVAILABLE"
printf "  %-38s ${GREEN}%s${NC}\n" "  ↳ IN_USE"                           "$VEHICLES_IN_USE"
printf "  %-38s ${YELLOW}%s${NC}\n" "  ↳ MAINTENANCE"                     "$VEHICLES_MAINT"
printf "  %-38s ${RED}%s${NC}\n" "  ↳ RETIRED"                            "$VEHICLES_RETIRED"
printf "  %-38s ${GREEN}%s${NC}\n" "service_localisation.positions"       "$POSITIONS_TOTAL"
printf "  %-38s ${GREEN}%s${NC}\n" "service_localisation.zones_geofencing" "$ZONES_TOTAL"
printf "  %-38s ${GREEN}%s${NC}\n" "service_localisation.geo_alerts"      "$ALERTS_TOTAL"
printf "\n"

success "Re-seeding terminé avec succès."
echo -e "${CYAN}  Frontend : http://localhost${NC}"
echo -e "${CYAN}  GraphQL  : http://localhost:4000/graphql${NC}"
echo ""
