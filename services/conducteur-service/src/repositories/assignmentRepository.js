const pool = require('../config/db');

const baseSelect = `
  SELECT
    id::text AS id,
    driver_id::text AS driver_id,
    vehicle_id::text AS vehicle_id,
    "date_début" AS date_debut,
    date_fin,
    motif
  FROM service_conducteurs.assignments
`;

const mapRowToAssignment = (row) => ({
  id: row.id,
  driverId: row.driver_id,
  vehicleId: row.vehicle_id,
  dateDebut: row.date_debut,
  dateFin: row.date_fin,
  motif: row.motif,
});

const findByDriverId = async (driverId, { activeOnly = false } = {}) => {
  const activeClause = activeOnly ? ' AND date_fin IS NULL' : '';
  const { rows } = await pool.query(
    `${baseSelect} WHERE driver_id = $1::uuid${activeClause} ORDER BY "date_début" DESC`,
    [driverId],
  );
  return rows.map(mapRowToAssignment);
};

const findById = async (id) => {
  const { rows } = await pool.query(`${baseSelect} WHERE id = $1::uuid`, [id]);
  if (rows.length === 0) {
    return null;
  }

  return mapRowToAssignment(rows[0]);
};

const findActiveByDriverId = async (driverId) => {
  const { rows } = await pool.query(
    `${baseSelect} WHERE driver_id = $1::uuid AND date_fin IS NULL ORDER BY "date_début" DESC LIMIT 1`,
    [driverId],
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToAssignment(rows[0]);
};

const findActiveByVehicleId = async (vehicleId) => {
  const { rows } = await pool.query(
    `${baseSelect} WHERE vehicle_id = $1::uuid AND date_fin IS NULL ORDER BY "date_début" DESC LIMIT 1`,
    [vehicleId],
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToAssignment(rows[0]);
};

const create = async (assignment) => {
  const query = `
    INSERT INTO service_conducteurs.assignments (
      id,
      driver_id,
      vehicle_id,
      "date_début",
      date_fin,
      motif
    ) VALUES (
      $1::uuid,
      $2::uuid,
      $3::uuid,
      $4::timestamptz,
      $5::timestamptz,
      $6
    )
    RETURNING
      id::text AS id,
      driver_id::text AS driver_id,
      vehicle_id::text AS vehicle_id,
      "date_début" AS date_debut,
      date_fin,
      motif
  `;

  const values = [
    assignment.id,
    assignment.driverId,
    assignment.vehicleId,
    assignment.dateDebut,
    assignment.dateFin,
    assignment.motif,
  ];

  const { rows } = await pool.query(query, values);
  return mapRowToAssignment(rows[0]);
};

const close = async (id, dateFin) => {
  const query = `
    UPDATE service_conducteurs.assignments
    SET date_fin = $2::timestamptz
    WHERE id = $1::uuid
      AND date_fin IS NULL
    RETURNING
      id::text AS id,
      driver_id::text AS driver_id,
      vehicle_id::text AS vehicle_id,
      "date_début" AS date_debut,
      date_fin,
      motif
  `;

  const { rows } = await pool.query(query, [id, dateFin]);
  if (rows.length === 0) {
    return null;
  }

  return mapRowToAssignment(rows[0]);
};

module.exports = {
  findByDriverId,
  findById,
  findActiveByDriverId,
  findActiveByVehicleId,
  create,
  close,
};
