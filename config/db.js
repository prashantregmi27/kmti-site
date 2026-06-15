import mongoose from 'mongoose';

mongoose.set('bufferTimeoutMS', 120000);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferTimeoutMS: 120000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    return null;
  }
};

