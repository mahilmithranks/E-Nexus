import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import syncRoutes from './routes/sync.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { clearCache } from './middleware/cache.js';
import User from './models/User.js';
import compression from 'compression';
import helmet from 'helmet';
import cluster from 'cluster';
import os from 'os';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Trust proxy for accurate IP detection (needed for rate limiting behind NAT/Vercel)
app.set('trust proxy', true);

// Middleware
// Explicit CORS headers for Vercel serverless compatibility
// Middleware
// Robust CORS configuration for Vercel/Local with Credentials support
// Cors configuration
app.use(cors({
    origin: true, // Allow all origins dynamically
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests explicitly if needed (cors middleware usually handles this)
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use helmet for security and headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compress all responses
app.use(compression());

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Background job to close expired attendance sessions
// SKIP on Vercel (We use Vercel Cron instead)
import Session from './models/Session.js';

if (!process.env.VERCEL) {
    setInterval(async () => {
        // Guard: Only run if DB is connected
        if (mongoose.connection.readyState !== 1) return;

        try {
            const now = new Date();
            const result = await Session.updateMany(
                {
                    attendanceOpen: true,
                    attendanceEndTime: { $ne: null, $lt: now }
                },
                {
                    $set: { attendanceOpen: false }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`Auto-closed ${result.modifiedCount} expired session(s).`);
                // Clear relevant caches when sessions auto-close
                clearCache('student-sessions');
                clearCache('admin-sessions');
                clearCache('admin-progress');
            }
        } catch (error) {
            console.error('Error in auto-close job:', error);
        }
    }, 10 * 1000); // Check every 10 seconds
}


// Create upload directories if they don't exist
// wrapped in try-catch for Vercel (read-only fs)
const uploadDirs = [
    'uploads/attendance-photos',
    'uploads/assignments'
];

try {
    uploadDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
} catch (error) {
    console.log('Skipping mkdir in read-only environment (Vercel)');
}

// Serve static files (uploaded photos and assignments)
// Only works if files exist
// Serve static files with caching headers for performance
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d', // Cache uploads for 1 day
    etag: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/sync', syncRoutes);

// Root route (for browser check)
app.get('/', (req, res) => {
    res.send('<h1>Backend Server is Running! 🚀</h1><p>API is available at /api</p>');
});

// Root API route
app.get('/api', (req, res) => {
    res.json({
        message: 'Workshop Management System API',
        version: '1.0.0',
        status: 'Running'
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 100KB' });
        }
        return res.status(400).json({ message: err.message });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Initialize admin user
const initializeAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            await User.create({
                registerNumber: process.env.ADMIN_REGISTER_NUMBER || '99240041375',
                email: process.env.ADMIN_EMAIL || '99240041375@klu.ac.in',
                password: process.env.ADMIN_PASSWORD || '19012007',
                name: 'System Administrator',
                role: 'admin'
            });

            console.log('✅ Admin user created successfully');
        }
    } catch (error) {
        console.error('Error initializing admin:', error);
    }
};

// Start the server directly (No clustering for better stability on free tier)
const startServer = async () => {
    try {
        await connectDB();

        // Initialize admin
        await initializeAdmin();

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📡 API available at http://127.0.0.1:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Server failed to start:', error);
    }
};

// Start logic based on environment
if (process.env.VERCEL) {
    // Vercel Serverless
    (async () => {
        await connectDB();
        await initializeAdmin();
    })();
} else {
    // Render / Local / VPS
    startServer();
}


export default app;
// Server restart trigger
