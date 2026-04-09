const express = require('express');
const app = express();
const port = 3002;

// Middleware
app.use(express.json());

let maintenanceItems = [];
let nextId = 1;

function isMaintenancePayloadValid(payload) {
  return (
    payload &&
    typeof payload.vehicleId === 'string' &&
    typeof payload.date === 'string' &&
    typeof payload.type === 'string' &&
    typeof payload.status === 'string' &&
    typeof payload.cost === 'number'
  );
}

// Route de base
app.get('/', (req, res) => {
  res.send('Service Maintenance - Microservice de gestion des maintenance');
});

app.get('/maintenance', (req, res) => {
  res.status(200).json(maintenanceItems);
});

app.post('/maintenance', (req, res) => {
  if (!isMaintenancePayloadValid(req.body)) {
    return res.status(400).json({ error: 'Payload maintenance invalide' });
  }

  const maintenance = {
    id: req.body.id || String(nextId++),
    vehicleId: req.body.vehicleId,
    date: req.body.date,
    type: req.body.type,
    status: req.body.status,
    cost: req.body.cost,
  };

  maintenanceItems.push(maintenance);
  return res.status(201).json(maintenance);
});

app.get('/maintenance/:id', (req, res) => {
  const maintenance = maintenanceItems.find((item) => item.id === req.params.id);
  if (!maintenance) {
    return res.status(404).json({ error: 'Maintenance introuvable' });
  }

  return res.status(200).json(maintenance);
});

app.put('/maintenance/:id', (req, res) => {
  if (!isMaintenancePayloadValid(req.body)) {
    return res.status(400).json({ error: 'Payload maintenance invalide' });
  }

  const itemIndex = maintenanceItems.findIndex((item) => item.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Maintenance introuvable' });
  }

  const updatedMaintenance = {
    id: req.params.id,
    vehicleId: req.body.vehicleId,
    date: req.body.date,
    type: req.body.type,
    status: req.body.status,
    cost: req.body.cost,
  };

  maintenanceItems[itemIndex] = updatedMaintenance;
  return res.status(200).json(updatedMaintenance);
});

app.delete('/maintenance/:id', (req, res) => {
  const itemIndex = maintenanceItems.findIndex((item) => item.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Maintenance introuvable' });
  }

  maintenanceItems.splice(itemIndex, 1);
  return res.status(204).send();
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Service Maintenance démarré sur le port ${port}`);
});

