const mainDS    = require('../datasources/MaintenanceDataSource');
const vehicleDS = require('../datasources/VehicleDataSource');
const { requireRole } = require('../middleware/authMiddleware');

const READ_ROLES  = ['Admin', 'Technicien', 'Conducteur'];
const WRITE_ROLES = ['Admin', 'Technicien'];

const maintenanceResolvers = {
  Query: {
    maintenances: (_, filters, { user }) => {
      requireRole(user, ...READ_ROLES);
      return mainDS.getMaintenances(filters, user.rawToken);
    },
    maintenance: (_, { id }, { user }) => {
      requireRole(user, ...READ_ROLES);
      return mainDS.getMaintenanceById(id, user.rawToken);
    },
  },

  Mutation: {
    createMaintenance: (_, { input }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return mainDS.createMaintenance(input, user.rawToken);
    },
    updateMaintenance: (_, { id, input }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return mainDS.updateMaintenance(id, input, user.rawToken);
    },
    deleteMaintenance: (_, { id }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return mainDS.deleteMaintenance(id, user.rawToken);
    },
    startMaintenance: (_, { id }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return mainDS.startMaintenance(id, user.rawToken);
    },
    completeMaintenance: (_, { id, input = {} }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return mainDS.completeMaintenance(id, input, user.rawToken);
    },
  },

  Maintenance: {
    vehicle: (maintenance, _, { user }) => {
      if (!user) return null;
      return vehicleDS.getVehicleById(maintenance.vehicleId, user.rawToken);
    },
  },
};

module.exports = maintenanceResolvers;
