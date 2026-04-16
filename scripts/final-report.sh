#!/bin/bash
# final-report.sh — Rapport de validation final avant soutenance
# Usage: bash scripts/final-report.sh

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        RAPPORT FINAL — M1 GIL FLEET MANAGEMENT          ║"
echo "║           Université de Rouen  2025-2026                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📅 Date     : $(date '+%d/%m/%Y %H:%M')"
echo "📦 Répertoire: $(pwd)"
echo ""

# ── SERVICES DOCKER ──────────────────────────────────────────────────────
echo -e "${BOLD}[ SERVICES DOCKER ]${NC}"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
  || echo "❌ docker compose non accessible"
echo ""

# ── DONNÉES EN BASE ───────────────────────────────────────────────────────
echo -e "${BOLD}[ DONNÉES EN BASE (GraphQL) ]${NC}"

# Obtenir le token
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/flotte/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=flotte-app&username=admin&password=admin123" \
  2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
  COUNTS=$(curl -s -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"query":"{ vehicules { id } conducteurs { id } maintenances { id } localisations { id } evenements { id } }"}' \
    2>/dev/null | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin).get('data', {})
  print('  Véhicules     :', len(d.get('vehicules', [])))
  print('  Conducteurs   :', len(d.get('conducteurs', [])))
  print('  Maintenances  :', len(d.get('maintenances', [])))
  print('  Localisations :', len(d.get('localisations', [])))
  print('  Évènements    :', len(d.get('evenements', [])))
except: print('  ❌ Erreur lecture GraphQL')
" 2>/dev/null)
  echo "$COUNTS"
else
  echo "  ⚠️  Token Keycloak non disponible"
fi
echo ""

# ── HEALTH CHECKS ─────────────────────────────────────────────────────────
echo -e "${BOLD}[ HEALTH CHECKS ]${NC}"
for name in "vehicle-service:http://localhost:3000/health" \
            "driver-service:http://localhost:3001/health" \
            "maintenance-service:http://localhost:3002/health" \
            "location-service:http://localhost:3003/health" \
            "event-service:http://localhost:3004/health" \
            "feature-flags:http://localhost:3006/health" \
            "keycloak:http://localhost:8080/realms/flotte" \
            "frontend:http://localhost:80"; do
  svc="${name%%:*}"
  url="${name#*:}"
  if curl -sf "$url" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ $svc${NC}"
  else
    echo -e "  ${RED}❌ $svc → $url${NC}"
  fi
