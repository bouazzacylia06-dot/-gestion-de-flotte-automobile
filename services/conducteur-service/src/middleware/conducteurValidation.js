const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateConducteurId = (req, res, next) => {
  const { id } = req.params;

  if (typeof id !== 'string' || !isUuid(id.trim())) {
    return res.status(400).json({
      message: 'Validation error',
      errors: ['Path parameter id must be a valid UUID'],
    });
  }

  return next();
};

const validateConducteurPayload = (req, res, next) => {
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

  if (typeof body.keycloakId !== 'string' || body.keycloakId.trim().length === 0) {
    errors.push('keycloakId is required and must be a non-empty string');
  }

  if (typeof body.numeroPermis !== 'string' || body.numeroPermis.trim().length === 0) {
    errors.push('numeroPermis is required and must be a non-empty string');
  }

  if (typeof body.nom !== 'string' || body.nom.trim().length === 0) {
    errors.push('nom is required and must be a non-empty string');
  }

  if (typeof body.prenom !== 'string' || body.prenom.trim().length === 0) {
    errors.push('prenom is required and must be a non-empty string');
  }

  if (typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.push('email is required and must be a non-empty string');
  } else if (!emailRegex.test(body.email.trim())) {
    errors.push('email must be a valid email address');
  }

  if (typeof body.telephone !== 'string' || body.telephone.trim().length === 0) {
    errors.push('telephone is required and must be a non-empty string');
  }

  if (body.statutPermis !== undefined && typeof body.statutPermis !== 'boolean') {
    errors.push('statutPermis must be a boolean when provided');
  }

  if (body.categoriePermis !== undefined) {
    if (typeof body.categoriePermis !== 'string' || body.categoriePermis.trim().length === 0) {
      errors.push('categoriePermis must be a non-empty string when provided');
    } else if (body.categoriePermis.trim().length > 10) {
      errors.push('categoriePermis must be 10 characters or fewer');
    }
  }

  if (typeof body.statutPermis !== 'boolean') {
    body.statutPermis = true;
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
  validateConducteurId,
  validateConducteurPayload,
};