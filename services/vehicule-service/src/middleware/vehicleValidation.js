const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const validStatus = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'];

const validateVehicleId = (req, res, next) => {
  const { id } = req.params;

  if (typeof id !== 'string' || !isUuid(id.trim())) {
    return res.status(400).json({
      message: 'Validation error',
      errors: ['Path parameter id must be a valid UUID'],
    });
  }

  return next();
};

const validateVehiclePayload = (req, res, next) => {
  const errors = [];
  const { body } = req;

  if (!isPlainObject(body)) {
    return res.status(400).json({
      message: 'Validation error',
      errors: ['Request body must be a JSON object'],
    });
  }

  if (body.id !== undefined && (typeof body.id !== 'string' || body.id.trim().length === 0)) {
    errors.push('id must be a valid UUID when provided');
  }

  if (typeof body.id === 'string' && !isUuid(body.id.trim())) {
    errors.push('id must be a valid UUID when provided');
  }

  if (typeof body.immatriculation !== 'string' || body.immatriculation.trim().length === 0) {
    errors.push('immatriculation is required and must be a non-empty string');
  } else if (body.immatriculation.trim().length > 20) {
    errors.push('immatriculation must be 20 characters or fewer');
  }

  if (typeof body.marque !== 'string' || body.marque.trim().length === 0) {
    errors.push('marque is required and must be a non-empty string');
  }

  if (typeof body.modele !== 'string' || body.modele.trim().length === 0) {
    errors.push('modele is required and must be a non-empty string');
  }

  if (typeof body.statut !== 'string' || !validStatus.includes(body.statut)) {
    errors.push(`statut is required and must be one of: ${validStatus.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation error',
      errors,
    });
  }

  return next();
};

module.exports = {
  validateVehicleId,
  validateVehiclePayload,
};