/**
 * Structured Logger avec corrélation OpenTelemetry
 *
 * Pino: logger JSON performant pour Node.js
 * Chaque log inclut automatiquement:
 * - trace_id, span_id, service_name
 */

const pino = require('pino');
const pinoHttp = require('pino-http');
const { trace } = require('@opentelemetry/api');

const serviceName = process.env.OTEL_SERVICE_NAME || 'maintenance-service';
const environment = process.env.NODE_ENV || 'development';

const pinoConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport: environment === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

const logger = pino(pinoConfig);

const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});

const loggerWithTrace = logger.child({
  get trace_id() {
    try {
      return trace.getActiveSpan()?.spanContext().traceId || 'no-trace';
    } catch {
      return 'no-trace';
    }
  },
  get span_id() {
    try {
      return trace.getActiveSpan()?.spanContext().spanId || 'no-span';
    } catch {
      return 'no-span';
    }
  },
  service_name: serviceName,
});

module.exports = loggerWithTrace;
module.exports.httpLogger = httpLogger;
