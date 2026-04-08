// URLs de base de chaque microservice en aval
// En développement local : utiliser localhost
// En K8s : utiliser les noms de service DNS internes
module.exports = {
  VEHICLE_SERVICE_URL:      process.env.VEHICLE_SERVICE_URL      || 'http://localhost:3000',
  DRIVER_SERVICE_URL:       process.env.DRIVER_SERVICE_URL       || 'http://localhost:3001',
  MAINTENANCE_SERVICE_URL:  process.env.MAINTENANCE_SERVICE_URL  || 'http://localhost:3002',
  LOCATION_SERVICE_URL:     process.env.LOCATION_SERVICE_URL     || 'http://localhost:3003',
};
