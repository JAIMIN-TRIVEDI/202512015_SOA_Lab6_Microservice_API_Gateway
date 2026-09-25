const axios = require('axios');

// Default URLs configured via environment variables
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

const HTTP_TIMEOUT_MS = parseInt(process.env.HTTP_TIMEOUT_MS, 10) || 4000;

/**
 * Fetch and validate User from User Service
 * @param {string} userId
 * @returns {Promise<{success: boolean, data?: object, status?: number, message?: string}>}
 */
const fetchUser = async (userId) => {
  const url = `${USER_SERVICE_URL}/users/${userId}`;
  try {
    console.log(`[Order Service] 📡 Requesting User validation -> GET ${url}`);
    const response = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
    
    // Check standard response schema
    if (response.data && response.data.data) {
      return { success: true, data: response.data.data };
    }
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      // User service responded with an HTTP status code (e.g., 404)
      return {
        success: false,
        status: error.response.status,
        message: error.response.data?.message || `User Service responded with status ${error.response.status}`
      };
    } else {
      // Network error, connection refused, or timeout (User Service is down)
      console.error(`[Order Service] ❌ User Service unreachable at ${url}: ${error.message}`);
      return {
        success: false,
        status: 503,
        message: `User Service is unavailable (${USER_SERVICE_URL}). Please verify that user-service is running.`
      };
    }
  }
};

/**
 * Fetch and validate Product from Product Service
 * @param {string} productId
 * @returns {Promise<{success: boolean, data?: object, status?: number, message?: string}>}
 */
const fetchProduct = async (productId) => {
  const url = `${PRODUCT_SERVICE_URL}/products/${productId}`;
  try {
    console.log(`[Order Service] 📡 Requesting Product validation -> GET ${url}`);
    const response = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
    
    if (response.data && response.data.data) {
      return { success: true, data: response.data.data };
    }
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      // Product service responded with an HTTP status code (e.g., 404)
      return {
        success: false,
        status: error.response.status,
        message: error.response.data?.message || `Product Service responded with status ${error.response.status}`
      };
    } else {
      // Network error, connection refused, or timeout (Product Service is down)
      console.error(`[Order Service] ❌ Product Service unreachable at ${url}: ${error.message}`);
      return {
        success: false,
        status: 503,
        message: `Product Service is unavailable (${PRODUCT_SERVICE_URL}). Please verify that product-service is running.`
      };
    }
  }
};

module.exports = {
  fetchUser,
  fetchProduct,
  USER_SERVICE_URL,
  PRODUCT_SERVICE_URL
};
