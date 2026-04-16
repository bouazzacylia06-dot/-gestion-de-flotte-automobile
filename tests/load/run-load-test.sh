#!/bin/bash
# run-load-test.sh — Installation K6 et lancement du test de charge
set -euo pipefail

echo "╔══════════════════════════════════════════════════════╗"
echo "║        TEST DE CHARGE K6 — Fleet Management         ║"
echo "╚══════════════════════════════════════════════════════╝"

# 1. Installer K6 si absent
if ! command -v k6 &>/dev/null; then
  echo "⬇️  Installation de K6..."
  sudo gpg --no-default-keyring \
    --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
    --keyserver hkp://keyserver.ubuntu.com:80 \
    --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 2>/dev/null
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
    | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update -qq && sudo apt-get install k6 -y
  echo "✅ K6 installé"
else
  echo "✅ K6 déjà installé: $(k6 version)"
fi

# 2. Vérifier les services
echo ""
echo "🔍 Vérification des services..."
for url in "http://localhost:3000/health" "http://localhost:3001/health" "http://localhost:4000/graphql"; do
  if curl -sf "$url" >/dev/null 2>&1; then
    echo "  ✅ $url"
  else
    echo "  ⚠️  $url inaccessible (le test continuera quand même)"
  fi
done

# 3. Obtenir le token Keycloak
echo ""
echo "🔑 Obtention du token Keycloak..."
K6_TOKEN=$(curl -s -X POST "http://localhost:8080/realms/flotte/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=flotte-app&username=admin&password=admin123" \
  2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")

if [ -n "$K6_TOKEN" ]; then
  echo "  ✅ Token obtenu"
else
  echo "  ⚠️  Token non obtenu (les endpoints protégés seront en 401)"
fi

# 4. Créer le dossier de résultats
mkdir -p tests/load

# 5. Lancer le test de charge
echo ""
echo "🚀 Lancement du test de charge..."
echo "   Durée totale estimée : ~2 minutes 30 secondes"
echo "   Seuils : p(95) < 500ms, erreurs < 5%"
echo ""

K6_TOKEN="$K6_TOKEN" k6 run \
  --out json=tests/load/results-raw.json \
  tests/load/fleet-load-test.js

echo ""
echo "✅ Test terminé. Résultats dans :"
echo "   tests/load/results.json     (rapport synthèse)"
echo "   tests/load/results-raw.json (données brutes K6)"
