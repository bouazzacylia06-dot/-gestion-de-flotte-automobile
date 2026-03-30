const express = require('express');
const cors = require('cors');
const conducteurController = require('./controllers/conducteurController');
const {
  validateConducteurId,
  validateConducteurPayload,
} = require('./middleware/conducteurValidation');
const {
  validateAssignmentId,
  validateAssignmentPayload,
  validateAssignmentClosePayload,
} = require('./middleware/assignmentValidation');

const app = express();
const port = Number(process.env.APP_PORT || 3001);

// Middleware
app.use(express.json());
app.use(cors());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Conducteur - Microservice de gestion des conducteurs');
});

// CRUD Conducteurs
app.get('/drivers', conducteurController.getConducteurs);
app.post('/drivers', validateConducteurPayload, conducteurController.createConducteur);
app.get('/drivers/:id', validateConducteurId, conducteurController.getConducteurById);
app.put('/drivers/:id', validateConducteurId, validateConducteurPayload, conducteurController.updateConducteur);
app.delete('/drivers/:id', validateConducteurId, conducteurController.deleteConducteur);

// Assignations
app.get('/drivers/:id/assignments', validateConducteurId, conducteurController.getAssignmentsByDriver);
app.post('/drivers/:id/assignments', validateConducteurId, validateAssignmentPayload, conducteurController.createAssignmentForDriver);
app.put('/assignments/:assignmentId/end', validateAssignmentId, validateAssignmentClosePayload, conducteurController.closeAssignment);

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
  console.log(`Service Conducteur démarré sur le port ${port}`);
});

