const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'vehicule-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9094'],
  retry: { retries: 5 },
});

const producer = kafka.producer();
let connected = false;

const connect = async () => {
  await producer.connect();
  connected = true;
  console.log('[Kafka Producer] vehicule-service connecté');
};

/**
 * Publie un événement sur le topic vehicule-events
 * @param {'VEHICLE_STATUS_UPDATED'|'VEHICLE_UPDATE_FAILED'} eventType
 * @param {object} payload
 */
const publishVehiculeEvent = async (eventType, payload) => {
  if (!connected) return;
  const message = { eventType, ...payload, timestamp: new Date().toISOString() };
  await producer.send({
    topic: 'vehicule-events',
    messages: [{ key: payload.vehicleId, value: JSON.stringify(message) }],
  });
  console.log(`[Kafka Producer] Événement publié : ${eventType} pour véhicule ${payload.vehicleId}`);
};

const disconnect = async () => {
  if (connected) await producer.disconnect();
};

module.exports = { connect, publishVehiculeEvent, disconnect };
