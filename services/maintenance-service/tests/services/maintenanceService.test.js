const maintenanceService = require('../../src/services/maintenanceService');
jest.mock('../../src/repositories/maintenanceRepository');
jest.mock('crypto');

const maintenanceRepository = require('../../src/repositories/maintenanceRepository');
const { randomUUID } = require('crypto');

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_UUID_2 = '223e4567-e89b-12d3-a456-426614174000';

const mockMaintenance = {
  id: VALID_UUID,
  vehicleId: 'V001',
  date: '2026-04-10',
  type: 'vidange',
  status: 'planifiee',
  cost: 150,
};

describe('maintenanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    randomUUID.mockReturnValue(VALID_UUID);
  });

  describe('listMaintenances', () => {
    it('returns list of maintenances', async () => {
      maintenanceRepository.findAll.mockResolvedValue([mockMaintenance]);

      const result = await maintenanceService.listMaintenances();

      expect(maintenanceRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockMaintenance]);
    });

    it('returns empty list when no maintenances', async () => {
      maintenanceRepository.findAll.mockResolvedValue([]);

      const result = await maintenanceService.listMaintenances();

      expect(result).toEqual([]);
    });
  });

  describe('getMaintenanceById', () => {
    it('returns maintenance by id', async () => {
      maintenanceRepository.findById.mockResolvedValue(mockMaintenance);

      const result = await maintenanceService.getMaintenanceById(VALID_UUID);

      expect(maintenanceRepository.findById).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toEqual(mockMaintenance);
    });

    it('returns null if not found', async () => {
      maintenanceRepository.findById.mockResolvedValue(null);

      const result = await maintenanceService.getMaintenanceById(VALID_UUID);

      expect(result).toBeNull();
    });
  });

  describe('createMaintenance', () => {
    const payload = {
      vehicleId: ' V001 ',
      date: '2026-04-10',
      type: ' vidange ',
      status: 'planifiee',
      cost: 150,
    };

    it('creates with auto-generated UUID', async () => {
      maintenanceRepository.exists.mockResolvedValue(false);
      maintenanceRepository.create.mockResolvedValue(mockMaintenance);

      const result = await maintenanceService.createMaintenance(payload);

      expect(randomUUID).toHaveBeenCalled();
      expect(maintenanceRepository.exists).toHaveBeenCalledWith(VALID_UUID);
      expect(maintenanceRepository.create).toHaveBeenCalledWith({
        id: VALID_UUID,
        vehicleId: 'V001',
        date: '2026-04-10',
        type: 'vidange',
        status: 'planifiee',
        cost: 150,
      });
      expect(result).toEqual(mockMaintenance);
    });

    it('creates with provided UUID', async () => {
      const payloadWithId = { ...payload, id: VALID_UUID_2 };
      maintenanceRepository.exists.mockResolvedValue(false);
      maintenanceRepository.create.mockResolvedValue({ ...mockMaintenance, id: VALID_UUID_2 });

      const result = await maintenanceService.createMaintenance(payloadWithId);

      expect(randomUUID).not.toHaveBeenCalled();
      expect(result.id).toBe(VALID_UUID_2);
    });

    it('throws 400 for invalid provided id', async () => {
      const payloadWithInvalidId = { ...payload, id: 'invalid-id' };

      await expect(maintenanceService.createMaintenance(payloadWithInvalidId))
        .rejects.toMatchObject({ message: 'Maintenance id must be a valid UUID', status: 400 });

      expect(maintenanceRepository.exists).not.toHaveBeenCalled();
    });

    it('throws 409 if id already exists', async () => {
      maintenanceRepository.exists.mockResolvedValue(true);

      await expect(maintenanceService.createMaintenance({ ...payload, id: VALID_UUID }))
        .rejects.toMatchObject({ message: 'Maintenance id already exists', status: 409 });
    });

    it('trims vehicleId and type', async () => {
      maintenanceRepository.exists.mockResolvedValue(false);
      maintenanceRepository.create.mockImplementation(async (m) => m);

      const result = await maintenanceService.createMaintenance(payload);

      expect(result.vehicleId).toBe('V001');
      expect(result.type).toBe('vidange');
    });
  });

  describe('updateMaintenance', () => {
    const payload = {
      vehicleId: 'V001',
      date: '2026-04-11',
      type: 'revision',
      status: 'terminee',
      cost: 200,
    };

    it('updates existing maintenance', async () => {
      maintenanceRepository.exists.mockResolvedValue(true);
      maintenanceRepository.update.mockResolvedValue({ id: VALID_UUID, ...payload });

      const result = await maintenanceService.updateMaintenance(VALID_UUID, payload);

      expect(maintenanceRepository.exists).toHaveBeenCalledWith(VALID_UUID);
      expect(maintenanceRepository.update).toHaveBeenCalledWith(VALID_UUID, {
        id: VALID_UUID,
        vehicleId: 'V001',
        date: '2026-04-11',
        type: 'revision',
        status: 'terminee',
        cost: 200,
      });
      expect(result).toEqual({ id: VALID_UUID, ...payload });
    });

    it('returns null if maintenance does not exist', async () => {
      maintenanceRepository.exists.mockResolvedValue(false);

      const result = await maintenanceService.updateMaintenance(VALID_UUID, payload);

      expect(result).toBeNull();
      expect(maintenanceRepository.update).not.toHaveBeenCalled();
    });

    it('throws 400 for invalid id', async () => {
      await expect(maintenanceService.updateMaintenance('not-a-uuid', payload))
        .rejects.toMatchObject({ message: 'Maintenance id must be a valid UUID', status: 400 });
    });
  });

  describe('deleteMaintenance', () => {
    it('deletes existing maintenance', async () => {
      maintenanceRepository.remove.mockResolvedValue(true);

      const result = await maintenanceService.deleteMaintenance(VALID_UUID);

      expect(maintenanceRepository.remove).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toBe(true);
    });

    it('returns false if maintenance does not exist', async () => {
      maintenanceRepository.remove.mockResolvedValue(false);

      const result = await maintenanceService.deleteMaintenance(VALID_UUID);

      expect(result).toBe(false);
    });

    it('throws 400 for invalid id', async () => {
      await expect(maintenanceService.deleteMaintenance('bad-id'))
        .rejects.toMatchObject({ message: 'Maintenance id must be a valid UUID', status: 400 });
    });
  });
});
