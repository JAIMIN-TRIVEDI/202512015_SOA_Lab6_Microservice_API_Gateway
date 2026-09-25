const mongoose = require('mongoose');

const connectDB = async (retryCount = 5, delay = 3000) => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://mongodb:27017/order_db';

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Order Service] Connecting to MongoDB at ${mongoURI} (Attempt ${attempt}/${retryCount})...`);
      await mongoose.connect(mongoURI);
      console.log(`[Order Service] MongoDB Connected Successfully to order_db`);
      return;
    } catch (err) {
      console.error(`[Order Service] MongoDB Connection Failed: ${err.message}`);
      if (attempt < retryCount) {
        console.log(`[Order Service] Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Order Service] Maximum MongoDB connection retries reached.');
      }
    }
  }
};

module.exports = connectDB;
