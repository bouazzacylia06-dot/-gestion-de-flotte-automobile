const { metrics } = require('@opentelemetry/api');
const vehicleRepository = require('./repositories/vehicleRepository');

const serviceName = process.env.OTEL_SERVICE_NAME || 'vehicle-service';
let instruments;
const kafkaConsumerLag = new Map();

const VEHICLE_STATUSES = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'];

function getInstruments() {
  if (instruments) {
    return instruments;
  }

  const meter = metrics.getMeter('vehicle-service-metrics', '1.0.0');
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
    vehiclesTotal: meter.createObservableGauge('flotte_vehicles_total', {
      description: 'Current number of vehicles by status',
    }),
    kafkaConsumerLag: meter.createObservableGauge('flotte_kafka_consumer_lag', {
      description: 'Kafka consumer lag by topic and consumer group',
    }),
  };

  instruments.vehiclesTotal.addCallback(async (result) => {
    try {
      const vehicles = await vehicleRepository.findAll();
      const counts = new Map(VEHICLE_STATUSES.map((status) => [status, 0]));

      for (const vehicle of vehicles) {
        const status = String(vehicle.statut || '').toUpperCase();
        if (counts.has(status)) {
          counts.set(status, counts.get(status) + 1);
        }
      }

      for (const status of VEHICLE_STATUSES) {
        result.observe(counts.get(status), { status });
      }
    } catch (error) {
      console.error('[Metrics] Impossible de calculer flotte_vehicles_total:', error.message);
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
