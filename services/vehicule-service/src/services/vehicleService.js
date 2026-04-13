const { randomUUID } = require('crypto');
const vehicleRepository = require('../repositories/vehicleRepository');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeVehicle = (payload, id) => ({
  id,
  immatriculation: payload.immatriculation.trim(),
  marque: payload.marque.trim(),
  modele: payload.modele.trim(),
  statut: payload.statut,
});

const listVehicles = () => vehicleRepository.findAll();

const getVehicleById = (id) => vehicleRepository.findById(id);

const createVehicle = async (payload) => {
  const requestedId = typeof payload.id === 'string' ? payload.id.trim() : '';
  const id = requestedId || randomUUID();

  if (!isUuid(id)) {
    const error = new Error('Vehicle id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  if (await vehicleRepository.exists(id)) {
    const error = new Error('Vehicle id already exists');
    error.status = 409;
    throw error;
  }

  const vehicle = normalizeVehicle(payload, id);
  return vehicleRepository.create(vehicle);
};

const updateVehicle = async (id, payload) => {
  if (!isUuid(id)) {
    const error = new Error('Vehicle id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  if (!(await vehicleRepository.exists(id))) {
    return null;
  }

  const vehicle = normalizeVehicle(payload, id);
  return vehicleRepository.update(id, vehicle);
};

const deleteVehicle = async (id) => {
  if (!isUuid(id)) {
    const error = new Error('Vehicle id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  return vehicleRepository.remove(id);
};

module.exports = {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};