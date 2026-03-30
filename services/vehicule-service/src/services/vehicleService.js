const { randomUUID } = require('crypto');
const vehicleRepository = require('../repositories/vehicleRepository');
const { publishVehicleEvent } = require('../kafka/producer');

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
  const createdVehicle = await vehicleRepository.create(vehicle);

  try {
    await publishVehicleEvent({
      eventType: 'vehicule.cree',
      vehicle: createdVehicle,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour vehicule.cree:', error.message);
  }

  return createdVehicle;
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
  const updatedVehicle = await vehicleRepository.update(id, vehicle);

  if (!updatedVehicle) {
    return null;
  }

  try {
    await publishVehicleEvent({
      eventType: 'vehicule.modifie',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour vehicule.modifie:', error.message);
  }

  return updatedVehicle;
};

const deleteVehicle = async (id) => {
  if (!isUuid(id)) {
    const error = new Error('Vehicle id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  const existingVehicle = await vehicleRepository.findById(id);
  if (!existingVehicle) {
    return false;
  }

  const deleted = await vehicleRepository.remove(id);
  if (!deleted) {
    return false;
  }

  try {
    await publishVehicleEvent({
      eventType: 'vehicule.supprime',
      vehicle: existingVehicle,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour vehicule.supprime:', error.message);
  }

  return true;
};

module.exports = {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};