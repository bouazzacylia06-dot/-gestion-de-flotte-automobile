const express = require('express');
const cors = require('cors');
const vehicleController = require('./controllers/vehicleController');
const { validateVehicleId, validateVehiclePayload } = require('./middleware/vehicleValidation');
const { authenticate, requireRole } = require('./middleware/authMiddleware');
const kafkaProducer = require('./kafka/producer');
const kafkaConsumer = require('./kafka/consumer');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.get('/', (_req, res) => {
  res.send('Service Véhicules - Microservice de gestion des véhicules');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'vehicle-service' });
});

// Lecture — tout utilisateur authentifié
app.get('/vehicles', authenticate, vehicleController.getVehicles);
app.get('/vehicles/:id', authenticate, validateVehicleId, vehicleController.getVehicleById);

// Écriture — manager ou admin
app.post('/vehicles', authenticate, requireRole('admin', 'manager'), validateVehiclePayload, vehicleController.createVehicle);
app.put('/vehicles/:id', authenticate, requireRole('admin', 'manager'), validateVehicleId, validateVehiclePayload, vehicleController.updateVehicle);

// Suppression — admin uniquement
app.delete('/vehicles/:id', authenticate, requireRole('admin'), validateVehicleId, vehicleController.deleteVehicle);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const startKafka = async () => {
  try {
    await kafkaProducer.connect();
    await kafkaConsumer.start();
  } catch (err) {
    console.error('[Kafka] Erreur de connexion (non bloquant):', err.message);
  }
};

app.listen(port, async () => {
  console.log(`Service Véhicules démarré sur le port ${port}`);
  await startKafka();
});
