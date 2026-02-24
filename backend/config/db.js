import mongoose from 'mongoose';

// Cache the database connection for serverless environments
let cachedConnection = null;

const connectDB = async (retryCount = 0) => {
    // If already connected, return cached connection
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    try {
        const isServerless = !!process.env.VERCEL;
        const options = {
            maxPoolSize: isServerless ? 5 : 200,
            minPoolSize: isServerless ? 1 : 10,
            serverSelectionTimeoutMS: 10000, // Increased to 10s for slower DNS
            socketTimeoutMS: 45000,
            connectTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
            appName: 'ENexus-Production'
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        return conn;
    } catch (error) {
        const isNetworkError = [
            'MongoNetworkError',
            'MongoServerSelectionError',
            'ETIMEOUT',
            'EAI_AGAIN'
        ].includes(error.code) ||
            ['MongoNetworkError', 'MongoServerSelectionError'].includes(error.name) ||
            error.message.includes('ETIMEOUT');

        console.error(`❌ MongoDB Connection Error (Attempt ${retryCount + 1}): ${error.message}`);

        // Limit retries to 3
        if (isNetworkError && retryCount < 3) {
            const delay = 5000 * (retryCount + 1);
            console.log(`🔄 Network issue detected. Retrying in ${delay / 1000} seconds...`);
            await new Promise(res => setTimeout(res, delay));
            return connectDB(retryCount + 1);
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
