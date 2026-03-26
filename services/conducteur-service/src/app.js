const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.send('Service Conducteur - Microservice de gestion des conducteurs');
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Service Conducteur démarré sur le port ${port}`);
});

