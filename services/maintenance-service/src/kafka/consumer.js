const kafka = require('./client');
const logger = require('../observability/logger');

const topic = process.env.KAFKA_TOPIC_VEHICULES || 'vehicules';
const groupId = 'maintenance-service-group';

const consumer = kafka.consumer({ groupId });

const startMaintenanceConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        
        if (['vehicule.cree', 'vehicule.modifie'].includes(event.eventType)) {
          const vehicule = event.payload;
          
          if (vehicule.statut === 'EN_MAINTENANCE') {
            logger.info({
              eventId: event.eventId,
              vehicleId: vehicule.id,
              trace_id: 'kafka-' + event.eventId,
            }, 'Véhicule entré en maintenance détecté via Kafka');
          }
        }
      } catch (error) {
        logger.error({
          eventId: message?.key?.toString(),
          error: error.message,
        }, 'Erreur parsing message Kafka vehicules');
        // Ne pas crasher sur message malformé
      }
    },
  });
};

const disconnectConsumer = async () => {
  await consumer.disconnect();
};

module.exports = {
  startMaintenanceConsumer,
  disconnectConsumer,
};
