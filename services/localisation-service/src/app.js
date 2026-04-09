<<<<<<< HEAD
require('dotenv').config();

const express = require('express');
const app = express();
const port = 3003;
const { authenticate } = require('./middleware/authMiddleware');
=======
const express = require('express');
const app = express();
const port = 3003;
>>>>>>> f6744b537b40886e59861b781c122c56d941867f

// Middleware
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Localisations - Microservice de gestion des localisations');
});

<<<<<<< HEAD
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return next();
  }

  return authenticate(req, res, next);
});

=======
>>>>>>> f6744b537b40886e59861b781c122c56d941867f
// Démarrage du serveur
app.listen(port, () => {
  console.log(`Service Localisation démarré sur le port ${port}`);
});

