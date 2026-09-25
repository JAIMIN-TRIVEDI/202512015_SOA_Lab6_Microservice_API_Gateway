require('dotenv').config();

/**
 * Service Discovery Registry (Configuration-Based)
 * 
 * Centralized registry that reads service URLs from environment variables.
 * Allows routing table to be updated dynamically without touching application code.
 */
const servicesConfig = {
  port: parseInt(process.env.PORT, 10) || 8080,
  environment: process.env.NODE_ENV || 'development',
  services: {
    userService: {
      name: 'User Service',
      url: process.env.USER_SERVICE_URL || 'http://user-service:3001',
      routePrefix: '/users',
      description: 'Manages user identities, profiles, roles, and authentication.'
    },
    productService: {
      name: 'Product Service',
      url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
      routePrefix: '/products',
      description: 'Manages product catalog, pricing, inventory stock, and availability.'
    },
    orderService: {
      name: 'Order Service',
      url: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
      routePrefix: '/orders',
      description: 'Handles order placement, business validations, and inter-service coordination.'
    }
  }
};

module.exports = servicesConfig;
