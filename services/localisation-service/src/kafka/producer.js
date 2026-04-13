// =============================================================================
// kafka/producer.js — Producteur Kafka pour les alertes de géofencing
//
// Topic   : "geo-alerts"
// Format  : JSON avec schéma défini ci-dessous
// Retry   : 3 tentatives avec backoff exponentiel (500 ms → 1 s → 2 s)
// =============================================================================

const { Kafka, CompressionTypes } = require('kafkajs');

const GEO_ALERTS_TOPIC = process.env.KAFKA_GEO_ALERTS_TOPIC || 'geo-alerts';
const MAX_RETRIES      = 3;
const INITIAL_RETRY_MS = 500; // backoff : 500 ms, 1 000 ms, 2 000 ms

let producer  = null;
let connected = false;

// ─── Connexion ────────────────────────────────────────────────────────────────

/**
 * Initialise et connecte le producteur Kafka.
 * À appeler une seule fois au démarrage du service.
 */
async function connect() {
  const kafka = new Kafka({
    clientId: 'localisation-service-producer',
    brokers:  (process.env.KAFKA_BROKER || 'localhost:9092').split(','),
    retry: {
      retries:          5,
      initialRetryTime: 300,
      factor:           2,
    },
  });

  producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout:     30000,
  });

  await producer.connect();
  connected = true;

  console.log(JSON.stringify({
    level: 'INFO', service: 'localisation-service',
    message: '[Kafka Producer] Connecté au broker',
    topic: GEO_ALERTS_TOPIC,
  }));
}

// ─── Publication ──────────────────────────────────────────────────────────────

/**
 * Publie une alerte géofencing sur le topic "geo-alerts".
 * Utilise un backoff exponentiel en cas d'échec (3 tentatives max).
 *
 * Schéma de l'alerte (JSON) :
 * {
 *   vehicleId  : string  — UUID du véhicule
 *   type       : "ZONE_ENTRY" | "ZONE_EXIT"
 *   zoneId     : string  — UUID de la zone
 *   zoneName   : string  — nom lisible de la zone
 *   zoneType   : "AUTHORIZED" | "FORBIDDEN"
 *   position   : { latitude: number, longitude: number }
 *   timestamp  : number  — epoch ms de la trame GPS déclenchante
 *   publishedAt: number  — epoch ms de la publication Kafka
 * }
 *
 * @param {Object} alert - objet alerte conforme au schéma ci-dessus
 */
async function publishGeoAlert(alert) {
  if (!connected || !producer) {
    console.warn(JSON.stringify({
      level:     'WARN', service: 'localisation-service',
      message:   '[Kafka Producer] Non connecté — alerte non publiée',
      vehicleId: alert.vehicleId,
      type:      alert.type,
    }));
    return;
  }

  const message = {
    key:   alert.vehicleId,                            // partitionnement par véhicule
    value: JSON.stringify({ ...alert, publishedAt: Date.now() }),
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await producer.send({
        topic:       GEO_ALERTS_TOPIC,
        messages:    [message],
        compression: CompressionTypes.GZIP,
      });

      console.log(JSON.stringify({
        level:     'INFO', service: 'localisation-service',
        message:   '[Kafka Producer] Alerte géofencing publiée',
        type:      alert.type,
        vehicleId: alert.vehicleId,
        zoneId:    alert.zoneId,
        zoneName:  alert.zoneName,
      }));

      return; // succès → sortie de boucle

    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error(JSON.stringify({
          level:     'ERROR', service: 'localisation-service',
          message:   `[Kafka Producer] Échec après ${MAX_RETRIES} tentatives`,
          error:     err.message,
          vehicleId: alert.vehicleId,
        }));
        throw err; // propage l'erreur après la dernière tentative
      }

      // Backoff exponentiel : 500 ms, 1 000 ms, 2 000 ms
      const delay = INITIAL_RETRY_MS * Math.pow(2, attempt - 1);
      console.warn(JSON.stringify({
        level:   'WARN', service: 'localisation-service',
        message: `[Kafka Producer] Tentative ${attempt}/${MAX_RETRIES} échouée — retry dans ${delay} ms`,
        error:   err.message,
      }));
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ─── Déconnexion ──────────────────────────────────────────────────────────────

async function disconnect() {
  if (producer && connected) {
    await producer.disconnect();
    connected = false;
    console.log(JSON.stringify({
      level: 'INFO', service: 'localisation-service',
      message: '[Kafka Producer] Déconnecté',
    }));
  }
}

module.exports = { connect, publishGeoAlert, disconnect };
