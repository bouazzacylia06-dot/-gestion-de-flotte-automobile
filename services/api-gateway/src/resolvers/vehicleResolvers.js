const vehicleDS   = require('../datasources/VehicleDataSource');
const driverDS    = require('../datasources/DriverDataSource');
const mainDS      = require('../datasources/MaintenanceDataSource');
const locationDS  = require('../datasources/LocationDataSource');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const READ_ROLES  = ['Admin', 'Technicien', 'Conducteur'];
const WRITE_ROLES = ['Admin', 'Technicien'];

const vehicleResolvers = {
  Query: {
    vehicles: (_, __, { user }) => {
      requireRole(user, ...READ_ROLES);
      return vehicleDS.getVehicles(user.rawToken);
    },
    vehicle: (_, { id }, { user }) => {
      requireRole(user, ...READ_ROLES);
      return vehicleDS.getVehicleById(id, user.rawToken);
    },
    vehicleWithDetails: (_, { id }, { user }) => {
      requireRole(user, ...READ_ROLES);
      return vehicleDS.getVehicleById(id, user.rawToken);
    },
    fleetDashboard: async (_, __, { user }) => {
      requireRole(user, ...READ_ROLES);
      const token = user.rawToken;
      const [vehicles, drivers, maintenances] = await Promise.all([
        vehicleDS.getVehicles(token).catch(() => []),
        driverDS.getDrivers(token).catch(() => []),
        mainDS.getMaintenances({}, token).catch(() => []),
      ]);
      return {
        totalVehicles:          vehicles.length,
        availableVehicles:      vehicles.filter((v) => v.statut === 'AVAILABLE').length,
        inUseVehicles:          vehicles.filter((v) => v.statut === 'IN_USE').length,
        inMaintenanceVehicles:  vehicles.filter((v) => v.statut === 'MAINTENANCE').length,
        retiredVehicles:        vehicles.filter((v) => v.statut === 'RETIRED').length,
        totalDrivers:           drivers.length,
        pendingMaintenances:    maintenances.filter((m) => m.statut === 'PLANIFIÉ').length,
        activeMaintenances:     maintenances.filter((m) => m.statut === 'EN_COURS').length,
      };
    },
  },

  Mutation: {
    createVehicle: (_, { input }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return vehicleDS.createVehicle(input, user.rawToken);
    },
    updateVehicle: (_, { id, input }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return vehicleDS.updateVehicle(id, input, user.rawToken);
    },
    deleteVehicle: (_, { id }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return vehicleDS.deleteVehicle(id, user.rawToken);
    },
  },

  // Resolvers de champs — agrégation lazy (chargée seulement si demandée)
  Vehicle: {
    currentDriver: (vehicle, _, { user }) => {
      if (!user) return null;
      return driverDS.getActiveDriverByVehicleId(vehicle.id, user.rawToken);
    },
    maintenanceHistory: (vehicle, _, { user }) => {
      if (!user) return [];
      return mainDS.getMaintenancesByVehicle(vehicle.id, user.rawToken);
    },
    currentLocation: (vehicle, _, { user }) => {
      if (!user) return null;
      return locationDS.getLocationByVehicle(vehicle.id, user.rawToken);
    },
  },
};

module.exports = vehicleResolvers;
