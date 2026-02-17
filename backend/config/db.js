import mongoose from 'mongoose';

// Cache the database connection for serverless environments
let cachedConnection = null;

const connectDB = async () => {
    // If already connected, return cached connection
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    try {
        const isServerless = !!process.env.VERCEL;
        const options = {
            maxPoolSize: isServerless ? 5 : 200,
            minPoolSize: isServerless ? 1 : 10,
            serverSelectionTimeoutMS: 5000, // Faster failure detection
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
            appName: 'ENexus-Production'
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // Auto-retry once for network issues
        if (['MongoNetworkError', 'MongoServerSelectionError'].includes(error.name)) {
            console.log('🔄 Network issue detected. Retrying in 3 seconds...');
            await new Promise(res => setTimeout(res, 3000));
            return connectDB();
        }
        throw error;
    }
};

// Global Listeners to handle ephemeral resets silently
mongoose.connection.on('error', err => {
    if (err.code === 'ECONNRESET') {
        console.warn('📡 MongoDB: Connection reset by peer. Driver will auto-reconnect...');
    } else {
        console.error('📡 MongoDB: Unhandled error:', err.message);
    }
});

mongoose.connection.on('disconnected', () => {
    console.warn('📡 MongoDB: Disconnected. Ready state:', mongoose.connection.readyState);
});

export default connectDB;
