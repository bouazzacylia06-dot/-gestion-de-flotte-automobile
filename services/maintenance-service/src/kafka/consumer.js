const { Kafka } = require('kafkajs');
const maintenanceRepository = require('../repositories/maintenanceRepository');

const kafka = new Kafka({
  clientId: 'maintenance-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9094'],
  retry: { retries: 5 },
});

const consumer = kafka.consumer({ groupId: 'maintenance-saga-group' });

/**
 * Écoute les événements vehicule-events pour le saga pattern.
 * Si le vehicule-service échoue à mettre à jour le statut du véhicule,
 * il publie VEHICLE_UPDATE_FAILED → on compense en supprimant la maintenance (rollback).
 */
const start = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'vehicule-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        if (event.eventType === 'VEHICLE_UPDATE_FAILED') {
          console.log(`[Kafka Saga] Compensation reçue pour maintenance ${event.maintenanceId} — rollback`);
          // Compensation : supprimer la maintenance créée dont la mise à jour véhicule a échoué
          await maintenanceRepository.remove(event.maintenanceId);
          console.log(`[Kafka Saga] Maintenance ${event.maintenanceId} supprimée (rollback saga)`);
        }
      } catch (err) {
        console.error('[Kafka Consumer] Erreur traitement message:', err.message);
      }
    },
  });

  console.log('[Kafka Consumer] maintenance-service écoute vehicule-events');
};

const disconnect = async () => {
  await consumer.disconnect();
};

module.exports = { start, disconnect };
