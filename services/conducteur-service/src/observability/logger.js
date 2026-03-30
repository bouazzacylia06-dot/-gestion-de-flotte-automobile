/**
 * Structured Logger avec corrélation OpenTelemetry
 *
 * Pino: logger JSON performant pour Node.js
 * Chaque log inclut automatiquement:
 * - trace_id: identifiant unique de la requête (corrélation)
 * - span_id: identifiant du segment actuel
 * - service_name: nom du service
 *
 * Utilisation:
 *   const logger = require('./observability/logger');
 *   logger.info({ userId: 123 }, 'Création de véhicule');
 */

const pino = require('pino');
const pinoHttp = require('pino-http');
const { trace, context } = require('@opentelemetry/api');

const serviceName = process.env.OTEL_SERVICE_NAME || 'conducteur-service';
const environment = process.env.NODE_ENV || 'development';

// Configuration Pino pour logs JSON structurés
const pinoConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport: environment === 'development'
    ? {
      // En développement: output lisible avec couleurs
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    }
    : undefined, // En production: JSON brut pour la collecte
  serializers: {
    // Personnalisation des sérialiseurs (comment les objets se transforment en JSON)
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

// Logger racine Pino
const logger = pino(pinoConfig);

/**
 * Middleware Express pour l'instrumentation HTTP + correlation
 * 
 * Ajoute automatiquement:
 * - Logs d'entrée/sortie HTTP avec times
 * - trace_id et span_id dans chaque log
 * - Intégration avec OpenTelemetry
 */
const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'info';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, req, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} ${err?.message || ''}`;
  },
}, {
  // Fusionner les logs HTTP avec les filtres de contexte
  wrapSerializers: true,
});

/**
 * Enrichissement automatique des logs avec trace_id/span_id
 * 
 * Cette fonction intercepte chaque log pour:
 * 1. Récupérer la span active (OpenTelemetry)
 * 2. Extraire trace_id et span_id
 * 3. Les ajouter au log avant sérialisation
 */
const childLoggerWithTrace = (baseLogger) => {
    return baseLogger.child({
        get trace_id() {
            try {
                const span = trace.getActiveSpan();
                return span?.spanContext().traceId || 'no-trace';
            } catch {
                return 'no-trace';  
            }
        },
        get span_id() {
            try {
                const span = trace.getActiveSpan();
                return span?.spanContext().spanId || 'no-span';
            } catch {
                return 'no-span';
            }
        },
    });
};

// Instance exportée pour utilisation dans les routes
const loggerWithTrace = childLoggerWithTrace(logger);

module.exports = loggerWithTrace;
module.exports.httpLogger = httpLogger;
module.exports.childLogger = (fields) => childLoggerWithTrace(logger.child(fields));