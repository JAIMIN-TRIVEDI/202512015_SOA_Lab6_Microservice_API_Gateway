const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'order_service_'
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by Order Service',
  labelNames: ['method', 'route', 'status_code', 'service']
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds through Order Service',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

const metricsMiddleware = (serviceName = 'order-service') => {
  return (req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health') {
      return next();
    }

    const start = process.hrtime();

    res.on('finish', () => {
      const duration = process.hrtime(start);
      const durationSeconds = duration[0] + duration[1] / 1e9;

      const route = req.baseUrl || req.route?.path || req.path;
      const labels = {
        method: req.method,
        route: route,
        status_code: res.statusCode.toString(),
        service: serviceName
      };

      httpRequestsTotal.inc(labels);
      httpRequestDurationSeconds.observe(labels, durationSeconds);
    });

    next();
  };
};

module.exports = {
  register,
  metricsMiddleware
};
