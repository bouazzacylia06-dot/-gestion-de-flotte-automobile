const pool = require('../config/db');

const baseSelect = `
  SELECT
    id::text as id,
    vehicle_id::text as "vehicleId",
    type_maintenance as "typeMaintenance",
    description,
    "coût" as cout,
    cout_estime as "coutEstime",
    "date_début" as "dateDebut",
    date_fin as "dateFin",
    statut
  FROM service_maintenance.maintenance_records
`;

const mapRowToMaintenance = (row) => ({
  id: row.id,
  vehicleId: row.vehicleid,
  typeMaintenance: row.typemaintenance,
  description: row.description,
  cout: parseFloat(row.cout),
  coutEstime: parseFloat(row.coutestime),
  dateDebut: row.datedebut,
  dateFin: row.datefin,
  statut: row.statut,
});

const findAll = async ({ vehicleId, statut, typeMaintenance } = {}) => {
  let query = baseSelect;
  const params = [];
  let paramIndex = 1;
  const whereClauses = [];

  if (vehicleId) {
    whereClauses.push(`vehicle_id = $${paramIndex}::uuid`);
    params.push(vehicleId);
    paramIndex++;
  }

  if (statut) {
    whereClauses.push(`statut = $${paramIndex}`);
    params.push(statut);
    paramIndex++;
  }

  if (typeMaintenance) {
    whereClauses.push(`type_maintenance = $${paramIndex}`);
    params.push(typeMaintenance);
    paramIndex++;
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(mapRowToMaintenance);
};

const findById = async (id) => {
  const { rows } = await pool.query(`${baseSelect} WHERE id = $1::uuid`, [id]);
  if (rows.length === 0) return null;
  return mapRowToMaintenance(rows[0]);
};

const findByVehicleId = async (vehicleId) => {
  const { rows } = await pool.query(`${baseSelect} WHERE vehicle_id = $1::uuid ORDER BY "date_début" DESC`, [vehicleId]);
  return rows.map(mapRowToMaintenance);
};

const exists = async (id) => {
  const { rows } = await pool.query('SELECT 1 FROM service_maintenance.maintenance_records WHERE id = $1::uuid LIMIT 1', [id]);
  return rows.length > 0;
};

const create = async (maintenance) => {
  const query = `
    INSERT INTO service_maintenance.maintenance_records (
      id, vehicle_id, type_maintenance, description, "coût", 
      cout_estime, "date_début", date_fin, statut
    ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9)
    RETURNING *
  `;

  const values = [
    maintenance.id,
    maintenance.vehicleId,
    maintenance.typeMaintenance,
    maintenance.description || null,
    maintenance.cout || null,
    maintenance.coutEstime || null,
    maintenance.dateDebut,
    maintenance.dateFin || null,
    maintenance.statut || 'PLANIFIÉ'
  ];

  const { rows } = await pool.query(query, values);
  return mapRowToMaintenance(rows[0]);
};

const update = async (id, maintenance) => {
  const query = `
    UPDATE service_maintenance.maintenance_records SET 
      vehicle_id = $2::uuid, type_maintenance = $3, description = $4,
      "coût" = $5, cout_estime = $6, "date_début" = $7::timestamptz,
      date_fin = $8::timestamptz, statut = $9 
    WHERE id = $1::uuid RETURNING *
  `;

  const values = [
    id,
    maintenance.vehicleId,
    maintenance.typeMaintenance,
    maintenance.description || null,
    maintenance.cout || null,
    maintenance.coutEstime || null,
    maintenance.dateDebut,
    maintenance.dateFin || null,
    maintenance.statut || 'PLANIFIÉ'
  ];

  const { rows } = await pool.query(query, values);
  if (rows.length === 0) return null;
  return mapRowToMaintenance(rows[0]);
};

const updateStatus = async (id, { statut, dateFin, cout }) => {
  const updates = ['statut = $2'];
  const values = [id, statut];
  let i = 3;

  if (dateFin !== undefined) {
    updates.push(`date_fin = $${i}::timestamptz`);
    values.push(dateFin);
    i++;
  }

  if (cout !== undefined) {
    updates.push(`"coût" = $${i}`);
    values.push(cout);
    i++;
  }

  const query = `
    UPDATE service_maintenance.maintenance_records 
    SET ${updates.join(', ')} 
    WHERE id = $1::uuid RETURNING *
  `;

  const { rows } = await pool.query(query, values);
  if (rows.length === 0) return null;
  return mapRowToMaintenance(rows[0]);
};

const remove = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM service_maintenance.maintenance_records WHERE id = $1::uuid', 
    [id]
  );
  return rowCount > 0;
};

module.exports = {
  findAll,
  findById,
  findByVehicleId,
  exists,
  create,
  update,
  updateStatus,
  remove,
};
