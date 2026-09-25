/**
 * Structured Request Logging Middleware for API Gateway
 * Logs method, path, matched target service, response status, and duration (ms).
 */
const gatewayLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalUrl = req.originalUrl || req.url;
  const method = req.method;

  // Determine target service based on path
  let targetService = 'Gateway Internal';
  if (originalUrl.startsWith('/users')) targetService = 'User Service';
  else if (originalUrl.startsWith('/products')) targetService = 'Product Service';
  else if (originalUrl.startsWith('/orders')) targetService = 'Order Service';

  // Attach response listener
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `[Gateway] ${new Date().toISOString()} | ${method.padEnd(6)} ${originalUrl.padEnd(25)} -> [${targetService.padEnd(15)}] ${statusColor}${statusCode}${resetColor} (${duration}ms)`
    );
  });

  next();
};

module.exports = gatewayLogger;
