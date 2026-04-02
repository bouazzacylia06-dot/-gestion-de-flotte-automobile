const { Kafka, logLevel } = require('kafkajs');

const parseBrokers = () => {
  const raw = process.env.KAFKA_BROKERS || 'localhost:9092';
  return raw
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
};

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'maintenance-service',
  brokers: parseBrokers(),
  logLevel: logLevel.NOTHING,
});

module.exports = kafka;
