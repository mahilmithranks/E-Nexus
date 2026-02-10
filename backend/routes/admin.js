import express from 'express';
import multer from 'multer';
import {
    preloadStudents,
    createDay,
    getAllDays,
    updateDayStatus,
    createSession,
    getAllSessions,
    startAttendance,
    stopAttendance,
    overrideAttendance,
    getProgress,
    exportAttendance,
    exportAssignments,
    runAutoCloseJob,
    getDashboardStats
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Cron job (Publicly accessible for Vercel Cron, typically protected by a Secret in headers in production)
router.get('/cron/auto-close', runAutoCloseJob);

// All routes below require admin authentication
router.use(protect, adminOnly);

// Dashboard stats
router.get('/stats', getDashboardStats);

// Student management
router.post('/students/preload', preloadStudents);

// Day management
router.post('/days', createDay);
router.get('/days', cacheMiddleware('admin-days', 30000), getAllDays); // Cache for 30s
router.put('/days/:id/status', updateDayStatus);

// Session management
router.post('/sessions', createSession);
router.get('/sessions', cacheMiddleware('admin-sessions', 30000), getAllSessions); // Cache for 30s

// Attendance management
router.post('/sessions/:id/attendance/start', startAttendance);
router.post('/sessions/:id/attendance/stop', stopAttendance);
router.post('/attendance/override', overrideAttendance);

// Progress tracking
router.get('/progress', cacheMiddleware('admin-progress', 60000), getProgress); // Cache for 60s (expensive query)

// Excel exports (no cache - always fresh data)
router.get('/export/attendance', exportAttendance);
router.get('/export/assignments', exportAssignments);

export default router;
