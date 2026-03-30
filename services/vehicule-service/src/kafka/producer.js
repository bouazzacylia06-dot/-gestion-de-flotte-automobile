const { randomUUID } = require('crypto');
const kafka = require('./client');

const topic = process.env.KAFKA_TOPIC_VEHICULES || 'vehicules';

const producer = kafka.producer();
let isConnected = false;

const ensureProducerConnected = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
};

const publishVehicleEvent = async ({ eventType, vehicle }) => {
  await ensureProducerConnected();

  const event = {
    eventId: randomUUID(),
    eventType,
    entity: 'vehicule',
    occurredAt: new Date().toISOString(),
    payload: vehicle,
  };

  await producer.send({
    topic,
    messages: [
      {
        key: vehicle.id,
        value: JSON.stringify(event),
      },
    ],
  });
};

const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
  }
};

module.exports = {
  publishVehicleEvent,
  disconnectProducer,
};