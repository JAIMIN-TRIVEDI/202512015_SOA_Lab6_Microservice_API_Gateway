const express = require('express');
const axios = require('axios');
const servicesConfig = require('../config/services');

const router = express.Router();
const startTime = Date.now();

/**
 * GET /health
 * Returns API Gateway status and configuration snapshot.
 * Supports optional ?probe=true to perform real-time downstream healthchecks.
 */
router.get('/', async (req, res) => {
  const probe = req.query.probe === 'true';
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const healthData = {
    status: 'healthy',
    gateway: {
      service: 'api-gateway',
      version: '1.0.0',
      uptimeSeconds: uptimeSeconds,
      timestamp: new Date().toISOString(),
      environment: servicesConfig.environment
    },
    serviceRegistry: {
      userService: servicesConfig.services.userService.url,
      productService: servicesConfig.services.productService.url,
      orderService: servicesConfig.services.orderService.url
    }
  };

  if (!probe) {
    return res.status(200).json(healthData);
  }

  // Real-time probing of downstream microservices with 15s timeout
  const downstreamStatus = {};
  let overallHealthy = true;

  const probeService = async (key, service) => {
    try {
      const response = await axios.get(`${service.url}/health`, { timeout: 15000 });
      downstreamStatus[key] = {
        name: service.name,
        url: service.url,
        status: response.data.status || 'healthy',
        statusCode: response.status
      };
    } catch (err) {
      overallHealthy = false;
      downstreamStatus[key] = {
        name: service.name,
        url: service.url,
        status: 'unreachable',
        error: err.message
      };
    }
  };

  await Promise.all([
    probeService('userService', servicesConfig.services.userService),
    probeService('productService', servicesConfig.services.productService),
    probeService('orderService', servicesConfig.services.orderService)
  ]);

  healthData.status = overallHealthy ? 'healthy' : 'degraded';
  healthData.downstreamServices = downstreamStatus;

  const statusCode = overallHealthy ? 200 : 207;
  return res.status(statusCode).json(healthData);
});

module.exports = router;
