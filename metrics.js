const { metrics } = require('@opentelemetry/api');

const serviceName = process.env.OTEL_SERVICE_NAME || 'gestion-flotte-gateway';
let instruments;

function getInstruments() {
  if (instruments) {
    return instruments;
  }

  const meter = metrics.getMeter('gestion-flotte-gateway-metrics', '1.0.0');
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

function recordHttpMetrics({ route, method, status, durationSeconds }) {
  const { requestsTotal, requestErrorsTotal, requestDurationSeconds } = getInstruments();

  const attributes = {
    service: serviceName,
    route: route || 'unknown',
    method: method || 'UNKNOWN',
    status: String(status ?? '0'),
  };

  requestsTotal.add(1, attributes);
  requestDurationSeconds.record(durationSeconds, attributes);

  if (Number(status) >= 500) {
    requestErrorsTotal.add(1, attributes);
  }
}

module.exports = {
  recordHttpMetrics,
};
