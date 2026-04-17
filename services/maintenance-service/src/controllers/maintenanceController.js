const maintenanceService = require('../services/maintenanceService');
const kafkaProducer = require('../kafka/producer');

const getMaintenances = async (req, res, next) => {
  try {
    const maintenances = await maintenanceService.listMaintenances();
    res.status(200).json(maintenances);
  } catch (error) {
    next(error);
  }
};

const getMaintenanceById = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.getMaintenanceById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance not found' });
    }
    return res.status(200).json(maintenance);
  } catch (error) {
    return next(error);
  }
};

const createMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.createMaintenance(req.body);
    // Saga : notifier vehicule-service de passer le véhicule en MAINTENANCE
    await kafkaProducer.publishMaintenanceEvent('MAINTENANCE_CREATED', maintenance);
    res.status(201).json(maintenance);
  } catch (error) {
    next(error);
  }
};

const updateMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.updateMaintenance(req.params.id, req.body);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance not found' });
    }
    // Saga : notifier vehicule-service selon le nouveau statut
    if (maintenance.status === 'terminee') {
      await kafkaProducer.publishMaintenanceEvent('MAINTENANCE_COMPLETED', maintenance);
    } else if (maintenance.status === 'annulee') {
      await kafkaProducer.publishMaintenanceEvent('MAINTENANCE_CANCELLED', maintenance);
    }
    return res.status(200).json(maintenance);
  } catch (error) {
    return next(error);
  }
};

const deleteMaintenance = async (req, res, next) => {
  try {
    const deleted = await maintenanceService.deleteMaintenance(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Maintenance not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMaintenances,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
};
