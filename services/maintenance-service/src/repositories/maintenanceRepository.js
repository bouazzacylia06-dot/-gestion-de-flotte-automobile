const items = new Map();

const findAll = async () => Array.from(items.values());

const findById = async (id) => items.get(id) || null;

const exists = async (id) => items.has(id);

const create = async (maintenance) => {
  items.set(maintenance.id, maintenance);
  return maintenance;
};

const update = async (id, maintenance) => {
  items.set(id, maintenance);
  return maintenance;
};

const remove = async (id) => {
  const existed = items.has(id);
  items.delete(id);
  return existed;
};

module.exports = { findAll, findById, exists, create, update, remove };
