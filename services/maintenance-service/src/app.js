const express = require('express');
const cors = require('cors');
const maintenanceController = require('./controllers/maintenanceController');
const { validateMaintenanceId, validateMaintenancePayload } = require('./middleware/maintenanceValidation');
const { authenticate, requireRole } = require('./middleware/authMiddleware');
const kafkaProducer = require('./kafka/producer');
const kafkaConsumer = require('./kafka/consumer');
const { startGeoAlertsConsumer } = require('./kafka/geoAlertsConsumer');

const app = express();
const port = 3002;

app.use(express.json());
app.use(cors());

app.get('/', (_req, res) => {
  res.send('Service Maintenance - Microservice de gestion des maintenances');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'maintenance-service' });
});

// Lecture — tout utilisateur authentifié
app.get('/maintenance', authenticate, maintenanceController.getMaintenances);
app.get('/maintenance/:id', authenticate, validateMaintenanceId, maintenanceController.getMaintenanceById);

// Écriture — manager ou admin
app.post('/maintenance', authenticate, requireRole('admin', 'manager', 'technicien'), validateMaintenancePayload, maintenanceController.createMaintenance);
app.put('/maintenance/:id', authenticate, requireRole('admin', 'manager', 'technicien'), validateMaintenanceId, validateMaintenancePayload, maintenanceController.updateMaintenance);

// Suppression — admin uniquement
app.delete('/maintenance/:id', authenticate, requireRole('admin'), validateMaintenanceId, maintenanceController.deleteMaintenance);

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
    await startGeoAlertsConsumer();
  } catch (err) {
    console.error('[Kafka] Erreur de connexion (non bloquant):', err.message);
  }
};

app.listen(port, async () => {
  console.log(`Service Maintenance démarré sur le port ${port}`);
  await startKafka();
});
