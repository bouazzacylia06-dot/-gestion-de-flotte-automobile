const { metrics } = require('@opentelemetry/api');

const serviceName = process.env.OTEL_SERVICE_NAME || 'evenement-service';
let instruments;

function getInstruments() {
  if (instruments) {
    return instruments;
  }

  const meter = metrics.getMeter('evenement-service-metrics', '1.0.0');
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
  };

  return instruments;
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
};
