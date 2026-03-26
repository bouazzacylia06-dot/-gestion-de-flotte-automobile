const express = require('express');
const app = express();
const port = 3004;

// Middleware
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Évènements - Microservice de gestion des évènements');
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Service Évènements démarré sur le port ${port}`);
});

