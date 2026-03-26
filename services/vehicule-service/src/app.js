const express = require('express');
const cors = require('cors');
const vehicleController = require('./controllers/vehicleController');
const {
  validateVehicleId,
  validateVehiclePayload,
} = require('./middleware/vehicleValidation');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Véhicules - Microservice de gestion des véhicules');
});

// CRUD Véhicules
app.get('/vehicles', vehicleController.getVehicles);
app.post('/vehicles', validateVehiclePayload, vehicleController.createVehicle);
app.get('/vehicles/:id', validateVehicleId, vehicleController.getVehicleById);
app.put('/vehicles/:id', validateVehicleId, validateVehiclePayload, vehicleController.updateVehicle);
app.delete('/vehicles/:id', validateVehicleId, vehicleController.deleteVehicle);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Service Véhicules démarré sur le port ${port}`);
});

