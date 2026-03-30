const conducteurService = require('../services/conducteurService');

const getConducteurs = async (req, res, next) => {
  try {
    const conducteurs = await conducteurService.listConducteurs();
    res.status(200).json(conducteurs);
  } catch (error) {
    next(error);
  }
};

const getConducteurById = async (req, res, next) => {
  try {
    const conducteur = await conducteurService.getConducteurById(req.params.id);

    if (!conducteur) {
      return res.status(404).json({ message: 'Conducteur not found' });
    }

    return res.status(200).json(conducteur);
  } catch (error) {
    return next(error);
  }
};

const createConducteur = async (req, res, next) => {
  try {
    const conducteur = await conducteurService.createConducteur(req.body);
    res.status(201).json(conducteur);
  } catch (error) {
    next(error);
  }
};

const updateConducteur = async (req, res, next) => {
  try {
    const conducteur = await conducteurService.updateConducteur(req.params.id, req.body);

    if (!conducteur) {
      return res.status(404).json({ message: 'Conducteur not found' });
    }

    return res.status(200).json(conducteur);
  } catch (error) {
    return next(error);
  }
};

const deleteConducteur = async (req, res, next) => {
  try {
    const deleted = await conducteurService.deleteConducteur(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Conducteur not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const getAssignmentsByDriver = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const assignments = await conducteurService.listAssignmentsByDriver(req.params.id, { activeOnly });

    if (!assignments) {
      return res.status(404).json({ message: 'Conducteur not found' });
    }

    return res.status(200).json(assignments);
  } catch (error) {
    return next(error);
  }
};

const createAssignmentForDriver = async (req, res, next) => {
  try {
    const assignment = await conducteurService.createAssignmentForDriver(req.params.id, req.body);

    if (!assignment) {
      return res.status(404).json({ message: 'Conducteur not found' });
    }

    return res.status(201).json(assignment);
  } catch (error) {
    return next(error);
  }
};

const closeAssignment = async (req, res, next) => {
  try {
    const assignment = await conducteurService.closeAssignment(req.params.assignmentId, req.body);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getConducteurs,
  getConducteurById,
  createConducteur,
  updateConducteur,
  deleteConducteur,
  getAssignmentsByDriver,
  createAssignmentForDriver,
  closeAssignment,
};