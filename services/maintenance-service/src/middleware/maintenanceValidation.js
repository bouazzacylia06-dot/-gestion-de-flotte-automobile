const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const VALID_STATUSES = ['planifiee', 'en_cours', 'terminee', 'annulee'];
const VALID_TYPES = ['vidange', 'revision', 'pneus', 'freins', 'autre'];

const validateMaintenanceId = (req, res, next) => {
  const { id } = req.params;
  if (typeof id !== 'string' || !isUuid(id.trim())) {
    return res.status(400).json({
      message: 'Validation error',
      errors: ['Path parameter id must be a valid UUID'],
    });
  }
  return next();
};

const validateMaintenancePayload = (req, res, next) => {
  const errors = [];
  const { body } = req;

  if (!isPlainObject(body)) {
    return res.status(400).json({
      message: 'Validation error',
      errors: ['Request body must be a JSON object'],
    });
  }

  if (body.id !== undefined && (typeof body.id !== 'string' || !isUuid(body.id.trim()))) {
    errors.push('id must be a valid UUID when provided');
  }

  if (typeof body.vehicleId !== 'string' || body.vehicleId.trim().length === 0) {
    errors.push('vehicleId is required and must be a non-empty string');
  }

  if (typeof body.date !== 'string' || body.date.trim().length === 0) {
    errors.push('date is required and must be a non-empty string');
  } else if (isNaN(Date.parse(body.date))) {
    errors.push('date must be a valid date (ISO 8601)');
  }

  if (typeof body.type !== 'string' || !VALID_TYPES.includes(body.type.trim())) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }

  if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (typeof body.cost !== 'number' || body.cost < 0) {
    errors.push('cost is required and must be a non-negative number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation error', errors });
  }

  return next();
};

module.exports = { validateMaintenanceId, validateMaintenancePayload };
