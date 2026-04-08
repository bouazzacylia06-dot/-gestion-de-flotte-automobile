const jwt = require('jsonwebtoken');
const axios = require('axios');

const KEYCLOAK_URL   = process.env.KEYCLOAK_URL   || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'flotte-realm';
const JWKS_URL       = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

let cachedKeys  = null;
let keysFetchedAt = 0;
const CACHE_DURATION = 3600000; // 1 heure

async function getPublicKeys() {
  const now = Date.now();
  if (cachedKeys && (now - keysFetchedAt) < CACHE_DURATION) return cachedKeys;
  const response = await axios.get(JWKS_URL);
  cachedKeys = response.data.keys;
  keysFetchedAt = now;
  return cachedKeys;
}

function getSigningKey(header, keys) {
  const key = keys.find((k) => k.kid === header.kid);
  if (!key) throw new Error('Unable to find matching key');
  return `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
}

// Fonction utilitaire : extraire et vérifier un token Bearer depuis un header Authorization
// Retourne l'objet user décodé, ou null si pas de token
// Lève une erreur si le token est présent mais invalide
async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const keys  = await getPublicKeys();
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) throw new Error('Invalid token format');

  const signingKey = getSigningKey(decoded.header, keys);
  const verified   = jwt.verify(token, signingKey, {
    issuer:   `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
    audience: ['account', process.env.KEYCLOAK_CLIENT_ID || 'api-gateway'],
  });

  return {
    id:          verified.sub,
    keycloakId:  verified.sub,
    username:    verified.preferred_username,
    email:       verified.email,
    roles:       verified.realm_access?.roles || [],
    clientRoles: verified.resource_access?.[process.env.KEYCLOAK_CLIENT_ID || 'api-gateway']?.roles || [],
    rawToken:    token,   // conservé pour le transmettre aux services en aval
  };
}

// Middleware Express : peuple req.user (ou null si pas de token)
// Ne bloque PAS si pas de token — c'est le resolver GraphQL qui décide
async function extractUser(req, res, next) {
  try {
    req.user = await verifyToken(req.headers.authorization);
  } catch (err) {
    req.user      = null;
    req.authError = err.message;
  }
  next();
}

// Helper : vérifie qu'un user est authentifié (à appeler depuis un resolver)
function requireAuth(user) {
  if (!user) {
    const err = new Error('Authentication required');
    err.extensions = { code: 'UNAUTHENTICATED' };
    throw err;
  }
}

// Helper : vérifie qu'un user a au moins un des rôles requis
function requireRole(user, ...roles) {
  requireAuth(user);
  const userRoles = [...(user.roles || []), ...(user.clientRoles || [])];
  if (!roles.some((r) => userRoles.includes(r))) {
    const err = new Error(`Required roles: ${roles.join(', ')}`);
    err.extensions = { code: 'FORBIDDEN' };
    throw err;
  }
}

module.exports = { extractUser, requireAuth, requireRole };
