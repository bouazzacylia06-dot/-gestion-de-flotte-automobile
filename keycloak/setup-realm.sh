#!/usr/bin/env bash
# =============================================================================
# setup-realm.sh — Initialisation du realm Keycloak "flotte"
# Usage : ./keycloak/setup-realm.sh [KEYCLOAK_URL] [ADMIN_USER] [ADMIN_PASS]
# Exemple : ./keycloak/setup-realm.sh http://localhost:8080 admin admin
# =============================================================================
set -euo pipefail

KEYCLOAK_URL="${1:-http://localhost:8080}"
ADMIN_USER="${2:-admin}"
ADMIN_PASS="${3:-admin}"
REALM="flotte"
CLIENT_ID="flotte-app"
REDIRECT_URI="http://localhost/*"
ORIGIN="http://localhost"

echo ">>> Connexion à Keycloak : $KEYCLOAK_URL"

# ── 1. Obtenir le token admin ────────────────────────────────────────────────
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASS" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "ERREUR : Impossible d'obtenir le token admin. Vérifiez que Keycloak est démarré."
  exit 1
fi
echo "✓ Token admin obtenu"

# Helper
kc() {
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$@"
}

kc_get() {
  curl -s \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$@"
}

# ── 2. Créer le realm "flotte" ───────────────────────────────────────────────
REALM_EXISTS=$(kc_get "$KEYCLOAK_URL/admin/realms/$REALM" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('realm',''))" 2>/dev/null || echo "")

if [ "$REALM_EXISTS" = "$REALM" ]; then
  echo "✓ Realm '$REALM' existe déjà"
else
  STATUS=$(kc -X POST "$KEYCLOAK_URL/admin/realms" \
    -d "{\"realm\":\"$REALM\",\"enabled\":true,\"displayName\":\"Gestion de Flotte\"}")
  echo "✓ Realm '$REALM' créé (HTTP $STATUS)"
fi

# ── 3. Créer le client "flotte-app" (public, CORS, redirects) ────────────────
CLIENT_EXISTS=$(kc_get "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" \
  | python3 -c "import sys,json; l=json.load(sys.stdin); print(l[0]['id'] if l else '')" 2>/dev/null || echo "")

if [ -n "$CLIENT_EXISTS" ]; then
  echo "✓ Client '$CLIENT_ID' existe déjà (id: $CLIENT_EXISTS)"
else
  STATUS=$(kc -X POST "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
    -d "{
      \"clientId\": \"$CLIENT_ID\",
      \"publicClient\": true,
      \"standardFlowEnabled\": true,
      \"directAccessGrantsEnabled\": true,
      \"redirectUris\": [\"$REDIRECT_URI\", \"*\"],
      \"webOrigins\": [\"$ORIGIN\", \"*\"],
      \"attributes\": {\"pkce.code.challenge.method\": \"S256\"}
    }")
  echo "✓ Client '$CLIENT_ID' créé (HTTP $STATUS)"
fi

# ── 4. Créer les rôles realm ──────────────────────────────────────────────────
for ROLE in admin manager technicien utilisateur; do
  STATUS=$(kc -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
    -d "{\"name\":\"$ROLE\"}")
  if [ "$STATUS" = "201" ]; then
    echo "✓ Rôle '$ROLE' créé"
  else
    echo "  (rôle '$ROLE' déjà existant ou erreur $STATUS)"
  fi
done

# ── 5. Créer les utilisateurs de test ─────────────────────────────────────────
create_user() {
  local USERNAME="$1"
  local PASSWORD="$2"
  local ROLE="$3"

  # Créer l'utilisateur
  STATUS=$(kc -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
    -d "{
      \"username\": \"$USERNAME\",
      \"enabled\": true,
      \"emailVerified\": true,
      \"email\": \"$USERNAME@fleet.local\",
      \"firstName\": \"$(echo $USERNAME | sed 's/.*/\u&/')\",
      \"lastName\": \"FleetUser\",
      \"credentials\": [{
        \"type\": \"password\",
        \"value\": \"$PASSWORD\",
        \"temporary\": false
      }]
    }")

  if [ "$STATUS" = "201" ]; then
    echo "✓ Utilisateur '$USERNAME' créé"
  else
    echo "  (utilisateur '$USERNAME' déjà existant ou erreur $STATUS)"
  fi

  # Récupérer l'ID de l'utilisateur
  USER_ID=$(kc_get "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$USERNAME&exact=true" \
    | python3 -c "import sys,json; l=json.load(sys.stdin); print(l[0]['id'] if l else '')" 2>/dev/null || echo "")

  if [ -z "$USER_ID" ]; then
    echo "  AVERTISSEMENT : impossible de trouver l'ID de $USERNAME"
    return
  fi

  # Récupérer l'ID du rôle
  ROLE_OBJ=$(kc_get "$KEYCLOAK_URL/admin/realms/$REALM/roles/$ROLE")
  ROLE_ID=$(echo "$ROLE_OBJ" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

  if [ -z "$ROLE_ID" ]; then
    echo "  AVERTISSEMENT : rôle '$ROLE' introuvable pour $USERNAME"
    return
  fi

  # Assigner le rôle
  STATUS=$(kc -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
    -d "[{\"id\":\"$ROLE_ID\",\"name\":\"$ROLE\"}]")
  echo "  → Rôle '$ROLE' assigné à '$USERNAME' (HTTP $STATUS)"
}

echo ""
echo ">>> Création des utilisateurs de test..."
create_user "admin"       "admin123"      "admin"
create_user "manager1"    "manager123"    "manager"
create_user "tech1"       "tech123"       "technicien"
create_user "user1"       "user123"       "utilisateur"

# ── 6. Résumé ──────────────────────────────────────────────────────────────────
echo ""
echo "======================================================="
echo " SETUP KEYCLOAK TERMINÉ"
echo "======================================================="
echo " Realm    : $REALM"
echo " Client   : $CLIENT_ID (public)"
echo " CORS     : $ORIGIN"
echo " Redirect : $REDIRECT_URI"
echo ""
echo " Comptes de test :"
echo "   admin      / admin123    → rôle: admin"
echo "   manager1   / manager123  → rôle: manager"
echo "   tech1      / tech123     → rôle: technicien"
echo "   user1      / user123     → rôle: utilisateur"
echo ""
echo " URL Admin : $KEYCLOAK_URL/admin/master/console/#/$REALM"
echo "======================================================="
