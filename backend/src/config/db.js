const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = (process.env.MONGO_URI || '').trim();
    if (
      (uri.startsWith('"') && uri.endsWith('"')) ||
      (uri.startsWith("'") && uri.endsWith("'"))
    ) {
      uri = uri.slice(1, -1).trim();
    }
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log('📌 Ensure MongoDB service is running locally or update MONGO_URI in backend/.env');
  }
};

module.exports = connectDB;
