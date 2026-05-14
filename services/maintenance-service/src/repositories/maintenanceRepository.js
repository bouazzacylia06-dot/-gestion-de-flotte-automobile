const SEED_MAINTENANCES = [
  { id: 'm1000000-0000-4000-b000-000000000001', vehicleId: '11000000-0000-4000-a000-000000000001', date: '2026-01-15T09:00:00.000Z', type: 'vidange',  status: 'terminee',  cost: 120 },
  { id: 'm1000000-0000-4000-b000-000000000002', vehicleId: '11000000-0000-4000-a000-000000000002', date: '2026-02-03T10:30:00.000Z', type: 'revision', status: 'terminee',  cost: 450 },
  { id: 'm1000000-0000-4000-b000-000000000003', vehicleId: '11000000-0000-4000-a000-000000000003', date: '2026-02-20T08:00:00.000Z', type: 'pneus',    status: 'terminee',  cost: 320 },
  { id: 'm1000000-0000-4000-b000-000000000004', vehicleId: '11000000-0000-4000-a000-000000000004', date: '2026-03-05T14:00:00.000Z', type: 'freins',   status: 'en_cours',  cost: 580 },
  { id: 'm1000000-0000-4000-b000-000000000005', vehicleId: '11000000-0000-4000-a000-000000000005', date: '2026-03-18T11:00:00.000Z', type: 'autre',    status: 'planifiee', cost: 85  },
  { id: 'm1000000-0000-4000-b000-000000000006', vehicleId: '11000000-0000-4000-a000-000000000006', date: '2026-04-02T09:30:00.000Z', type: 'autre',    status: 'planifiee', cost: 180 },
  { id: 'm1000000-0000-4000-b000-000000000007', vehicleId: '11000000-0000-4000-a000-000000000007', date: '2026-04-10T13:00:00.000Z', type: 'vidange',  status: 'planifiee', cost: 110 },
  { id: 'm1000000-0000-4000-b000-000000000008', vehicleId: '11000000-0000-4000-a000-000000000008', date: '2026-04-22T08:00:00.000Z', type: 'revision', status: 'en_cours',  cost: 520 },
  { id: 'm1000000-0000-4000-b000-000000000009', vehicleId: '11000000-0000-4000-a000-000000000009', date: '2026-05-06T10:00:00.000Z', type: 'pneus',    status: 'planifiee', cost: 295 },
  { id: 'm1000000-0000-4000-b000-000000000010', vehicleId: '11000000-0000-4000-a000-000000000010', date: '2026-05-14T15:00:00.000Z', type: 'freins',   status: 'planifiee', cost: 640 },
  { id: 'm1000000-0000-4000-b000-000000000011', vehicleId: '11000000-0000-4000-a000-000000000011', date: '2026-06-01T09:00:00.000Z', type: 'autre',    status: 'planifiee', cost: 160 },
  { id: 'm1000000-0000-4000-b000-000000000012', vehicleId: '11000000-0000-4000-a000-000000000012', date: '2026-06-20T11:00:00.000Z', type: 'pneus',    status: 'planifiee', cost: 95  },
];

const items = new Map(SEED_MAINTENANCES.map((m) => [m.id, m]));

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
