const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { authenticate, requireRole } = require('./middleware/authMiddleware');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const conducteurs = new Map();

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
