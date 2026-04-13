const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const REALM = process.env.KEYCLOAK_REALM || 'flotte';

const jwksClient = jwksRsa({
  jwksUri: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000,
  rateLimit: true,
});

const getSigningKey = (header, callback) => {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token d\'authentification manquant' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getSigningKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token invalide ou expiré', error: err.message });
    }
    req.user = decoded;
    req.userRoles = decoded.realm_access?.roles || [];
    return next();
  });
};

const requireRole = (...roles) => (req, res, next) => {
  const hasRole = roles.some((role) => req.userRoles.includes(role));
  if (!hasRole) {
    return res.status(403).json({
      message: 'Accès interdit — rôle insuffisant',
      required: roles,
      current: req.userRoles,
    });
  }
  return next();
};

module.exports = { authenticate, requireRole };
