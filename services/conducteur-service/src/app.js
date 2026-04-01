require('dotenv').config();

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
const { authenticate, authorize } = require('./middleware/authMiddleware');

const app = express();
const port = Number(process.env.APP_PORT || 3001);

// Middleware
app.use(express.json());
app.use(cors());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Conducteur - Microservice de gestion des conducteurs');
});

const READ_ROLES = ['Admin', 'Conducteur', 'Technicien'];
const WRITE_ROLES = ['Admin', 'Technicien'];

// Toutes les routes sauf '/' nécessitent l'authentification Keycloak
app.use('/drivers', authenticate);
app.use('/assignments', authenticate);

// CRUD Conducteurs
app.get('/drivers', authorize(...READ_ROLES), conducteurController.getConducteurs);
app.post('/drivers', authorize(...WRITE_ROLES), validateConducteurPayload, conducteurController.createConducteur);
app.get('/drivers/:id', authorize(...READ_ROLES), validateConducteurId, conducteurController.getConducteurById);
app.put('/drivers/:id', authorize(...WRITE_ROLES), validateConducteurId, validateConducteurPayload, conducteurController.updateConducteur);
app.delete('/drivers/:id', authorize(...WRITE_ROLES), validateConducteurId, conducteurController.deleteConducteur);

// Assignations
app.get('/drivers/:id/assignments', authorize(...READ_ROLES), validateConducteurId, conducteurController.getAssignmentsByDriver);
app.post('/drivers/:id/assignments', authorize(...WRITE_ROLES), validateConducteurId, validateAssignmentPayload, conducteurController.createAssignmentForDriver);
app.put('/assignments/:assignmentId/end', authorize(...WRITE_ROLES), validateAssignmentId, validateAssignmentClosePayload, conducteurController.closeAssignment);

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

