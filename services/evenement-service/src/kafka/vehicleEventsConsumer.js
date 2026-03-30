const kafka = require('./client');

const topic = process.env.KAFKA_TOPIC_VEHICULES || 'vehicules';
const groupId = process.env.KAFKA_GROUP_ID || 'evenement-service-group';

const consumer = kafka.consumer({ groupId });
let started = false;

const startVehicleEventsConsumer = async () => {
  if (started) {
    return;
  }

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }

      try {
        const event = JSON.parse(message.value.toString());
        console.log('[Kafka] Événement reçu:', event.eventType, event.payload?.id || 'sans-id');
      } catch (error) {
        console.error('[Kafka] Message invalide:', error.message);
      }
    },
  });

  started = true;
  console.log(`[Kafka] Consumer connecté au topic métier "${topic}" (group: ${groupId})`);
};

const stopVehicleEventsConsumer = async () => {
  if (!started) {
    return;
  }

  await consumer.disconnect();
  started = false;
};

module.exports = {
  startVehicleEventsConsumer,
  stopVehicleEventsConsumer,
};