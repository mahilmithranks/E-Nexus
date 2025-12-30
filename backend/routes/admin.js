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
    exportAssignments
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, adminOnly);

// Student management
router.post('/students/preload', preloadStudents);

// Day management
router.post('/days', createDay);
router.get('/days', getAllDays);
router.put('/days/:id/status', updateDayStatus);

// Session management
router.post('/sessions', createSession);
router.get('/sessions', getAllSessions);

// Attendance management
router.post('/sessions/:id/attendance/start', startAttendance);
router.post('/sessions/:id/attendance/stop', stopAttendance);
router.post('/attendance/override', overrideAttendance);

// Progress tracking
router.get('/progress', getProgress);

// Excel exports
router.get('/export/attendance', exportAttendance);
router.get('/export/assignments', exportAssignments);

export default router;
