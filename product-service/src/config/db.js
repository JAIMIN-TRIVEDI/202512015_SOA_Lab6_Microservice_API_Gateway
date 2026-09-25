const mongoose = require('mongoose');

const connectDB = async (retryCount = 5, delay = 3000) => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://mongodb:27017/product_db';

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Product Service] Connecting to MongoDB at ${mongoURI} (Attempt ${attempt}/${retryCount})...`);
      await mongoose.connect(mongoURI);
      console.log(`[Product Service] MongoDB Connected Successfully to product_db`);
      return;
    } catch (err) {
      console.error(`[Product Service] MongoDB Connection Failed: ${err.message}`);
      if (attempt < retryCount) {
        console.log(`[Product Service] Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Product Service] Maximum MongoDB connection retries reached.');
      }
    }
  }
};

module.exports = connectDB;
