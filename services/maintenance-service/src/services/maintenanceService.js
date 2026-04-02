const { randomUUID } = require('crypto');
const maintenanceRepository = require('../repositories/maintenanceRepository');
const { publishMaintenanceEvent } = require('../kafka/producer');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeMaintenance = (payload, id) => ({
  id,
  vehicleId: payload.vehicleId.trim(),
  typeMaintenance: payload.typeMaintenance,
  description: payload.description ? payload.description.trim() : null,
  cout: payload.cout,
  coutEstime: payload.coutEstime,
  dateDebut: payload.dateDebut,
  dateFin: payload.dateFin,
  statut: payload.statut || 'PLANIFIÉ',
});

const listMaintenances = ({ vehicleId, statut, typeMaintenance } = {}) => 
  maintenanceRepository.findAll({ vehicleId, statut, typeMaintenance });

const getMaintenanceById = async (id) => {
  if (!isUuid(id)) {
    const error = new Error('Maintenance id must be a valid UUID');
    error.status = 400;
    throw error;
  }
  return maintenanceRepository.findById(id);
};

const getMaintenancesByVehicle = async (vehicleId) => {
  if (!isUuid(vehicleId)) {
    const error = new Error('VehicleId must be a valid UUID');
    error.status = 400;
    throw error;
  }
  return maintenanceRepository.findByVehicleId(vehicleId);
};

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
  const createdMaintenance = await maintenanceRepository.create(maintenance);

  try {
    await publishMaintenanceEvent({
      eventType: 'maintenance.planifie',
      maintenance: createdMaintenance,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour maintenance.planifie:', error.message);
  }

  return createdMaintenance;
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
  const updatedMaintenance = await maintenanceRepository.update(id, maintenance);

  if (!updatedMaintenance) {
    return null;
  }

  try {
    await publishMaintenanceEvent({
      eventType: 'maintenance.modifie',
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour maintenance.modifie:', error.message);
  }

  return updatedMaintenance;
};

const deleteMaintenance = async (id) => {
  if (!isUuid(id)) {
    const error = new Error('Maintenance id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  const existingMaintenance = await maintenanceRepository.findById(id);
  if (!existingMaintenance) {
    return false;
  }

  const deleted = await maintenanceRepository.remove(id);
  if (!deleted) {
    return false;
  }

  try {
    await publishMaintenanceEvent({
      eventType: 'maintenance.supprimee',
      maintenance: existingMaintenance,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour maintenance.supprimee:', error.message);
  }

  return true;
};

const startMaintenance = async (id) => {
  if (!isUuid(id)) {
    const error = new Error('Maintenance id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  const maintenance = await maintenanceRepository.findById(id);
  if (!maintenance) {
    return null;
  }

  if (maintenance.statut !== 'PLANIFIÉ') {
    const error = new Error('Maintenance cannot be started: invalid status');
    error.status = 409;
    throw error;
  }

  const updated = await maintenanceRepository.updateStatus(id, { 
    statut: 'EN_COURS',
    dateFin: null 
  });

  try {
    await publishMaintenanceEvent({
      eventType: 'maintenance.demarree',
      maintenance: updated,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour maintenance.demarree:', error.message);
  }

  return updated;
};

const completeMaintenance = async (id, payload = {}) => {
  if (!isUuid(id)) {
    const error = new Error('Maintenance id must be a valid UUID');
    error.status = 400;
    throw error;
  }

  const maintenance = await maintenanceRepository.findById(id);
  if (!maintenance) {
    return null;
  }

  if (maintenance.statut === 'TERMINÉ' || maintenance.statut === 'ANNULÉ') {
    const error = new Error('Maintenance is already closed');
    error.status = 409;
    throw error;
  }

  const dateFin = payload.dateFin ? new Date(payload.dateFin) : new Date();
  if (Number.isNaN(dateFin.getTime())) {
    const error = new Error('dateFin must be a valid date');
    error.status = 400;
    throw error;
  }

  const dateDebut = new Date(maintenance.dateDebut);
  if (dateFin <= dateDebut) {
    const error = new Error('dateFin must be after dateDebut');
    error.status = 400;
    throw error;
  }

  const cout = payload.cout !== undefined ? payload.cout : maintenance.cout;

  const updated = await maintenanceRepository.updateStatus(id, { 
    statut: 'TERMINÉ',
    dateFin: dateFin.toISOString(),
    cout 
  });

  try {
    await publishMaintenanceEvent({
      eventType: 'maintenance.cloturee',
      maintenance: updated,
    });
  } catch (error) {
    console.error('[Kafka] Publication échouée pour maintenance.cloturee:', error.message);
  }

  return updated;
};

module.exports = {
  listMaintenances,
  getMaintenanceById,
  getMaintenancesByVehicle,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  startMaintenance,
  completeMaintenance,
};
