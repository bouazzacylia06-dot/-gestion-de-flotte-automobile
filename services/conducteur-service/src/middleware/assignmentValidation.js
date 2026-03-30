const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isValidDateString = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
};

const validateAssignmentId = (req, res, next) => {
  const { assignmentId } = req.params;

  if (typeof assignmentId !== 'string' || !isUuid(assignmentId.trim())) {
    return res.status(400).json({
      message: 'Validation error',
      errors: ['Path parameter assignmentId must be a valid UUID'],
    });
  }

  return next();
};

const validateAssignmentPayload = (req, res, next) => {
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

  if (typeof body.vehicleId !== 'string' || !isUuid(body.vehicleId.trim())) {
    errors.push('vehicleId is required and must be a valid UUID');
  }

  if (body.dateDebut !== undefined && !isValidDateString(body.dateDebut)) {
    errors.push('dateDebut must be a valid date string when provided');
  }

  if (body.motif !== undefined && (typeof body.motif !== 'string' || body.motif.trim().length === 0)) {
    errors.push('motif must be a non-empty string when provided');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation error',
      errors,
    });
  }

  return next();
};

const validateAssignmentClosePayload = (req, res, next) => {
  const errors = [];
  const { body } = req;

  if (!isPlainObject(body)) {
    return res.status(400).json({
      message: 'Validation error',
      errors: ['Request body must be a JSON object'],
    });
  }

  if (body.dateFin !== undefined && !isValidDateString(body.dateFin)) {
    errors.push('dateFin must be a valid date string when provided');
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
  validateAssignmentId,
  validateAssignmentPayload,
  validateAssignmentClosePayload,
};
