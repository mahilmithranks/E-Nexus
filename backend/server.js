import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import compression from 'compression';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Session from './models/Session.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import syncRoutes from './routes/sync.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { clearCache } from './middleware/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Trust proxy for accurate IP detection (needed for rate limiting behind NAT/Vercel)
app.set('trust proxy', process.env.VERCEL ? 1 : false);

// Middleware
app.use(cors({
    origin: true, // Allow all origins dynamically
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compress all responses
app.use(compression());

// Apply rate limiting to all routes
app.use('/api', apiLimiter);

// Debug middleware to log requests on Vercel
app.use((req, res, next) => {
    if (process.env.VERCEL) {
        console.log(`[Vercel Request] ${req.method} ${req.url}`);
    }
    next();
});

// Root route for quick verification
app.get('/', (req, res) => {
    res.json({
        message: 'E-Nexus API is live',
        environment: process.env.VERCEL ? 'production' : 'development',
        time: new Date().toISOString()
    });
});

// Background job to close expired attendance sessions
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

// Serve static files with caching headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d',
    etag: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/sync', syncRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
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
                registerNumber: process.env.ADMIN_REGISTER_NUMBER || '992300817',
                email: process.env.ADMIN_EMAIL || '992300817@klu.ac.in',
                password: process.env.ADMIN_PASSWORD || '9943517648',
                name: 'System Administrator',
                role: 'admin'
            });

            console.log('✅ Admin user created successfully');
        }
    } catch (error) {
        console.error('Error initializing admin:', error);
    }
};

// Start the server directly
const startServer = async () => {
    try {
        await connectDB();
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
    (async () => {
        await connectDB();
        await initializeAdmin();
    })();
} else {
    startServer();
}

export default app;
