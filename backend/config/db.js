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
            maxPoolSize: 100, // Handle up to 100 concurrent DB operations
            minPoolSize: 20,  // Keep 20 connections warm at all times
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // bufferCommands removed - let Mongoose queue operations until connected
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
