const { randomUUID } = require('crypto');
const kafka = require('./client');

const topic = process.env.KAFKA_TOPIC_MAINTENANCES || 'maintenances';

const producer = kafka.producer();
let isConnected = false;

const ensureProducerConnected = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
};

const publishMaintenanceEvent = async ({ eventType, maintenance }) => {
  await ensureProducerConnected();

  const event = {
    eventId: randomUUID(),
    eventType, // maintenance.planifie, maintenance.modifie, maintenance.supprimee, maintenance.demarree, maintenance.cloturee
    entity: 'maintenance',
    occurredAt: new Date().toISOString(),
    payload: maintenance,
  };

  await producer.send({
    topic,
    messages: [{
      key: maintenance.id,
      value: JSON.stringify(event),
    }],
  });
};

const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
  }
};

module.exports = {
  publishMaintenanceEvent,
  disconnectProducer,
};
