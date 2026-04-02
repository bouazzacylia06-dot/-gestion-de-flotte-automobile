const maintenanceService = require('../../src/services/maintenanceService');

jest.mock('../../src/repositories/maintenanceRepository');
jest.mock('../../src/kafka/producer');

const maintenanceRepository = require('../../src/repositories/maintenanceRepository');
const { publishMaintenanceEvent } = require('../../src/kafka/producer');

describe('maintenanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMaintenance', () => {
    it('should create maintenance successfully', async () => {
      const mockMaintenance = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        vehicleId: '456e7890-e89b-12d3-a456-426614174000',
        typeMaintenance: 'PREVENTIVE',
        dateDebut: '2024-01-01T10:00:00Z',
      };

      maintenanceRepository.exists.mockResolvedValue(false);
      maintenanceRepository.create.mockResolvedValue(mockMaintenance);
      publishMaintenanceEvent.mockResolvedValue();

      const payload = { vehicleId: mockMaintenance.vehicleId, typeMaintenance: 'PREVENTIVE', dateDebut: '2024-01-01T10:00:00Z' };
      const result = await maintenanceService.createMaintenance(payload);

      expect(result).toEqual(mockMaintenance);
      expect(maintenanceRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        vehicleId: payload.vehicleId,
        typeMaintenance: payload.typeMaintenance,
      }));
      expect(publishMaintenanceEvent).toHaveBeenCalledWith({
        eventType: 'maintenance.planifie',
        maintenance: mockMaintenance,
      });
    });

    it('should throw 400 if invalid UUID provided', async () => {
      const payload = { id: 'invalid-uuid', vehicleId: 'valid-uuid', typeMaintenance: 'PREVENTIVE', dateDebut: '2024-01-01T10:00:00Z' };

      await expect(maintenanceService.createMaintenance(payload)).rejects.toThrow('Maintenance id must be a valid UUID');
      expect(maintenanceRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getMaintenanceById', () => {
    it('should return null if not found', async () => {
      maintenanceRepository.findById.mockResolvedValue(null);
      
      const result = await maintenanceService.getMaintenanceById('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBeNull();
    });

    it('should throw 400 if invalid UUID', async () => {
      await expect(maintenanceService.getMaintenanceById('invalid')).rejects.toThrow('Maintenance id must be a valid UUID');
    });
  });

  describe('updateMaintenance', () => {
    it('should return null if not found', async () => {
      maintenanceRepository.exists.mockResolvedValue(false);
      
      const result = await maintenanceService.updateMaintenance('123e4567-e89b-12d3-a456-426614174000', {});
      expect(result).toBeNull();
    });
  });

  describe('deleteMaintenance', () => {
    it('should return false if not found', async () => {
      maintenanceRepository.findById.mockResolvedValue(null);
      
      const result = await maintenanceService.deleteMaintenance('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBe(false);
    });
  });

  describe('startMaintenance', () => {
    it('should start PLANNED maintenance', async () => {
      const mockMaintenance = { id: '123', statut: 'PLANIFIÉ', dateDebut: null };
      maintenanceRepository.findById.mockResolvedValue(mockMaintenance);
      maintenanceRepository.updateStatus.mockResolvedValue({ ...mockMaintenance, statut: 'EN_COURS' });

      const result = await maintenanceService.startMaintenance('123');
      
      expect(result.statut).toBe('EN_COURS');
      expect(maintenanceRepository.updateStatus).toHaveBeenCalledWith('123', { statut: 'EN_COURS', dateFin: null });
    });

    it('should throw 409 if already started', async () => {
      maintenanceRepository.findById.mockResolvedValue({ id: '123', statut: 'EN_COURS' });

      await expect(maintenanceService.startMaintenance('123')).rejects.toThrow('invalid status');
    });
  });

  describe('completeMaintenance', () => {
    it('should complete IN_COURS maintenance', async () => {
      const mockMaintenance = { 
        id: '123', 
        statut: 'EN_COURS', 
        dateDebut: '2024-01-01T10:00:00Z',
        cout: 1000 
      };
      maintenanceRepository.findById.mockResolvedValue(mockMaintenance);
      maintenanceRepository.updateStatus.mockResolvedValue({ 
        ...mockMaintenance, 
        statut: 'TERMINÉ',
        dateFin: expect.any(String),
        cout: 1200 
      });

      const result = await maintenanceService.completeMaintenance('123', { cout: 1200 });

      expect(result.statut).toBe('TERMINÉ');
      expect(new Date(result.dateFin)).toBeGreaterThan(new Date(mockMaintenance.dateDebut));
    });

    it('should throw 409 if already TERMINÉ', async () => {
      maintenanceRepository.findById.mockResolvedValue({ id: '123', statut: 'TERMINÉ' });

      await expect(maintenanceService.completeMaintenance('123')).rejects.toThrow('already closed');
    });

    it('should throw 400 if dateFin before dateDebut', async () => {
      maintenanceRepository.findById.mockResolvedValue({ 
        id: '123', 
        dateDebut: '2024-01-02T10:00:00Z',
        statut: 'EN_COURS' 
      });

      await expect(maintenanceService.completeMaintenance('123', { dateFin: '2024-01-01T10:00:00Z' }))
        .rejects.toThrow('dateFin must be after dateDebut');
    });
  });
});
