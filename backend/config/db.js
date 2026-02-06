import mongoose from 'mongoose';

// Cache the database connection for serverless environments
let cachedConnection = null;

const connectDB = async () => {
    // If already connected, return cached connection
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('✅ Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Optimized for High Concurrency (500+ users)
            maxPoolSize: 200,      // Handle more concurrent DB operations
            minPoolSize: 50,       // Keep 50 connections warm at all times
            serverSelectionTimeoutMS: 10000, // Be more patient under heavy load
            socketTimeoutMS: 60000,
            connectTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        cachedConnection = conn;
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
