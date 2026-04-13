'use strict';
// =============================================================================
// kafka/geoAlertsConsumer.js — Consumer des alertes géofencing
//
// Écoute le topic "geo-alerts" publié par le localisation-service.
// Cas d'usage :
//   - ZONE_EXIT d'une zone AUTHORIZED → log d'alerte (véhicule hors périmètre)
//   - ZONE_ENTRY dans une zone FORBIDDEN → log d'alerte critique
// Le consumer est non bloquant : une erreur de traitement ne crashe pas le service.
// =============================================================================

const { Kafka } = require('kafkajs');

const GEO_ALERTS_TOPIC = process.env.KAFKA_GEO_ALERTS_TOPIC || 'geo-alerts';

async function startGeoAlertsConsumer() {
  const kafka = new Kafka({
    clientId: 'maintenance-service-geo-alerts',
    brokers:  [(process.env.KAFKA_BROKER || 'localhost:9094')],
    retry: { retries: 5, initialRetryTime: 300, factor: 2 },
  });

  const consumer = kafka.consumer({ groupId: 'maintenance-geo-alerts' });

  await consumer.connect();
  await consumer.subscribe({ topic: GEO_ALERTS_TOPIC, fromBeginning: false });

  console.log(`[Maintenance] Consumer geo-alerts connecté — topic: ${GEO_ALERTS_TOPIC}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const alert = JSON.parse(message.value.toString());

        const isCritical =
          (alert.type === 'ZONE_EXIT'  && alert.zoneType === 'AUTHORIZED') ||
          (alert.type === 'ZONE_ENTRY' && alert.zoneType === 'FORBIDDEN');

        const level = isCritical ? 'WARN' : 'INFO';
        console.log(JSON.stringify({
          level,
          service:   'maintenance-service',
          message:   `[GeoAlert] ${alert.type} — véhicule ${alert.vehicleId} — zone ${alert.zoneName} (${alert.zoneType})`,
          vehicleId: alert.vehicleId,
          zoneId:    alert.zoneId,
          type:      alert.type,
          position:  alert.position,
          timestamp: alert.timestamp,
        }));

        // Exemple d'extension : créer une intervention préventive si sortie de zone autorisée
        // if (alert.type === 'ZONE_EXIT' && alert.zoneType === 'AUTHORIZED') {
        //   await maintenanceRepository.createPreventiveAlert(alert);
        // }

      } catch (err) {
        console.error(JSON.stringify({
          level:   'ERROR',
          service: 'maintenance-service',
          message: '[GeoAlert] Erreur traitement alerte géofencing',
          error:   err.message,
        }));
        // Non bloquant : on continue à consommer les messages suivants
      }
    },
  });

  return consumer;
}

module.exports = { startGeoAlertsConsumer };
