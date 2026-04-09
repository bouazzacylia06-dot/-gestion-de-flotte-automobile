<<<<<<< HEAD
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Controllers
const maintenanceController = require('./controllers/maintenanceController');

// Middleware
const {
  validateMaintenanceId,
  validateVehicleId,
  validateMaintenancePayload,
  validateCompletePayload,
} = require('./middleware/maintenanceValidation');
const { authenticate, authorize } = require('./middleware/authMiddleware');

// Kafka (non-bloquant)
let kafkaConsumerStarted = false;
const startMaintenanceConsumer = require('./kafka/consumer').startMaintenanceConsumer;

const app = express();
const port = Number(process.env.APP_PORT || 3002);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: '*' }));

// Health checks
app.get('/', (req, res) => res.json({ service: 'maintenance-service', status: 'running' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', (req, res) => res.json({ status: 'ready' }));

// Roles
const READ_ROLES = ['Admin', 'Technicien', 'Conducteur'];
const WRITE_ROLES = ['Admin', 'Technicien'];

// Auth
app.use('/maintenances', authenticate);
app.use('/vehicles', authenticate);

// Routes
app.get('/maintenances', authorize(...READ_ROLES), maintenanceController.getMaintenances);
app.post('/maintenances', authorize(...WRITE_ROLES), validateMaintenancePayload, maintenanceController.createMaintenance);
app.get('/maintenances/:id', authorize(...READ_ROLES), validateMaintenanceId, maintenanceController.getMaintenanceById);
app.put('/maintenances/:id', authorize(...WRITE_ROLES), validateMaintenanceId, validateMaintenancePayload, maintenanceController.updateMaintenance);
app.delete('/maintenances/:id', authorize(...WRITE_ROLES), validateMaintenanceId, maintenanceController.deleteMaintenance);

app.patch('/maintenances/:id/start', authorize(...WRITE_ROLES), validateMaintenanceId, maintenanceController.startMaintenance);
app.patch('/maintenances/:id/complete', authorize(...WRITE_ROLES), validateMaintenanceId, validateCompletePayload, maintenanceController.completeMaintenance);

app.get('/vehicles/:vehicleId/maintenances', authorize(...READ_ROLES), validateVehicleId, maintenanceController.getMaintenancesByVehicle);

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Errors
app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ error: error.message || 'Internal Error' });
});

// Listen
const server = app.listen(port, () => {
  console.log(`Maintenance Service listening on port ${port}`);
  
  // Kafka async (non-blocking)
  if (!kafkaConsumerStarted) {
    startMaintenanceConsumer().catch(err => {
      console.warn('Kafka consumer unavailable:', err.message);
    });
    kafkaConsumerStarted = true;
  }
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
  });
});

module.exports = app;
=======
const express = require('express');
const app = express();
const port = 3002;

// Middleware
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Maintenance - Microservice de gestion des maintenance');
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Service Maintenance démarré sur le port ${port}`);
});

>>>>>>> f6744b537b40886e59861b781c122c56d941867f
