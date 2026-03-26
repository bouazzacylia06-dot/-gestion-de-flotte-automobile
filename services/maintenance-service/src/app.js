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

