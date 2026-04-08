const { mergeResolvers } = require('@graphql-tools/merge');
const vehicleResolvers     = require('./vehicleResolvers');
const driverResolvers      = require('./driverResolvers');
const maintenanceResolvers = require('./maintenanceResolvers');
const locationDS           = require('../datasources/LocationDataSource');
const { requireRole }      = require('../middleware/authMiddleware');

// Resolvers de localisation (simples, définis ici directement)
const locationResolvers = {
  Query: {
    locations: (_, __, { user }) => {
      requireRole(user, 'Admin', 'Technicien', 'Conducteur');
      return locationDS.getLocations(user.rawToken);
    },
    location: (_, { vehicleId }, { user }) => {
      requireRole(user, 'Admin', 'Technicien', 'Conducteur');
      return locationDS.getLocationByVehicle(vehicleId, user.rawToken);
    },
  },
  Mutation: {
    updateLocation: (_, { vehicleId, latitude, longitude }, { user }) => {
      requireRole(user, 'Admin', 'Technicien');
      return locationDS.updateLocation({ vehicleId, latitude, longitude }, user.rawToken);
    },
  },
};

// Fusionner tous les resolvers (Query, Mutation et type resolvers)
const resolvers = mergeResolvers([
  vehicleResolvers,
  driverResolvers,
  maintenanceResolvers,
  locationResolvers,
]);

module.exports = resolvers;
