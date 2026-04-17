const { randomUUID } = require('crypto');
const maintenanceRepository = require('../repositories/maintenanceRepository');

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeMaintenance = (payload, id) => ({
  id,
  vehicleId: payload.vehicleId.trim(),
  date: payload.date,
  type: payload.type.trim(),
  status: payload.status,
  cost: payload.cost,
});

const listMaintenances = () => maintenanceRepository.findAll();

const getMaintenanceById = (id) => maintenanceRepository.findById(id);

const createMaintenance = async (payload) => {
  const requestedId = typeof payload.id === 'string' ? payload.id.trim() : '';
  const id = requestedId || randomUUID();

  if (!isUuid(id)) {
    const error = new Error('Maintenance id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  if (await maintenanceRepository.exists(id)) {
    const error = new Error('Maintenance id already exists');
    error.status = 409;
    throw error;
  }

  const maintenance = normalizeMaintenance(payload, id);
  return maintenanceRepository.create(maintenance);
};

const updateMaintenance = async (id, payload) => {
  if (!isUuid(id)) {
    const error = new Error('Maintenance id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  if (!(await maintenanceRepository.exists(id))) {
    return null;
  }

  const maintenance = normalizeMaintenance(payload, id);
  return maintenanceRepository.update(id, maintenance);
};

const deleteMaintenance = async (id) => {
  if (!isUuid(id)) {
    const error = new Error('Maintenance id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  return maintenanceRepository.remove(id);
};

module.exports = {
  listMaintenances,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
};
