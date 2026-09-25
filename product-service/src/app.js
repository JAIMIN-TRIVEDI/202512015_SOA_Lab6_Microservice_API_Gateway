require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || process.env.PRODUCT_SERVICE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health & Status Routes
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'product-service',
    status: 'online',
    port: PORT,
    endpoints: {
      getAllProducts: 'GET /products',
      getProductById: 'GET /products/:id',
      createProduct: 'POST /products',
      updateProduct: 'PUT /products/:id',
      deleteProduct: 'DELETE /products/:id'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'product-service' });
});

// Routes
app.use('/products', productRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    service: 'product-service',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Auto-seed initial products if collection is empty
const seedInitialData = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[Product Service] Seeding initial mock products (501, 502)...');
      await Product.insertMany([
        {
          productId: '501',
          name: 'Distributed Systems & Cloud Computing Textbook',
          description: 'Official SOA and Microservices reference book',
          price: 45.0,
          category: 'Books',
          stock: 25,
          isAvailable: true
        },
        {
          productId: '502',
          name: 'CampusConnect Smart ID Badge Lanyard',
          description: 'High quality RFID-embedded campus access accessory',
          price: 12.5,
          category: 'Merchandise',
          stock: 50,
          isAvailable: true
        }
      ]);
      console.log('[Product Service] Initial products seeded successfully.');
    }
  } catch (err) {
    console.warn('[Product Service] Seeding skipped/failed:', err.message);
  }
};

// Start Server
const start = async () => {
  await connectDB();
  await seedInitialData();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================`);
    console.log(`🚀 [Product Service] running on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}/products`);
    console.log(`=============================================`);
  });
};

start();

module.exports = app;
