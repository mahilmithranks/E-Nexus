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
import { apiLimiter } from './middleware/rateLimiter.js';
import User from './models/User.js';
import compression from 'compression';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
// Explicit CORS headers for Vercel serverless compatibility
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Allow requests from anywhere (CORS fix for Vercel)
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compress all responses
app.use(compression());

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Background job to close expired attendance sessions
// SKIP on Vercel (We use Vercel Cron instead)
import Session from './models/Session.js';

if (!process.env.VERCEL) {
    setInterval(async () => {
        try {
            const now = new Date();
            const result = await Session.updateMany(
                {
                    attendanceOpen: true,
                    attendanceEndTime: { $lt: now }
                },
                {
                    $set: { attendanceOpen: false }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`Auto-closed ${result.modifiedCount} expired session(s).`);
            }
        } catch (error) {
            console.error('Error in auto-close job:', error);
        }
    }, 60 * 1000);
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

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

// Initialize admin user on first run
const initializeAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            const admin = await User.create({
                registerNumber: process.env.ADMIN_REGISTER_NUMBER || '99240041375',
                email: 'admin@workshop.edu', // Optional email for admin
                password: process.env.ADMIN_PASSWORD || '19012007',
                name: 'System Administrator',
                role: 'admin'
            });

            console.log('✅ Admin user created successfully');
            console.log(`   Register Number: ${admin.registerNumber}`);
            console.log(`   Password: ${process.env.ADMIN_PASSWORD || '19012007'}`);
        }
    } catch (error) {
        console.error('Error initializing admin:', error);
    }
};

// Start server (Only if not in Vercel/Serverless)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);

        // Initialize admin user
        initializeAdmin();
    });
} else {
    // In Vercel, wait for DB connection before initializing admin
    (async () => {
        await connectDB();
        await initializeAdmin();
    })();
}

export default app;