done
# GraphQL gateway : tester avec POST
GQL_OK=$(curl -sf -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' 2>/dev/null | grep -c "Query" || echo "0")
[ "$GQL_OK" -gt 0 ] \
  && echo -e "  ${GREEN}✅ graphql-gateway${NC}" \
  || echo -e "  ${RED}❌ graphql-gateway → http://localhost:4000/graphql${NC}"
echo ""

# ── BONUS IMPLÉMENTÉS ─────────────────────────────────────────────────────
echo -e "${BOLD}[ BONUS IMPLÉMENTÉS (+10 pts max) ]${NC}"

check_bonus() {
  local pts=$1; local label=$2; local file=$3
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✅ $label (+$pts pts)${NC}"
    return 0
  else
    echo -e "  ${RED}❌ $label — fichier manquant: $file${NC}"
    return 1
  fi
}

BONUS_TOTAL=0
check_bonus 3 "Tests de charge K6"     "tests/load/fleet-load-test.js"             && BONUS_TOTAL=$((BONUS_TOTAL+3))
check_bonus 3 "Feature Flags & Canary" "feature-flags/index.js"                    && BONUS_TOTAL=$((BONUS_TOTAL+3))
check_bonus 2 "Internationalisation i18n FR/EN" "frontend/src/i18n/index.js"        && BONUS_TOTAL=$((BONUS_TOTAL+2))
check_bonus 2 "Accessibilité WCAG 2.1" "frontend/src/components/ui/AccessibleComponents.jsx" && BONUS_TOTAL=$((BONUS_TOTAL+2))

echo -e "  ${BOLD}→ Total bonus estimé : +$BONUS_TOTAL pts${NC}"
echo ""

# ── COUVERTURE DE TESTS ───────────────────────────────────────────────────
echo -e "${BOLD}[ COUVERTURE DE TESTS ]${NC}"
for svc in vehicule-service maintenance-service; do
  if [ -d "services/$svc" ]; then
    SUMMARY="services/$svc/coverage/coverage-summary.json"
    HTML="services/$svc/coverage/lcov-report/index.html"
    if [ -f "$SUMMARY" ]; then
      COV=$(python3 -c "
import json
with open('$SUMMARY') as f: d=json.load(f)
pct = d.get('total',{}).get('lines',{}).get('pct', 0)
print(f'{pct}')
" 2>/dev/null || echo "?")
      echo -e "  ${GREEN}✅ $svc : ${COV}% couverture lignes${NC}"
    elif [ -f "$HTML" ]; then
      COV=$(python3 -c "
import re
content = open('$HTML').read()
matches = re.findall(r'(\d+\.?\d*)\s*%', content)
print(matches[0] if matches else '?')
" 2>/dev/null || echo "?")
      echo -e "  ${GREEN}✅ $svc : ~${COV}% (rapport HTML)${NC}"
    else
      echo -e "  ${YELLOW}⚠️  $svc : pas de rapport (lancer: cd services/$svc && npm test -- --coverage)${NC}"
    fi
  fi
done
echo ""

# ── FRONTEND ──────────────────────────────────────────────────────────────
echo -e "${BOLD}[ FRONTEND ]${NC}"
[ -f "frontend/src/i18n/index.js" ]       && echo -e "  ${GREEN}✅ i18n configuré${NC}"         || echo -e "  ${RED}❌ i18n manquant${NC}"
[ -f "frontend/src/hooks/useFeatureFlags.js" ] && echo -e "  ${GREEN}✅ Feature flags hook${NC}" || echo -e "  ${RED}❌ Feature flags hook manquant${NC}"
[ -f "frontend/src/components/ui/AccessibleComponents.jsx" ] && echo -e "  ${GREEN}✅ Composants WCAG${NC}" || echo -e "  ${RED}❌ Composants WCAG manquants${NC}"
echo ""

# ── ARCHITECTURE ──────────────────────────────────────────────────────────
echo -e "${BOLD}[ ARCHITECTURE MICROSERVICES ]${NC}"
SERVICES_LIST=(vehicule-service conducteur-service maintenance-service localisation-service evenement-service)
for svc in "${SERVICES_LIST[@]}"; do
  [ -d "services/$svc" ] \
    && echo -e "  ${GREEN}✅ services/$svc${NC}" \
    || echo -e "  ${RED}❌ services/$svc manquant${NC}"
done
[ -f "gestion-flotte.js" ] && echo -e "  ${GREEN}✅ API Gateway GraphQL${NC}" || echo -e "  ${RED}❌ API Gateway manquant${NC}"
[ -f "feature-flags/index.js" ] && echo -e "  ${GREEN}✅ Feature Flags Service${NC}"
echo ""

# ── SCORE ESTIMÉ ──────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo -e "${BOLD}  GRILLE DE NOTATION (estimée)${NC}"
echo "  Architecture microservices  : /20"
echo "  Code & Tests unitaires      : /20"
echo "  Déploiement Docker/K8s      : /15"
echo "  Sécurité Keycloak           : /15"
echo "  Fonctionnalités métier      : /15"
echo "  Observabilité (Kafka)       : /10"
echo "  Documentation               : /10"
echo "  Démonstration live          : /10"
echo "  ─────────────────────────────────"
echo "  Sous-total                  : /115"
echo -e "  Bonus implémentés         : +$BONUS_TOTAL/10"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🎓 Prêt pour la soutenance ! Bonne chance !${NC}"
echo ""
