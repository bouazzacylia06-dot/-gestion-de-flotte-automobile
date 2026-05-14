const { metrics } = require('@opentelemetry/api');
const maintenanceRepository = require('./repositories/maintenanceRepository');

const serviceName = process.env.OTEL_SERVICE_NAME || 'maintenance-service';
let instruments;
const kafkaConsumerLag = new Map();

function getInstruments() {
  if (instruments) {
    return instruments;
  }

  const meter = metrics.getMeter('maintenance-service-metrics', '1.0.0');
  instruments = {
    requestsTotal: meter.createCounter('flotte_http_requests_total', {
      description: 'Total HTTP requests',
    }),
    requestErrorsTotal: meter.createCounter('flotte_http_request_errors_total', {
      description: 'Total HTTP 5xx responses',
    }),
    requestDurationSeconds: meter.createHistogram('flotte_http_request_duration_seconds', {
      description: 'HTTP request duration in seconds',
      unit: 's',
    }),
    maintenanceOverdueTotal: meter.createObservableGauge('flotte_maintenance_overdue_total', {
      description: 'Number of maintenances past due and not completed',
    }),
    kafkaConsumerLag: meter.createObservableGauge('flotte_kafka_consumer_lag', {
      description: 'Kafka consumer lag by topic and consumer group',
    }),
  };

  instruments.maintenanceOverdueTotal.addCallback(async (result) => {
    try {
      const maintenances = await maintenanceRepository.findAll();
      const now = Date.now();
      const overdue = maintenances.filter((maintenance) => {
        const maintenanceDate = Date.parse(maintenance.date);
        return Number.isFinite(maintenanceDate)
          && maintenanceDate < now
          && maintenance.status !== 'terminee'
          && maintenance.status !== 'annulee';
      }).length;

      result.observe(overdue);
    } catch (error) {
      console.error('[Metrics] Impossible de calculer flotte_maintenance_overdue_total:', error.message);
    }
  });

  instruments.kafkaConsumerLag.addCallback((result) => {
    for (const [key, lag] of kafkaConsumerLag.entries()) {
      const [topic, consumerGroup] = key.split('::');
      result.observe(lag, { topic, consumer_group: consumerGroup });
    }
  });

  return instruments;
}

function setKafkaConsumerLag(topic, consumerGroup, lag) {
  const safeLag = Number.isFinite(Number(lag)) ? Math.max(0, Number(lag)) : 0;
  kafkaConsumerLag.set(`${topic}::${consumerGroup}`, safeLag);
}

function buildRoute(req) {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }
  return req.path || 'unknown';
}

function httpMetricsMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const { requestsTotal, requestErrorsTotal, requestDurationSeconds } = getInstruments();
    const elapsedNs = Number(process.hrtime.bigint() - startedAt);
    const durationSeconds = elapsedNs / 1_000_000_000;
    const attributes = {
      service: serviceName,
      route: buildRoute(req),
      method: req.method,
      status: String(res.statusCode),
    };

    requestsTotal.add(1, attributes);
    requestDurationSeconds.record(durationSeconds, attributes);

    if (res.statusCode >= 500) {
      requestErrorsTotal.add(1, attributes);
    }
  });

  next();
}

module.exports = {
  httpMetricsMiddleware,
  setKafkaConsumerLag,
};
