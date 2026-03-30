const { randomUUID } = require('crypto');
const kafka = require('./client');

const topic = process.env.KAFKA_TOPIC_CONDUCTEURS || 'conducteurs';

const producer = kafka.producer();
let isConnected = false;

const ensureProducerConnected = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
};

const publishConducteurEvent = async ({ eventType, conducteur }) => {
  await ensureProducerConnected();

  const event = {
    eventId: randomUUID(),
    eventType,
    entity: 'conducteur',
    occurredAt: new Date().toISOString(),
    payload: conducteur,
  };

  await producer.send({
    topic,
    messages: [
      {
        key: conducteur.id,
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
  publishConducteurEvent,
  disconnectProducer,
};