#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="${WORKSPACE:-$SCRIPT_DIR}"
cd "$WORKSPACE"

if [[ "$#" -gt 0 ]]; then
  echo "Usage: $0"
  exit 2
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VEHICULE_PORT="${VEHICULE_PORT:-33100}"
CONDUCTEUR_PORT="${CONDUCTEUR_PORT:-33101}"
MAINTENANCE_PORT="${MAINTENANCE_PORT:-33102}"
EVENEMENT_PORT="${EVENEMENT_PORT:-33104}"
KEYCLOAK_PORT="${KEYCLOAK_PORT:-18080}"

REALM_NAME="flotte"
CLIENT_ID="e2e-service"
KC_ADMIN_USER="admin"
KC_ADMIN_PASS="admin"

TEST_PASSED=0
TEST_FAILED=0

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "❌ Ni 'docker-compose' ni 'docker compose' n'est disponible"
  exit 2
fi

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "❌ Commande manquante: $cmd"
    exit 2
  }
}

for cmd in docker curl jq node npm; do
  require_cmd "$cmd"
done

free_port() {
  local port="$1"

  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  fi

  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti ":${port}" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      kill $pids >/dev/null 2>&1 || true
      sleep 1
      kill -9 $pids >/dev/null 2>&1 || true
    fi
  fi
}

cleanup() {
  echo ""
  echo "🛑 Arrêt des services et de l'infra..."

  [[ -n "${VEHICULE_PID:-}" ]] && kill "$VEHICULE_PID" 2>/dev/null || true
  [[ -n "${MAINTENANCE_PID:-}" ]] && kill "$MAINTENANCE_PID" 2>/dev/null || true
  [[ -n "${EVENEMENT_PID:-}" ]] && kill "$EVENEMENT_PID" 2>/dev/null || true
  [[ -n "${CONDUCTEUR_PID:-}" ]] && kill "$CONDUCTEUR_PID" 2>/dev/null || true

  [[ -n "${VEHICULE_PID:-}" ]] && wait "$VEHICULE_PID" 2>/dev/null || true
  [[ -n "${MAINTENANCE_PID:-}" ]] && wait "$MAINTENANCE_PID" 2>/dev/null || true
  [[ -n "${EVENEMENT_PID:-}" ]] && wait "$EVENEMENT_PID" 2>/dev/null || true
  [[ -n "${CONDUCTEUR_PID:-}" ]] && wait "$CONDUCTEUR_PID" 2>/dev/null || true

  docker rm -f e2e-postgres e2e-keycloak >/dev/null 2>&1 || true
  $COMPOSE_CMD -f helm/infra/docker-compose.kafka.yml down >/dev/null 2>&1 || true
}
trap cleanup EXIT

pass_test() {
  echo -e "${GREEN}✓ $1${NC}"
  TEST_PASSED=$((TEST_PASSED + 1))
}

fail_test() {
  echo -e "${RED}✗ $1${NC}"
  if [[ -n "${2:-}" ]]; then
    echo -e "${YELLOW}  Détail: $2${NC}"
  fi
  TEST_FAILED=$((TEST_FAILED + 1))
}

request() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  shift 3 || true

  local args=(-s -X "$method" "$url")
  while (( "$#" )); do
    args+=(-H "$1")
    shift
  done

  if [[ -n "$data" ]]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi

  curl "${args[@]}" -w $'\n%{http_code}'
}

start_kafka() {
  echo -e "${BLUE}[1/6] Démarrage de Kafka...${NC}"
  $COMPOSE_CMD -f helm/infra/docker-compose.kafka.yml up -d >/dev/null
  sleep 8
  echo -e "${GREEN}✓ Kafka démarré${NC}"
  echo ""
}

