const mongoose = require('mongoose');

const connectDB = async (retryCount = 5, delay = 3000) => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://mongodb:27017/user_db';

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[User Service] Connecting to MongoDB at ${mongoURI} (Attempt ${attempt}/${retryCount})...`);
      await mongoose.connect(mongoURI);
      console.log(`[User Service] MongoDB Connected Successfully to user_db`);
      return;
    } catch (err) {
      console.error(`[User Service] MongoDB Connection Failed: ${err.message}`);
      if (attempt < retryCount) {
        console.log(`[User Service] Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[User Service] Maximum MongoDB connection retries reached.');
      }
    }
  }
};

module.exports = connectDB;
