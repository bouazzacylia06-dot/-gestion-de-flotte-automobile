const vehicleService = require('../services/vehicleService');

const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.listVehicles();
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(200).json(vehicle);
  } catch (error) {
    return next(error);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(200).json(vehicle);
  } catch (error) {
    return next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const deleted = await vehicleService.deleteVehicle(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};