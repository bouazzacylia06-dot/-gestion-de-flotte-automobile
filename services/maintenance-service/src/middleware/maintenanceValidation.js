const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isValidDate = (dateStr) => !isNaN(Date.parse(dateStr));

const validateMaintenanceId = (req, res, next) => {
  const id = req.params.id?.trim();
  if (!id || !isUuid(id)) {
    return res.status(400).json({ message: 'Invalid UUID', errors: ['id'] });
  }
  next();
};

const validateVehicleId = (req, res, next) => {
  const vehicleId = req.params.vehicleId?.trim();
  if (!vehicleId || !isUuid(vehicleId)) {
    return res.status(400).json({ message: 'Invalid UUID', errors: ['vehicleId'] });
  }
  next();
};

const validateMaintenancePayload = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (!isPlainObject(body)) errors.push('Invalid JSON');

  if (!body.vehicleId || !isUuid(body.vehicleId)) errors.push('vehicleId UUID required');
  if (!body.typeMaintenance || !['PREVENTIVE', 'CURATIVE'].includes(body.typeMaintenance)) errors.push('typeMaintenance invalid');
  if (body.dateDebut && !isValidDate(body.dateDebut)) errors.push('dateDebut invalid');
  if (body.dateFin && (!isValidDate(body.dateFin) || new Date(body.dateFin) <= new Date(body.dateDebut))) errors.push('dateFin invalid');
  if (body.statut && !['PLANIFIÉ', 'EN_COURS', 'TERMINÉ', 'ANNULÉ'].includes(body.statut)) errors.push('statut invalid');

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  next();
};

const validateCompletePayload = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (body.dateFin && !isValidDate(body.dateFin)) errors.push('dateFin invalid');
  if (body.cout !== undefined && (typeof body.cout !== 'number' || body.cout < 0)) errors.push('cout invalid');

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  next();
};

module.exports = {
  validateMaintenanceId,
  validateVehicleId,
  validateMaintenancePayload,
  validateCompletePayload,
};
