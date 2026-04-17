const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { authenticate, requireRole } = require('./middleware/authMiddleware');

const app = express();
const port = 3004;

app.use(express.json());
app.use(cors());

const evenements = new Map();
const VALID_TYPES = ['alerte', 'panne', 'accident', 'revision', 'autre'];

const isValidPayload = (body) =>
  body &&
  typeof body.vehiculeId === 'string' && body.vehiculeId.trim().length > 0 &&
  typeof body.type === 'string' && VALID_TYPES.includes(body.type) &&
  typeof body.description === 'string' && body.description.trim().length > 0 &&
  typeof body.date === 'string' && !isNaN(Date.parse(body.date));

app.get('/', (_req, res) => {
  res.send('Service Évènements - Microservice de gestion des évènements');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'evenement-service' });
});

// Lecture — tout utilisateur authentifié
app.get('/evenements', authenticate, (_req, res) => {
  res.status(200).json(Array.from(evenements.values()));
});

app.get('/evenements/:id', authenticate, (req, res) => {
  const evenement = evenements.get(req.params.id);
  if (!evenement) return res.status(404).json({ message: 'Évènement not found' });
  return res.status(200).json(evenement);
});

// Écriture — manager, technicien ou admin
app.post('/evenements', authenticate, requireRole('admin', 'manager', 'technicien'), (req, res) => {
  if (!isValidPayload(req.body)) {
    return res.status(400).json({ message: 'Payload invalide', errors: [`vehiculeId, type (${VALID_TYPES.join('|')}), description, date (ISO 8601) requis`] });
  }
  const evenement = {
    id: randomUUID(),
    vehiculeId: req.body.vehiculeId.trim(),
    type: req.body.type,
    description: req.body.description.trim(),
    date: req.body.date,
  };
  evenements.set(evenement.id, evenement);
  return res.status(201).json(evenement);
});

// Suppression — admin uniquement
app.delete('/evenements/:id', authenticate, requireRole('admin'), (req, res) => {
  if (!evenements.has(req.params.id)) return res.status(404).json({ message: 'Évènement not found' });
  evenements.delete(req.params.id);
  return res.status(204).send();
});

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => res.status(err.status || 500).json({ message: err.message || 'Internal server error' }));

app.listen(port, () => {
  console.log(`Service Évènements démarré sur le port ${port}`);
});
