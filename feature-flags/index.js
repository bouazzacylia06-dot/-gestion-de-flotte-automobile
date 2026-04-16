// feature-flags/index.js — Service de Feature Flags (Canary Deployment)
// Port: 3006 | Routes: GET /flags, GET /flags/:name, PUT /flags/:name, GET /health
const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app        = express();
const FLAGS_FILE = path.join(__dirname, 'flags.json');
const PORT       = process.env.PORT || 3006;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function readFlags() {
  return JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf-8'));
}

function writeFlags(data) {
  fs.writeFileSync(FLAGS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Canary rollout : détermine si un flag est actif pour un userId donné.
 * Utilise un hash stable (somme des codes de caractères % 100) pour
 * assurer que le même utilisateur voit toujours le même comportement.
 */
function isRolledOut(flag, userId) {
  if (!flag.enabled) return false;
  if (flag.rolloutPercentage >= 100) return true;
  if (flag.rolloutPercentage <= 0)   return false;
  // Hash deterministe basé sur userId
  const hash = String(userId || 'anonymous')
    .split('')
    .reduce((acc, c) => (acc + c.charCodeAt(0)) % 100, 0);
  return hash < flag.rolloutPercentage;
}

// ── ROUTES ───────────────────────────────────────────────────

// GET /health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'feature-flags', version: '1.0.0' });
});

// GET /flags[?role=admin&userId=abc123]
// Retourne tous les flags filtrés par rôle avec statut canary
app.get('/flags', (req, res) => {
  const { role, userId } = req.query;
  const data = readFlags();

  const result = {};
  for (const [key, flag] of Object.entries(data.flags)) {
    // Filtrage par rôle (si spécifié)
    if (role && flag.targetRoles && !flag.targetRoles.includes(role)) continue;

    result[key] = {
      ...flag,
      active: isRolledOut(flag, userId),
    };
  }
  res.json(result);
});

// GET /flags/:name[?userId=abc123]
app.get('/flags/:name', (req, res) => {
  const data = readFlags();
  const flag = data.flags[req.params.name];
  if (!flag) return res.status(404).json({ error: `Flag '${req.params.name}' introuvable` });

  res.json({
    ...flag,
    active: isRolledOut(flag, req.query.userId),
  });
});

// PUT /flags/:name — Modifier un flag (hot-reload sans redémarrage)
// En production, cette route devrait être protégée par JWT admin
app.put('/flags/:name', (req, res) => {
  const data = readFlags();
  if (!data.flags[req.params.name]) {
    return res.status(404).json({ error: `Flag '${req.params.name}' introuvable` });
  }
  const allowed = ['enabled', 'rolloutPercentage', 'description', 'targetRoles'];
  const update  = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  data.flags[req.params.name] = { ...data.flags[req.params.name], ...update };
  writeFlags(data);
  console.log(`🚩 Flag mis à jour: ${req.params.name} →`, update);
  res.json({ ...data.flags[req.params.name], active: isRolledOut(data.flags[req.params.name], null) });
});

// GET / — Accueil
app.get('/', (_req, res) => {
  res.json({
    service: 'feature-flags',
    routes:  ['GET /health', 'GET /flags', 'GET /flags/:name', 'PUT /flags/:name'],
  });
});

app.listen(PORT, () => {
  console.log(`🚩 Feature Flags service démarré sur :${PORT}`);
  console.log(`   Flags disponibles : ${Object.keys(readFlags().flags).join(', ')}`);
});
