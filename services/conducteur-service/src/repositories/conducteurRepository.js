const pool = require('../config/db');

const baseSelect = `
  SELECT
    id::text AS id,
    keycloak_id,
    "numéro_permis" AS numero_permis,
    nom,
    "prénom" AS prenom,
    email,
    "téléphone" AS telephone,
    statut_permis,
    categorie_permis
  FROM service_conducteurs.drivers
`;

const mapRowToConducteur = (row) => ({
  id: row.id,
  keycloakId: row.keycloak_id,
  numeroPermis: row.numero_permis,
  nom: row.nom,
  prenom: row.prenom,
  email: row.email,
  telephone: row.telephone,
  statutPermis: row.statut_permis,
  categoriePermis: row.categorie_permis,
});

const mapConducteurToDb = (conducteur) => ({
  id: conducteur.id,
  keycloak_id: conducteur.keycloakId,
  numero_permis: conducteur.numeroPermis,
  nom: conducteur.nom,
  prenom: conducteur.prenom,
  email: conducteur.email,
  telephone: conducteur.telephone,
  statut_permis: conducteur.statutPermis,
  categorie_permis: conducteur.categoriePermis,
});

const findAll = async () => {
  const { rows } = await pool.query(`${baseSelect} ORDER BY created_at DESC`);
  return rows.map(mapRowToConducteur);
};

const findById = async (id) => {
  const { rows } = await pool.query(`${baseSelect} WHERE id = $1::uuid`, [id]);
  if (rows.length === 0) {
    return null;
  }
  
  return mapRowToConducteur(rows[0]);
};

const exists = async (id) => {
  const { rows } = await pool.query('SELECT 1 FROM service_conducteurs.drivers WHERE id = $1::uuid LIMIT 1', [id]);
  return rows.length > 0;
};

const findByTelephone = async (telephone) => {
  const { rows } = await pool.query(`${baseSelect} WHERE "téléphone" = $1 LIMIT 1`, [telephone]);
  if (rows.length === 0) {
    return null;
  }

  return mapRowToConducteur(rows[0]);
};

const create = async (conducteur) => {
  const dbConducteur = mapConducteurToDb(conducteur);

  try {
    const query = `
      INSERT INTO service_conducteurs.drivers (
        id,
        keycloak_id,
        "numéro_permis",
        nom,
        "prénom",
        email,
        "téléphone",
        statut_permis,
        categorie_permis
      ) VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::boolean,
        $9
      )
      RETURNING
        id::text AS id,
        keycloak_id,
        "numéro_permis" AS numero_permis,
        nom,
        "prénom" AS prenom,
        email,
        "téléphone" AS telephone,
        statut_permis,
        categorie_permis
    `;

    const values = [
      dbConducteur.id,
      dbConducteur.keycloak_id,
      dbConducteur.numero_permis,
      dbConducteur.nom,
      dbConducteur.prenom,
      dbConducteur.email,
      dbConducteur.telephone,
      dbConducteur.statut_permis,
      dbConducteur.categorie_permis,
    ];

    const { rows } = await pool.query(query, values);
    return mapRowToConducteur(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint === 'uk_drivers_keycloak_id') {
        const conflictError = new Error('Driver keycloakId already exists');
        conflictError.status = 409;
        throw conflictError;
      }

      if (error.constraint === 'uk_drivers_numero_permis') {
        const conflictError = new Error('Driver numeroPermis already exists');
        conflictError.status = 409;
        throw conflictError;
      }

      if (error.constraint === 'uk_drivers_telephone') {
        const conflictError = new Error('Driver telephone already exists');
        conflictError.status = 409;
        throw conflictError;
      }
    }

    throw error;
  }
};

const update = async (id, conducteur) => {
  const dbConducteur = mapConducteurToDb(conducteur);

  try {
    const query = `
      UPDATE service_conducteurs.drivers
      SET
        keycloak_id = $2,
        "numéro_permis" = $3,
        nom = $4,
        "prénom" = $5,
        email = $6,
        "téléphone" = $7,
        statut_permis = $8::boolean,
        categorie_permis = $9
      WHERE id = $1::uuid
      RETURNING
        id::text AS id,
        keycloak_id,
        "numéro_permis" AS numero_permis,
        nom,
        "prénom" AS prenom,
        email,
        "téléphone" AS telephone,
        statut_permis,
        categorie_permis
    `;

    const values = [
      id,
      dbConducteur.keycloak_id,
      dbConducteur.numero_permis,
      dbConducteur.nom,
      dbConducteur.prenom,
      dbConducteur.email,
      dbConducteur.telephone,
      dbConducteur.statut_permis,
      dbConducteur.categorie_permis,
    ];

    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return null;
    }

    return mapRowToConducteur(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint === 'uk_drivers_keycloak_id') {
        const conflictError = new Error('Driver keycloakId already exists');
        conflictError.status = 409;
        throw conflictError;
      }

      if (error.constraint === 'uk_drivers_numero_permis') {
        const conflictError = new Error('Driver numeroPermis already exists');
        conflictError.status = 409;
        throw conflictError;
      }

      if (error.constraint === 'uk_drivers_telephone') {
        const conflictError = new Error('Driver telephone already exists');
        conflictError.status = 409;
        throw conflictError;
      }
    }

    throw error;
  }
};

const remove = async (id) => {
  const query = 'DELETE FROM service_conducteurs.drivers WHERE id = $1::uuid';
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
};

module.exports = {
  findAll,
  findById,
  exists,
  findByTelephone,
  create,
  update,
  remove,
};
