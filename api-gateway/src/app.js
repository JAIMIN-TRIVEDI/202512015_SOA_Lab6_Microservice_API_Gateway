require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

const servicesConfig = require('./config/services');
const gatewayLogger = require('./middleware/logger');
const { createProxyErrorHandler, globalErrorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = servicesConfig.port;

// 1. Core Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(gatewayLogger);
app.use(morgan('dev'));

// 2. Health & Documentation Routes (Directly handled by Gateway)
app.use('/health', healthRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'online',
    version: '1.0.0',
    description: 'CampusConnect API Gateway & Reverse Proxy (Web Services & SOA Lab 7)',
    gatewayPort: PORT,
    environment: servicesConfig.environment,
    serviceDiscoveryRegistry: {
      userService: servicesConfig.services.userService.url,
      productService: servicesConfig.services.productService.url,
      orderService: servicesConfig.services.orderService.url
    },
    routingTable: {
      users: {
        pathPrefix: '/users',
        target: servicesConfig.services.userService.url,
        sampleEndpoints: [
          'GET /users',
          'GET /users/:id',
          'POST /users',
          'PUT /users/:id',
          'DELETE /users/:id'
        ]
      },
      products: {
        pathPrefix: '/products',
        target: servicesConfig.services.productService.url,
        sampleEndpoints: [
          'GET /products',
          'GET /products/:id',
          'POST /products',
          'PUT /products/:id',
          'DELETE /products/:id'
        ]
      },
      orders: {
        pathPrefix: '/orders',
        target: servicesConfig.services.orderService.url,
        sampleEndpoints: [
          'GET /orders',
          'GET /orders/:id',
          'POST /orders'
        ]
      }
    },
    diagnosticEndpoints: {
      healthCheck: 'GET /health',
      healthProbe: 'GET /health?probe=true'
    }
  });
});

// 3. Dynamic Reverse Proxy Routes (Config-Driven Service Discovery)
const setupProxyRoutes = () => {
  const { userService, productService, orderService } = servicesConfig.services;

  // Helper to create proxy instance for a service
  const createServiceProxy = (service) => {
    return createProxyMiddleware({
      target: service.url,
      changeOrigin: true,
      onProxyReq: fixRequestBody,
      onError: createProxyErrorHandler(service.name, service.url),
      proxyTimeout: 60000, // 60s timeout for cloud cold starts
      timeout: 60000,
      logLevel: 'silent' // Custom logging handled by gatewayLogger
    });
  };

  // Mount Proxy Handlers
  app.use(userService.routePrefix, createServiceProxy(userService));
  app.use(productService.routePrefix, createServiceProxy(productService));
  app.use(orderService.routePrefix, createServiceProxy(orderService));
};

setupProxyRoutes();

// 4. Catch-all 404 Route for Unmapped Gateway Paths
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    statusCode: 404,
    service: 'api-gateway',
    message: `API Gateway cannot route ${req.method} ${req.originalUrl}. Valid prefixes: /users, /products, /orders, /health`,
    timestamp: new Date().toISOString()
  });
});

// 5. Global Error Handler
app.use(globalErrorHandler);

// Start Gateway Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================================`);
  console.log(`🚀 [API Gateway] running on port ${PORT}`);
  console.log(`🌐 Public Gateway URL: http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`-------------------------------------------------------------`);
  console.log(`📡 Service Discovery Configuration:`);
  console.log(`   ├─ User Service    -> ${servicesConfig.services.userService.url}`);
  console.log(`   ├─ Product Service -> ${servicesConfig.services.productService.url}`);
  console.log(`   └─ Order Service   -> ${servicesConfig.services.orderService.url}`);
  console.log(`=============================================================`);
});

module.exports = { app, server };
