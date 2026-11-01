const client = require('prom-client');

// Dedicated Prometheus registry for API Gateway
const register = new client.Registry();

// Enable collection of default Node.js and system metrics
client.collectDefaultMetrics({
  register,
  prefix: 'gateway_'
});

// Custom HTTP Metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by the API Gateway',
  labelNames: ['method', 'route', 'status_code', 'service']
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds through API Gateway',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpActiveRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests currently in flight',
  labelNames: ['service']
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(httpActiveRequests);

/**
 * Express middleware to record Prometheus metrics for incoming requests
 */
const metricsMiddleware = (serviceName = 'api-gateway') => {
  return (req, res, next) => {
    // Exclude internal metrics & health scrape from request counts
    if (req.path === '/metrics' || req.path === '/health') {
      return next();
    }

    const start = process.hrtime();
    httpActiveRequests.inc({ service: serviceName });

    res.on('finish', () => {
      httpActiveRequests.dec({ service: serviceName });
      const duration = process.hrtime(start);
      const durationSeconds = duration[0] + duration[1] / 1e9;

      // Extract route or top-level path prefix
      let route = req.baseUrl || req.path || 'unknown';
      if (req.path.startsWith('/users')) route = '/users';
      else if (req.path.startsWith('/products')) route = '/products';
      else if (req.path.startsWith('/orders')) route = '/orders';

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
