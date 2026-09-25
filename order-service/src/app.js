require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const { USER_SERVICE_URL, PRODUCT_SERVICE_URL } = require('./services/client');

const app = express();
const PORT = process.env.PORT || process.env.ORDER_SERVICE_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health & Status Routes
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'order-service',
    status: 'online',
    port: PORT,
    upstreamServices: {
      userService: USER_SERVICE_URL,
      productService: PRODUCT_SERVICE_URL
    },
    endpoints: {
      getAllOrders: 'GET /orders',
      getOrderById: 'GET /orders/:id',
      createOrder: 'POST /orders'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'order-service',
    upstreamServices: {
      userService: USER_SERVICE_URL,
      productService: PRODUCT_SERVICE_URL
    }
  });
});

// Routes
app.use('/orders', orderRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    service: 'order-service',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Start Server
const start = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================`);
    console.log(`🚀 [Order Service] running on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}/orders`);
    console.log(`🔗 Upstream User Service: ${USER_SERVICE_URL}`);
    console.log(`🔗 Upstream Product Service: ${PRODUCT_SERVICE_URL}`);
    console.log(`=============================================`);
  });
};

start();

module.exports = app;
