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
        const isServerless = !!process.env.VERCEL;
        const options = {
            maxPoolSize: isServerless ? 5 : 200,
            minPoolSize: isServerless ? 1 : 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
            cachedConnection = null;
        });

        cachedConnection = conn;
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // Instead of immediate exit, retry once after a delay if it's a network/DNS error
        if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
            console.log('Retrying connection in 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectDB();
        }
        // process.exit(1); // Do not exit in serverless environment
        throw error;
    }
};

export default connectDB;
