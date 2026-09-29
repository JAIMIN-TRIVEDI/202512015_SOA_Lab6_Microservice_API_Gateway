require('dotenv').config();

/**
 * Normalizes service URLs across Localhost, Docker networks, and Cloud platforms (Render/Railway/Fly.io)
 * @param {string} rawUrl 
 * @param {string} defaultUrl 
 * @returns {string}
 */
const normalizeServiceUrl = (rawUrl, defaultUrl) => {
  if (!rawUrl || rawUrl.trim() === '') return defaultUrl;
  let url = rawUrl.trim();

  // If already starts with http:// or https://
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a Render web service identifier (e.g., campusconnect-user-service-ghqa) without domain
  if (!url.includes('.') && !url.includes(':')) {
    return `https://${url}.onrender.com`;
  }

  // If it contains a cloud domain without protocol
  if (url.includes('.onrender.com') || url.includes('.railway.app') || url.includes('.fly.dev')) {
    return `https://${url}`;
  }

  // Default to http:// for local or docker host:port formats (e.g. user-service:3001)
  return `http://${url}`;
};

/**
 * Service Discovery Registry (Configuration-Based)
 * Centralized registry that reads and normalizes service URLs from environment variables.
 */
const servicesConfig = {
  port: parseInt(process.env.PORT, 10) || 8080,
  environment: process.env.NODE_ENV || 'development',
  services: {
    userService: {
      name: 'User Service',
      url: normalizeServiceUrl(process.env.USER_SERVICE_URL, 'http://user-service:3001'),
      routePrefix: '/users',
      description: 'Manages user identities, profiles, roles, and authentication.'
    },
    productService: {
      name: 'Product Service',
      url: normalizeServiceUrl(process.env.PRODUCT_SERVICE_URL, 'http://product-service:3002'),
      routePrefix: '/products',
      description: 'Manages product catalog, pricing, inventory stock, and availability.'
    },
    orderService: {
      name: 'Order Service',
      url: normalizeServiceUrl(process.env.ORDER_SERVICE_URL, 'http://order-service:3003'),
      routePrefix: '/orders',
      description: 'Handles order placement, business validations, and inter-service coordination.'
    }
  }
};

module.exports = servicesConfig;
