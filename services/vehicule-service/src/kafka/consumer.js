const { Kafka } = require('kafkajs');
const vehicleRepository = require('../repositories/vehicleRepository');
const kafkaProducer = require('./producer');

const kafka = new Kafka({
  clientId: 'vehicule-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9094'],
  retry: { retries: 5 },
});

const consumer = kafka.consumer({ groupId: 'vehicule-saga-group' });

/**
 * Écoute les événements maintenance-events pour le saga pattern.
 *
 * MAINTENANCE_CREATED   → passe le véhicule en statut MAINTENANCE
 * MAINTENANCE_COMPLETED → passe le véhicule en statut AVAILABLE
 * MAINTENANCE_CANCELLED → passe le véhicule en statut AVAILABLE
 *
 * Si la mise à jour du véhicule échoue → publie VEHICLE_UPDATE_FAILED
 * pour déclencher la compensation dans le maintenance-service.
 */
const start = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'maintenance-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        const { eventType, maintenanceId, vehicleId } = event;

        let targetStatus = null;

        if (eventType === 'MAINTENANCE_CREATED') {
          targetStatus = 'MAINTENANCE';
        } else if (eventType === 'MAINTENANCE_COMPLETED' || eventType === 'MAINTENANCE_CANCELLED') {
          targetStatus = 'AVAILABLE';
        }

        if (!targetStatus) return;

        console.log(`[Kafka Saga] ${eventType} reçu → véhicule ${vehicleId} → ${targetStatus}`);

        try {
          const updated = await vehicleRepository.updateStatus(vehicleId, targetStatus);

          if (!updated) {
            // Véhicule introuvable → compensation
            console.warn(`[Kafka Saga] Véhicule ${vehicleId} introuvable — compensation envoyée`);
            await kafkaProducer.publishVehiculeEvent('VEHICLE_UPDATE_FAILED', { vehicleId, maintenanceId });
          } else {
            console.log(`[Kafka Saga] Véhicule ${vehicleId} mis à jour → ${targetStatus}`);
            await kafkaProducer.publishVehiculeEvent('VEHICLE_STATUS_UPDATED', { vehicleId, maintenanceId, newStatus: targetStatus });
          }
        } catch (dbErr) {
          console.error(`[Kafka Saga] Erreur DB mise à jour véhicule ${vehicleId}:`, dbErr.message);
          await kafkaProducer.publishVehiculeEvent('VEHICLE_UPDATE_FAILED', { vehicleId, maintenanceId });
        }
      } catch (err) {
        console.error('[Kafka Consumer] Erreur traitement message:', err.message);
      }
    },
  });

  console.log('[Kafka Consumer] vehicule-service écoute maintenance-events');
};

const disconnect = async () => {
  await consumer.disconnect();
};

module.exports = { start, disconnect };
