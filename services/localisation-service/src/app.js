const express = require('express');
const app = express();
const port = 3003;

// Middleware
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Localisations - Microservice de gestion des localisations');
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Service Localisation démarré sur le port ${port}`);
});

