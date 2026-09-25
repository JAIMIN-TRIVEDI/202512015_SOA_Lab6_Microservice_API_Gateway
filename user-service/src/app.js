require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health & Status Routes
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'user-service',
    status: 'online',
    port: PORT,
    endpoints: {
      getAllUsers: 'GET /users',
      getUserById: 'GET /users/:id',
      createUser: 'POST /users',
      updateUser: 'PUT /users/:id',
      deleteUser: 'DELETE /users/:id'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service' });
});

// Routes
app.use('/users', userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    service: 'user-service',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Auto-seed initial users if collection is empty
const seedInitialData = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[User Service] Seeding initial mock users (101, 102)...');
      await User.insertMany([
        {
          userId: '101',
          name: 'Jaimin Panchal',
          email: '202512015@daiict.ac.in',
          role: 'student',
          department: 'Computer Science & Engineering',
          status: 'active'
        },
        {
          userId: '102',
          name: 'Prof. Sharma',
          email: 'prof.sharma@daiict.ac.in',
          role: 'faculty',
          department: 'Information Technology',
          status: 'active'
        }
      ]);
      console.log('[User Service] Initial users seeded successfully.');
    }
  } catch (err) {
    console.warn('[User Service] Seeding skipped/failed:', err.message);
  }
};

// Start Server
const start = async () => {
  await connectDB();
  await seedInitialData();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================`);
    console.log(`🚀 [User Service] running on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}/users`);
    console.log(`=============================================`);
  });
};

start();

module.exports = app;
