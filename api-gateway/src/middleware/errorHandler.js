/**
 * Centralized Proxy & Gateway Error Handlers
 */

/**
 * Handles errors occurring during proxying to upstream microservices
 * @param {string} serviceName 
 * @param {string} targetUrl 
 */
const createProxyErrorHandler = (serviceName, targetUrl) => {
  return (err, req, res) => {
    const errorCode = err.code || 'UNKNOWN_ERROR';
    console.error(
      `[Gateway Error] ❌ Failed to proxy request [${req.method} ${req.originalUrl}] to ${serviceName} (${targetUrl}): ${err.message} (${errorCode})`
    );

    if (res.headersSent) {
      return;
    }

    let statusCode = 502; // Bad Gateway by default
    let errorTitle = 'Bad Gateway';
    let errorMessage = `Target upstream service '${serviceName}' at ${targetUrl} is unreachable or timed out.`;

    if (errorCode === 'ECONNREFUSED' || errorCode === 'EHOSTUNREACH' || errorCode === 'ENOTFOUND') {
      statusCode = 503; // Service Unavailable
      errorTitle = 'Service Unavailable';
      errorMessage = `The downstream microservice '${serviceName}' is currently offline or unreachable. Please verify that the container is running.`;
    } else if (errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKETTIMEDOUT') {
      statusCode = 504; // Gateway Timeout
      errorTitle = 'Gateway Timeout';
      errorMessage = `The request to upstream microservice '${serviceName}' timed out.`;
    }

    res.status(statusCode).json({
      success: false,
      error: errorTitle,
      statusCode: statusCode,
      service: serviceName,
      targetUrl: targetUrl,
      code: errorCode,
      message: errorMessage,
      requestedPath: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  };
};

/**
 * Generic Express Fallback Error Handler
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error(`[Gateway Critical Error] ${err.stack || err.message}`);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    error: 'Internal Gateway Error',
    statusCode: 500,
    message: err.message || 'An unexpected error occurred at the API Gateway.',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  createProxyErrorHandler,
  globalErrorHandler
};
