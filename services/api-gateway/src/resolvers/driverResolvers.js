const driverDS   = require('../datasources/DriverDataSource');
const vehicleDS  = require('../datasources/VehicleDataSource');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const READ_ROLES  = ['Admin', 'Technicien', 'Conducteur'];
const WRITE_ROLES = ['Admin', 'Technicien'];

const driverResolvers = {
  Query: {
    drivers: (_, __, { user }) => {
      requireRole(user, ...READ_ROLES);
      return driverDS.getDrivers(user.rawToken);
    },
    driver: (_, { id }, { user }) => {
      requireRole(user, ...READ_ROLES);
      return driverDS.getDriverById(id, user.rawToken);
    },
  },

  Mutation: {
    createDriver: (_, { input }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return driverDS.createDriver(input, user.rawToken);
    },
    updateDriver: (_, { id, input }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return driverDS.updateDriver(id, input, user.rawToken);
    },
    deleteDriver: (_, { id }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      return driverDS.deleteDriver(id, user.rawToken);
    },
    createAssignment: (_, { driverId, input }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      const client = require('axios').create({
        baseURL: require('../config/services').DRIVER_SERVICE_URL,
        headers: { Authorization: `Bearer ${user.rawToken}` },
      });
      return client.post(`/drivers/${driverId}/assignments`, input).then((r) => r.data);
    },
    closeAssignment: (_, { assignmentId, input = {} }, { user }) => {
      requireRole(user, ...WRITE_ROLES);
      const client = require('axios').create({
        baseURL: require('../config/services').DRIVER_SERVICE_URL,
        headers: { Authorization: `Bearer ${user.rawToken}` },
      });
      return client.put(`/assignments/${assignmentId}/end`, input).then((r) => r.data);
    },
  },

  Driver: {
    currentAssignment: (driver, _, { user }) => {
      if (!user) return null;
      return driverDS.getActiveAssignmentByDriver(driver.id, user.rawToken);
    },
  },

  Assignment: {
    driver: (assignment, _, { user }) => {
      if (!user) return null;
      return driverDS.getDriverById(assignment.driverId, user.rawToken);
    },
    vehicle: (assignment, _, { user }) => {
      if (!user) return null;
      return vehicleDS.getVehicleById(assignment.vehicleId, user.rawToken);
    },
  },
};

module.exports = driverResolvers;
