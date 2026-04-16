#!/bin/bash
# validate-week6.sh — Validation complète Fleet Management (ports réels)
set -euo pipefail
PASS=0; FAIL=0; WARNS=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

pass() { echo -e "${GREEN}✅ $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ $1${NC} → $2"; FAIL=$((FAIL+1)); }
warn() { echo -e "${YELLOW}⚠️  $1${NC} → $2"; WARNS=$((WARNS+1)); }

echo "======================================================="
echo "   VALIDATION FLEET MANAGEMENT — SEMAINE 6 COMPLÈTE"
echo "   Université de Rouen M1 GIL 2025-2026"
echo "======================================================="

# ── INFRASTRUCTURE ──────────────────────────────────────────
echo -e "\n[ INFRASTRUCTURE ]"

RUNNING=$(docker compose ps --status running --format json 2>/dev/null | wc -l)
[ "$RUNNING" -ge 5 ] \
  && pass "Docker: $RUNNING conteneurs actifs" \
  || fail "Docker: seulement $RUNNING conteneurs actifs" "docker compose up -d"

# Kafka topics (topiques réels du projet)
TOPICS=$(docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list 2>/dev/null || echo "")
for topic in vehicule-events maintenance-events; do
  echo "$TOPICS" | grep -q "$topic" \
    && pass "Kafka topic: $topic" \
    || warn "Kafka topic: $topic" "Topic non créé (auto-create activé)"
done

