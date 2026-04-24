require('./tracing');

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { authenticate, requireRole } = require('./middleware/authMiddleware');
const { httpMetricsMiddleware, recordUserCreated } = require('./metrics');

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());
app.use(cors());
app.use(httpMetricsMiddleware);

const SEED_CONDUCTEURS = [
  { id: 'c1000000-0001-4000-b000-000000000001', nom: 'Martin',    prenom: 'Julien',    numeroPermis: '07-0512-0001', statut: 'actif' },
  { id: 'c1000000-0001-4000-b000-000000000002', nom: 'Dupont',    prenom: 'Sophie',    numeroPermis: '07-0512-0002', statut: 'actif' },
  { id: 'c1000000-0001-4000-b000-000000000003', nom: 'Bernard',   prenom: 'Thomas',    numeroPermis: '07-0512-0003', statut: 'actif' },
  { id: 'c1000000-0001-4000-b000-000000000004', nom: 'Leclerc',   prenom: 'Marie',     numeroPermis: '07-0512-0004', statut: 'actif' },
  { id: 'c1000000-0001-4000-b000-000000000005', nom: 'Moreau',    prenom: 'Pierre',    numeroPermis: '07-0512-0005', statut: 'actif' },
  { id: 'c1000000-0001-4000-b000-000000000006', nom: 'Simon',     prenom: 'Claire',    numeroPermis: '07-0512-0006', statut: 'inactif' },
  { id: 'c1000000-0001-4000-b000-000000000007', nom: 'Laurent',   prenom: 'Antoine',   numeroPermis: '07-0512-0007', statut: 'actif' },
  { id: 'c1000000-0001-4000-b000-000000000008', nom: 'Petit',     prenom: 'Isabelle',  numeroPermis: '07-0512-0008', statut: 'actif' },
  { id: 'c1000000-0001-4000-b000-000000000009', nom: 'Garcia',    prenom: 'Nicolas',   numeroPermis: '07-0512-0009', statut: 'suspendu' },
  { id: 'c1000000-0001-4000-b000-000000000010', nom: 'Roux',      prenom: 'Camille',   numeroPermis: '07-0512-0010', statut: 'actif' },
];
const conducteurs = new Map(SEED_CONDUCTEURS.map((c) => [c.id, c]));

const isValidPayload = (body) =>
  body &&
  typeof body.nom === 'string' && body.nom.trim().length > 0 &&
  typeof body.prenom === 'string' && body.prenom.trim().length > 0 &&
  typeof body.numeroPermis === 'string' && body.numeroPermis.trim().length > 0 &&
  typeof body.statut === 'string' && ['actif', 'inactif', 'suspendu'].includes(body.statut);

app.get('/', (_req, res) => {
  res.send('Service Conducteur - Microservice de gestion des conducteurs');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'conducteur-service' });
});

// Lecture — tout utilisateur authentifié
app.get('/conducteurs', authenticate, (_req, res) => {
  res.status(200).json(Array.from(conducteurs.values()));
});

app.get('/conducteurs/:id', authenticate, (req, res) => {
  const conducteur = conducteurs.get(req.params.id);
  if (!conducteur) return res.status(404).json({ message: 'Conducteur not found' });
  return res.status(200).json(conducteur);
});

// Écriture — manager ou admin
app.post('/conducteurs', authenticate, requireRole('admin', 'manager'), (req, res) => {
  if (!isValidPayload(req.body)) {
    return res.status(400).json({ message: 'Payload invalide', errors: ['nom, prenom, numeroPermis (string) et statut (actif|inactif|suspendu) requis'] });
  }
  const conducteur = {
    id: randomUUID(),
    nom: req.body.nom.trim(),
    prenom: req.body.prenom.trim(),
    numeroPermis: req.body.numeroPermis.trim(),
    statut: req.body.statut,
  };
  conducteurs.set(conducteur.id, conducteur);
  recordUserCreated('conducteur');
  return res.status(201).json(conducteur);
});

app.put('/conducteurs/:id', authenticate, requireRole('admin', 'manager'), (req, res) => {
  if (!conducteurs.has(req.params.id)) return res.status(404).json({ message: 'Conducteur not found' });
  if (!isValidPayload(req.body)) {
    return res.status(400).json({ message: 'Payload invalide', errors: ['nom, prenom, numeroPermis (string) et statut (actif|inactif|suspendu) requis'] });
  }
  const updated = {
    id: req.params.id,
    nom: req.body.nom.trim(),
    prenom: req.body.prenom.trim(),
    numeroPermis: req.body.numeroPermis.trim(),
    statut: req.body.statut,
  };
  conducteurs.set(req.params.id, updated);
  return res.status(200).json(updated);
});

// Suppression — admin uniquement
app.delete('/conducteurs/:id', authenticate, requireRole('admin'), (req, res) => {
  if (!conducteurs.has(req.params.id)) return res.status(404).json({ message: 'Conducteur not found' });
  conducteurs.delete(req.params.id);
  return res.status(204).send();
});

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => res.status(err.status || 500).json({ message: err.message || 'Internal server error' }));

app.listen(port, () => {
  console.log(`Service Conducteur démarré sur le port ${port}`);
});
