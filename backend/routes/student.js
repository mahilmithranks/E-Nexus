import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getEnabledDays,
    getSessionsForDay,
    markAttendance,
    submitAssignment,
    getProfile,
    getSession
} from '../controllers/studentController.js';
import { protect, studentOnly } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads (memory storage for Vercel serverless)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'photo') {
        // Only accept images for attendance photos
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for attendance photos'), false);
        }
    } else {
        // Accept any file for assignments
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// All routes require student authentication
router.use(protect, studentOnly);

// Day and session routes (cached for faster loading)
router.get('/days', cacheMiddleware('student-days', 30000), getEnabledDays); // Cache for 30s
router.get('/sessions/:dayId', cacheMiddleware('student-sessions', 1000), getSessionsForDay); // Cache for 1s for near-real-time
router.get('/session/:sessionId', getSession); // No cache - real-time data needed

// Attendance route with photo upload (no cache - write operation)
router.post('/attendance', upload.single('photo'), markAttendance);

// Assignment submission route (no cache - write operation)
router.post('/assignment', upload.array('assignment'), submitAssignment);

// Profile route (no cache - user-specific data)
router.get('/profile', getProfile);

export default router;