# Keycloak realm 'flotte'
KC=$(curl -sf http://localhost:8080/realms/flotte 2>/dev/null || echo "")
echo "$KC" | grep -q "flotte" \
  && pass "Keycloak: realm 'flotte' accessible" \
  || fail "Keycloak: realm 'flotte' inaccessible" "Vérifier Keycloak :8080"

# ── MICROSERVICES BACKEND ────────────────────────────────────
echo -e "\n[ MICROSERVICES BACKEND ]"

check_service() {
  local name=$1; local port=$2; local path=${3:-/health}
  local res=$(curl -sf "http://localhost:$port$path" 2>/dev/null || echo "FAIL")
  echo "$res" | grep -qiE "ok|healthy|up|true|status" \
    && pass "$name: health OK (:$port)" \
    || fail "$name: health KO (:$port)" "curl http://localhost:$port$path"
}

check_service "vehicle-service"      3000
check_service "driver-service"       3001
check_service "maintenance-service"  3002
check_service "event-service"        3004

# location-service via docker exec (port non exposé hôte)
LOC_HEALTH=$(docker compose exec -T location-service \
  wget -qO- http://localhost:3003/health 2>/dev/null || echo "FAIL")
echo "$LOC_HEALTH" | grep -qiE "ok|healthy|up|true" \
  && pass "location-service: health OK (:3003 interne)" \
  || fail "location-service: health KO" "docker compose logs location-service"

# API Gateway GraphQL
GQL=$(curl -sf -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' 2>/dev/null || echo "FAIL")
echo "$GQL" | grep -q "Query\|__typename" \
  && pass "API Gateway GraphQL: opérationnel :4000" \
  || fail "API Gateway GraphQL: KO" "curl -X POST http://localhost:4000/graphql"

# ── KEYCLOAK AUTH ────────────────────────────────────────────
echo -e "\n[ AUTHENTIFICATION KEYCLOAK ]"

TOKEN=$(curl -s -X POST "http://localhost:8080/realms/flotte/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=flotte-app&username=admin&password=admin123" \
  2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
[ -n "$TOKEN" ] \
  && pass "Keycloak: token admin obtenu (OIDC)" \
  || fail "Keycloak: impossible d'obtenir un token" "Vérifier realm=flotte, client=flotte-app"

# ── TESTS GRAPHQL FONCTIONNELS ───────────────────────────────
echo -e "\n[ QUERIES GRAPHQL ]"

gql_check() {
  local name=$1; local query=$2; local expect=$3
  local res=$(curl -sf -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"query\":\"$query\"}" 2>/dev/null || echo "FAIL")
  echo "$res" | grep -q "$expect" \
    && pass "GraphQL: $name" \
    || fail "GraphQL: $name" "$(echo $res | head -c 120)"
}

gql_check "vehicules query"     "{ vehicules { id immatriculation statut } }" "data"
gql_check "conducteurs query"   "{ conducteurs { id nom prenom } }"           "data"
gql_check "maintenances query"  "{ maintenances { id type status } }"         "data"
gql_check "localisations query" "{ localisations { id vehiculeId latitude longitude } }" "data"
gql_check "evenements query"    "{ evenements { id type } }"                  "data"

# ── FRONTEND ─────────────────────────────────────────────────
echo -e "\n[ FRONTEND ]"

if [ -d "frontend" ]; then
  pass "Frontend: dossier présent"
  [ -f "frontend/package.json" ] && pass "Frontend: package.json présent" \
    || fail "Frontend: package.json manquant" ""
  [ -f "frontend/Dockerfile" ] && pass "Frontend: Dockerfile présent" \
    || fail "Frontend: Dockerfile manquant" ""

  curl -sf http://localhost:80 >/dev/null 2>&1 \
    && pass "Frontend: accessible :80" \
    || warn "Frontend :80" "Non accessible (docker compose up si besoin)"
else
  fail "Frontend: dossier manquant" "mkdir frontend"
fi

# ── BONUS ─────────────────────────────────────────────────────
echo -e "\n[ BONUS IMPLÉMENTÉS ]"

[ -f "tests/load/fleet-load-test.js" ] \
  && pass "Bonus 1: Tests K6 présents" \
  || warn "Bonus 1: Tests K6" "Manquants (+3 pts)"
[ -f "feature-flags/index.js" ] \
  && pass "Bonus 2: Feature Flags service présent" \
  || warn "Bonus 2: Feature Flags" "Manquants (+3 pts)"
[ -f "frontend/src/i18n/index.js" ] \
  && pass "Bonus 3: i18n FR/EN présent" \
  || warn "Bonus 3: i18n" "Manquant (+2 pts)"
[ -f "frontend/src/components/ui/AccessibleComponents.jsx" ] \
  && pass "Bonus 4: Accessibilité WCAG présente" \
  || warn "Bonus 4: Accessibilité" "Manquante (+2 pts)"

# ── TESTS UNITAIRES & COUVERTURE ────────────────────────────
echo -e "\n[ TESTS UNITAIRES & COUVERTURE ]"
# Lire les rapports de couverture existants (générés lors du CI ou d'un run local)
for svc_dir in vehicule-service maintenance-service; do
  if [ -d "services/$svc_dir" ]; then
    # Priorité 1 : coverage-summary.json (Jest)
    SUMMARY="services/$svc_dir/coverage/coverage-summary.json"
    if [ -f "$SUMMARY" ]; then
      COV=$(python3 -c "
import json
with open('$SUMMARY') as f: d=json.load(f)
total = d.get('total', {})
lines = total.get('lines', {})
pct = lines.get('pct', 0)
print(f'{pct}')
" 2>/dev/null || echo "0")
    else
      # Fallback : lire index.html du rapport lcov
      HTML="services/$svc_dir/coverage/lcov-report/index.html"
      if [ -f "$HTML" ]; then
        COV=$(python3 -c "
import re, sys
content = open('$HTML').read()
matches = re.findall(r'(\d+\.?\d*)\s*%', content)
print(matches[0] if matches else '0')
" 2>/dev/null || echo "0")
      else
        COV="N/A (lancer npm test localement)"
        warn "$svc_dir: rapport couverture absent" "Exécuter npm test dans services/$svc_dir"
        continue
      fi
    fi
    COV_INT=${COV%.*}
    if [ "$COV" = "0" ] || [ "${COV_INT:-0}" -lt 80 ]; then
      warn "$svc_dir: couverture ${COV}%" "Lancer npm test pour mettre à jour le rapport"
    else
      pass "$svc_dir: couverture ${COV}% (≥80%) ✓"
    fi
  fi
done

# ── RÉSUMÉ ───────────────────────────────────────────────────
echo ""
echo "======================================================="
echo "  RÉSULTATS : ✅ $PASS | ❌ $FAIL | ⚠️  $WARNS"
echo "======================================================="
[ $FAIL -eq 0 ] \
  && echo -e "${GREEN}🎉 Système opérationnel — Prêt pour la soutenance !${NC}" \
  || echo -e "${RED}🛑 $FAIL problème(s) critique(s) à corriger.${NC}"

exit $FAIL
