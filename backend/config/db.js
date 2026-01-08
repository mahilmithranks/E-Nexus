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
            // Optimized for Serverless (Netlify/Vercel) & High Concurrency
            maxPoolSize: 10, // Increased for 150+ concurrent users (was 1)
            minPoolSize: 5,  // Keep some connections ready
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
