const axios = require('axios');
const { DRIVER_SERVICE_URL } = require('../config/services');

const makeClient = (token) => axios.create({
  baseURL: DRIVER_SERVICE_URL,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  timeout: 5000,
});

const getDrivers = (token) =>
  makeClient(token).get('/drivers').then((r) => r.data);

const getDriverById = (id, token) =>
  makeClient(token).get(`/drivers/${id}`).then((r) => r.data).catch((e) => {
    if (e.response?.status === 404) return null;
    throw e;
  });

const createDriver = (input, token) =>
  makeClient(token).post('/drivers', input).then((r) => r.data);

const updateDriver = (id, input, token) =>
  makeClient(token).put(`/drivers/${id}`, input).then((r) => r.data).catch((e) => {
    if (e.response?.status === 404) return null;
    throw e;
  });

const deleteDriver = (id, token) =>
  makeClient(token).delete(`/drivers/${id}`).then(() => true).catch((e) => {
    if (e.response?.status === 404) return false;
    throw e;
  });

// Retourne toutes les assignations d'un conducteur. activeOnly=true → uniquement les actives.
const getDriverAssignments = (driverId, activeOnly = false, token) =>
  makeClient(token)
    .get(`/drivers/${driverId}/assignments${activeOnly ? '?active=true' : ''}`)
    .then((r) => r.data)
    .catch((e) => {
      if (e.response?.status === 404) return [];
      throw e;
    });

// Retourne l'assignation active d'un conducteur (ou null)
const getActiveAssignmentByDriver = async (driverId, token) => {
  const list = await getDriverAssignments(driverId, true, token);
  return list.length > 0 ? list[0] : null;
};

// Retourne l'assignation active d'un véhicule en scannant les assignations
// (le conducteur-service expose GET /drivers/:id/assignments?active=true)
// Pour trouver le conducteur d'un véhicule, on interroge tous les conducteurs — stratégie simple MVP
const getActiveDriverByVehicleId = async (vehicleId, token) => {
  try {
    const drivers = await getDrivers(token);
    for (const driver of drivers) {
      const active = await getActiveAssignmentByDriver(driver.id, token);
      if (active && active.vehicleId === vehicleId) return driver;
    }
    return null;
  } catch {
    return null;
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverAssignments,
  getActiveAssignmentByDriver,
  getActiveDriverByVehicleId,
};
