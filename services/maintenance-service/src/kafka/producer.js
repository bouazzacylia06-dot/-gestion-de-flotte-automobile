const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'maintenance-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9094'],
  retry: { retries: 5 },
});

const producer = kafka.producer();
let connected = false;

const connect = async () => {
  await producer.connect();
  connected = true;
  console.log('[Kafka Producer] maintenance-service connecté');
};

/**
 * Publie un événement sur le topic maintenance-events
 * @param {'MAINTENANCE_CREATED'|'MAINTENANCE_COMPLETED'|'MAINTENANCE_CANCELLED'} eventType
 * @param {object} maintenance
 */
const publishMaintenanceEvent = async (eventType, maintenance) => {
  if (!connected) return;
  const message = {
    eventType,
    maintenanceId: maintenance.id,
    vehicleId: maintenance.vehicleId,
    type: maintenance.type,
    status: maintenance.status,
    timestamp: new Date().toISOString(),
  };
  await producer.send({
    topic: 'maintenance-events',
    messages: [{ key: maintenance.id, value: JSON.stringify(message) }],
  });
  console.log(`[Kafka Producer] Événement publié : ${eventType} pour véhicule ${maintenance.vehicleId}`);
};

const disconnect = async () => {
  if (connected) await producer.disconnect();
};

module.exports = { connect, publishMaintenanceEvent, disconnect };
