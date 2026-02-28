const mongoose = require('mongoose');

/**
 * Connect to MongoDB database with retry logic
 */
const connectDB = async () => {
  const maxRetries = 999; // Keep retrying indefinitely
  let attempt = 0;

  const tryConnect = async () => {
    attempt++;
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 second timeout per attempt
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB Connection Failed (attempt ${attempt}): ${error.message}`);

      if (error.message.includes('whitelist') || error.message.includes('IP')) {
        console.error('⚠️  Your IP is not whitelisted in MongoDB Atlas!');
        console.error('👉 Fix: Go to https://cloud.mongodb.com → Network Access → Add IP Address → Allow Access from Anywhere');
      }

      if (attempt < maxRetries) {
        const delay = Math.min(5000 * attempt, 30000); // up to 30s between retries
        console.log(`🔄 Retrying in ${delay / 1000}s...`);
        setTimeout(tryConnect, delay);
      } else {
        console.error('❌ Max retries reached. Giving up.');
        process.exit(1);
      }
    }
  };

  await tryConnect();
};

module.exports = connectDB;