start_postgres() {
  echo -e "${BLUE}[2/6] Démarrage PostgreSQL de test...${NC}"
  free_port 55432
  docker rm -f e2e-postgres >/dev/null 2>&1 || true
  docker run -d --name e2e-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=fleet \
    -p 55432:5432 postgres:16-alpine >/dev/null

  for _ in {1..45}; do
    if docker exec e2e-postgres pg_isready -U postgres -d fleet >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  docker exec -i e2e-postgres psql -U postgres -d fleet >/dev/null <<'SQL'
CREATE SCHEMA IF NOT EXISTS service_vehicles;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status_enum') THEN
    CREATE TYPE vehicle_status_enum AS ENUM ('AVAILABLE','IN_USE','MAINTENANCE','RETIRED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS service_vehicles.vehicles (
  id UUID PRIMARY KEY,
  immatriculation VARCHAR(20) NOT NULL UNIQUE,
  marque VARCHAR(100) NOT NULL,
  "modèle" VARCHAR(100) NOT NULL,
  statut vehicle_status_enum NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SQL

  echo -e "${GREEN}✓ PostgreSQL de test prêt${NC}"
  echo ""
}

setup_keycloak() {
  echo -e "${BLUE}[3/6] Préparation Keycloak...${NC}"
  free_port "$KEYCLOAK_PORT"
  docker rm -f e2e-keycloak >/dev/null 2>&1 || true
  docker run -d --name e2e-keycloak \
    -p ${KEYCLOAK_PORT}:8080 \
    -e KEYCLOAK_ADMIN=${KC_ADMIN_USER} \
    -e KEYCLOAK_ADMIN_PASSWORD=${KC_ADMIN_PASS} \
    quay.io/keycloak/keycloak:latest start-dev >/dev/null

  for _ in {1..90}; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${KEYCLOAK_PORT}/realms/master/.well-known/openid-configuration" || true)
    [[ "$code" == "200" ]] && break
    sleep 2
  done

  ADM=$(curl -s -X POST "http://localhost:${KEYCLOAK_PORT}/realms/master/protocol/openid-connect/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'client_id=admin-cli' \
    -d "username=${KC_ADMIN_USER}" \
    -d "password=${KC_ADMIN_PASS}" \
    -d 'grant_type=password' | jq -r '.access_token')

  [[ -n "$ADM" && "$ADM" != "null" ]]

  curl -s -X POST "http://localhost:${KEYCLOAK_PORT}/admin/realms" \
    -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' \
    -d "{\"realm\":\"${REALM_NAME}\",\"enabled\":true}" >/dev/null || true

  for role in admin manager technicien conducteur; do
    curl -s -X POST "http://localhost:${KEYCLOAK_PORT}/admin/realms/${REALM_NAME}/roles" \
      -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' \
      -d "{\"name\":\"$role\"}" >/dev/null || true
  done

  curl -s -X POST "http://localhost:${KEYCLOAK_PORT}/admin/realms/${REALM_NAME}/clients" \
    -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' \
    -d "{\"clientId\":\"${CLIENT_ID}\",\"enabled\":true,\"publicClient\":false,\"serviceAccountsEnabled\":true,\"directAccessGrantsEnabled\":false,\"standardFlowEnabled\":false,\"implicitFlowEnabled\":false,\"protocol\":\"openid-connect\"}" >/dev/null || true

  CID=$(curl -s -H "Authorization: Bearer $ADM" "http://localhost:${KEYCLOAK_PORT}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" | jq -r '.[0].id')
  [[ -n "$CID" && "$CID" != "null" ]]
  SECRET=$(curl -s -H "Authorization: Bearer $ADM" "http://localhost:${KEYCLOAK_PORT}/admin/realms/${REALM_NAME}/clients/${CID}/client-secret" | jq -r '.value')
  [[ -n "$SECRET" && "$SECRET" != "null" ]]
  SERVICE_USER_ID=$(curl -s -H "Authorization: Bearer $ADM" "http://localhost:${KEYCLOAK_PORT}/admin/realms/${REALM_NAME}/clients/${CID}/service-account-user" | jq -r '.id')
  [[ -n "$SERVICE_USER_ID" && "$SERVICE_USER_ID" != "null" ]]

  for role in admin manager technicien; do
    role_json=$(curl -s -H "Authorization: Bearer $ADM" "http://localhost:${KEYCLOAK_PORT}/admin/realms/${REALM_NAME}/roles/$role")
    curl -s -X POST "http://localhost:${KEYCLOAK_PORT}/admin/realms/${REALM_NAME}/users/${SERVICE_USER_ID}/role-mappings/realm" \
      -H "Authorization: Bearer $ADM" -H 'Content-Type: application/json' \
      -d "[$role_json]" >/dev/null || true
  done

  TOKEN=$(curl -s -X POST "http://localhost:${KEYCLOAK_PORT}/realms/${REALM_NAME}/protocol/openid-connect/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${SECRET}" \
    -d 'grant_type=client_credentials' | jq -r '.access_token')

  [[ -n "$TOKEN" && "$TOKEN" != "null" ]]
  AUTH_HEADER="Authorization: Bearer $TOKEN"

  echo -e "${GREEN}✓ Keycloak prêt et token obtenu${NC}"
  echo ""
}

install_dependencies() {
  echo -e "${BLUE}[4/6] Installation des dépendances services...${NC}"
  for service_dir in vehicule-service maintenance-service evenement-service conducteur-service; do
    echo "  → $service_dir"
    (cd "$WORKSPACE/services/$service_dir" && npm install --silent)
  done
  echo -e "${GREEN}✓ Dépendances installées${NC}"
  echo ""
}

start_services() {
  echo -e "${BLUE}[5/6] Démarrage des microservices...${NC}"

  free_port "$VEHICULE_PORT"
  free_port "$MAINTENANCE_PORT"
  free_port "$EVENEMENT_PORT"
  free_port "$CONDUCTEUR_PORT"

  : > /tmp/vehicule-service.log
  : > /tmp/maintenance-service.log
  : > /tmp/evenement-service.log
  : > /tmp/conducteur-service.log

  cd "$WORKSPACE/services/vehicule-service"
  env PORT="$VEHICULE_PORT" APP_PORT="$VEHICULE_PORT" \
    KEYCLOAK_URL="http://localhost:${KEYCLOAK_PORT}" KEYCLOAK_REALM="$REALM_NAME" \
    POSTGRES_HOST=localhost POSTGRES_PORT=55432 POSTGRES_DB=fleet POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres \
    KAFKA_BROKER=localhost:9092 \
    node src/app.js > /tmp/vehicule-service.log 2>&1 &
  VEHICULE_PID=$!

  cd "$WORKSPACE/services/maintenance-service"
  env PORT="$MAINTENANCE_PORT" APP_PORT="$MAINTENANCE_PORT" \
    KEYCLOAK_URL="http://localhost:${KEYCLOAK_PORT}" KEYCLOAK_REALM="$REALM_NAME" \
    KAFKA_BROKER=localhost:9092 \
    node src/app.js > /tmp/maintenance-service.log 2>&1 &
  MAINTENANCE_PID=$!

  cd "$WORKSPACE/services/evenement-service"
  env PORT="$EVENEMENT_PORT" APP_PORT="$EVENEMENT_PORT" \
    KEYCLOAK_URL="http://localhost:${KEYCLOAK_PORT}" KEYCLOAK_REALM="$REALM_NAME" \
    node src/app.js > /tmp/evenement-service.log 2>&1 &
  EVENEMENT_PID=$!

  cd "$WORKSPACE/services/conducteur-service"
  env PORT="$CONDUCTEUR_PORT" APP_PORT="$CONDUCTEUR_PORT" \
    KEYCLOAK_URL="http://localhost:${KEYCLOAK_PORT}" KEYCLOAK_REALM="$REALM_NAME" \
    node src/app.js > /tmp/conducteur-service.log 2>&1 &
  CONDUCTEUR_PID=$!

  cd "$WORKSPACE"

  echo -e "${GREEN}✓ Services lancés${NC}"
  echo ""
}

check_health() {
  local port="$1"
  local name="$2"
  local max_attempts=30

  for _ in $(seq 1 "$max_attempts"); do
    if curl -s "http://localhost:${port}/health" >/dev/null 2>&1; then
      pass_test "$name est prêt"
      return 0
    fi
    sleep 1
  done

  fail_test "$name indisponible" "voir /tmp/${name}.log"
  return 1
}

wait_for_vehicle_status() {
  local vehicle_id="$1"
  local expected_status="$2"
  local timeout_seconds="${3:-40}"
  local elapsed=0

  while [[ "$elapsed" -lt "$timeout_seconds" ]]; do
    status=$(curl -s -X GET "http://localhost:${VEHICULE_PORT}/vehicles/${vehicle_id}" -H "$AUTH_HEADER" | jq -r '.statut // empty')
    if [[ "$status" == "$expected_status" ]]; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  return 1
}

wait_for_log_line() {
  local file_path="$1"
  local pattern="$2"
  local label="$3"
  local timeout_seconds="${4:-40}"
  local elapsed=0

  while [[ "$elapsed" -lt "$timeout_seconds" ]]; do
    if [[ -f "$file_path" ]] && grep -q "$pattern" "$file_path"; then
      pass_test "$label"
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  fail_test "$label" "pattern '$pattern' absent dans $file_path"
  return 1
}

run_e2e_tests() {
  echo -e "${BLUE}[6/6] Exécution des scénarios E2E...${NC}"

  # 1) Contrôle auth
  noauth_code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${VEHICULE_PORT}/vehicles")
  if [[ "$noauth_code" == "401" ]]; then
    pass_test "GET /vehicles sans token retourne 401"
  else
    fail_test "GET /vehicles sans token" "code=$noauth_code"
  fi

  # 2) Création conducteur
  conducteur_payload='{"nom":"Jean","prenom":"E2E","numeroPermis":"PERMIS-E2E-001","statut":"actif"}'
  conducteur_resp=$(request "POST" "http://localhost:${CONDUCTEUR_PORT}/conducteurs" "$conducteur_payload" "$AUTH_HEADER")
  conducteur_code=$(echo "$conducteur_resp" | tail -n1)
  conducteur_body=$(echo "$conducteur_resp" | sed '$d')
  conducteur_id=$(echo "$conducteur_body" | jq -r '.id // empty')

  if [[ "$conducteur_code" == "201" && -n "$conducteur_id" ]]; then
    pass_test "POST /conducteurs retourne 201"
  else
    fail_test "POST /conducteurs" "$conducteur_body"
  fi

  # 3) Création véhicule
  immat="E2E$RANDOM"
  vehicle_payload="{\"immatriculation\":\"${immat}\",\"marque\":\"Renault\",\"modele\":\"Clio\",\"statut\":\"AVAILABLE\"}"
  vehicle_resp=$(request "POST" "http://localhost:${VEHICULE_PORT}/vehicles" "$vehicle_payload" "$AUTH_HEADER")
  vehicle_code=$(echo "$vehicle_resp" | tail -n1)
  vehicle_body=$(echo "$vehicle_resp" | sed '$d')
  vehicle_id=$(echo "$vehicle_body" | jq -r '.id // empty')

  if [[ "$vehicle_code" == "201" && -n "$vehicle_id" ]]; then
    pass_test "POST /vehicles retourne 201"
  else
    fail_test "POST /vehicles" "$vehicle_body"
    return
  fi

  # 4) Vérification lecture véhicule
  get_vehicle_resp=$(request "GET" "http://localhost:${VEHICULE_PORT}/vehicles/${vehicle_id}" "" "$AUTH_HEADER")
  get_vehicle_code=$(echo "$get_vehicle_resp" | tail -n1)
  get_vehicle_body=$(echo "$get_vehicle_resp" | sed '$d')
  read_status=$(echo "$get_vehicle_body" | jq -r '.statut // empty')

  if [[ "$get_vehicle_code" == "200" && "$read_status" == "AVAILABLE" ]]; then
    pass_test "GET /vehicles/:id retourne le véhicule"
  else
    fail_test "GET /vehicles/:id" "$get_vehicle_body"
  fi

  # 5) Création maintenance -> Saga attendue: vehicle MAINTENANCE
  now_iso=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  maintenance_payload="{\"vehicleId\":\"${vehicle_id}\",\"date\":\"${now_iso}\",\"type\":\"revision\",\"status\":\"planifiee\",\"cost\":120}"
  maintenance_resp=$(request "POST" "http://localhost:${MAINTENANCE_PORT}/maintenance" "$maintenance_payload" "$AUTH_HEADER")
  maintenance_code=$(echo "$maintenance_resp" | tail -n1)
  maintenance_body=$(echo "$maintenance_resp" | sed '$d')
  maintenance_id=$(echo "$maintenance_body" | jq -r '.id // empty')

  if [[ "$maintenance_code" == "201" && -n "$maintenance_id" ]]; then
    pass_test "POST /maintenance retourne 201"
  else
    fail_test "POST /maintenance" "$maintenance_body"
  fi

  if wait_for_vehicle_status "$vehicle_id" "MAINTENANCE"; then
    pass_test "Saga: véhicule passe en MAINTENANCE après création maintenance"
  else
    fail_test "Saga MAINTENANCE_CREATED" "le véhicule n'a pas basculé en MAINTENANCE"
  fi

  # 6) Update maintenance terminee -> Saga: vehicle AVAILABLE
  maintenance_done_payload="{\"vehicleId\":\"${vehicle_id}\",\"date\":\"${now_iso}\",\"type\":\"revision\",\"status\":\"terminee\",\"cost\":120}"
  maintenance_upd_resp=$(request "PUT" "http://localhost:${MAINTENANCE_PORT}/maintenance/${maintenance_id}" "$maintenance_done_payload" "$AUTH_HEADER")
  maintenance_upd_code=$(echo "$maintenance_upd_resp" | tail -n1)
  maintenance_upd_body=$(echo "$maintenance_upd_resp" | sed '$d')

  if [[ "$maintenance_upd_code" == "200" ]]; then
    pass_test "PUT /maintenance/:id (terminee) retourne 200"
  else
    fail_test "PUT /maintenance/:id" "$maintenance_upd_body"
  fi

  if wait_for_vehicle_status "$vehicle_id" "AVAILABLE"; then
    pass_test "Saga: véhicule repasse AVAILABLE après maintenance terminée"
  else
    fail_test "Saga MAINTENANCE_COMPLETED" "le véhicule n'a pas rebasculé en AVAILABLE"
  fi

  # 7) Création évènement
  evt_payload="{\"vehiculeId\":\"${vehicle_id}\",\"type\":\"alerte\",\"description\":\"Alerte E2E\",\"date\":\"${now_iso}\"}"
  evt_resp=$(request "POST" "http://localhost:${EVENEMENT_PORT}/evenements" "$evt_payload" "$AUTH_HEADER")
  evt_code=$(echo "$evt_resp" | tail -n1)
  evt_body=$(echo "$evt_resp" | sed '$d')

  if [[ "$evt_code" == "201" ]]; then
    pass_test "POST /evenements retourne 201"
  else
    fail_test "POST /evenements" "$evt_body"
  fi

  echo ""
}

print_logs() {
  echo "=========================================="
  echo "📋 DERNIERS LOGS"
  echo "=========================================="

  for svc in vehicule-service maintenance-service evenement-service conducteur-service; do
    local f="/tmp/${svc}.log"
    if [[ -f "$f" ]]; then
      echo -e "${YELLOW}[${svc}]${NC}"
      tail -n 12 "$f" || true
      echo ""
    fi
  done
}

print_results() {
  echo "=========================================="
  echo "📊 RÉSULTATS FINAUX"
  echo "=========================================="
  echo -e "Tests réussis: ${GREEN}$TEST_PASSED${NC}"
  echo -e "Tests échoués: ${RED}$TEST_FAILED${NC}"
  echo ""

  if [[ "$TEST_FAILED" -eq 0 ]]; then
    echo -e "${GREEN}✓ TOUS LES TESTS E2E SONT PASSÉS${NC}"
    exit 0
  else
    echo -e "${RED}✗ Des tests E2E ont échoué${NC}"
    exit 1
  fi
}

echo "=========================================="
echo "🚀 TEST E2E FLOTTE (v2)"
echo "=========================================="
echo "Workspace: $WORKSPACE"
echo ""

start_kafka
start_postgres
setup_keycloak
install_dependencies
start_services

check_health "$VEHICULE_PORT" "vehicule-service"
check_health "$MAINTENANCE_PORT" "maintenance-service"
check_health "$EVENEMENT_PORT" "evenement-service"
check_health "$CONDUCTEUR_PORT" "conducteur-service"

wait_for_log_line "/tmp/vehicule-service.log" "écoute maintenance-events" "Kafka consumer vehicule prêt"
wait_for_log_line "/tmp/maintenance-service.log" "maintenance-service connecté" "Kafka producer maintenance prêt"

echo ""
run_e2e_tests
print_logs
print_results
