import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Optimized for Serverless (Netlify/Vercel) & High Concurrency
            maxPoolSize: 1, // Keep low per-function to avoid DB connection limit exhaustion (150 users = 150 connections)
            minPoolSize: 0, // Allow dropping to 0 to save resources
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false, // Disable buffering to fail fast if disconnected
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
