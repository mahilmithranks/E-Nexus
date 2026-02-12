import express from 'express';
import { protect } from '../middleware/auth.js';
import Session from '../models/Session.js';
import Day from '../models/Day.js';

const router = express.Router();

// Memory cache for sync check to handle 200+ concurrent users
let cachedSync = { lastUpdate: 0, timestamp: 0 };
const SYNC_CACHE_TTL = 5000; // 5 seconds

// @desc    Quickly check for any state changes
// @route   GET /api/sync/check
// @access  Private
router.get('/check', protect, async (req, res) => {
    try {
        // Use memory cache if fresh
        if (Date.now() - cachedSync.timestamp < SYNC_CACHE_TTL) {
            return res.json({ lastUpdate: cachedSync.lastUpdate });
        }

        // Find the most recent update across sessions and days
        const latestSession = await Session.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
        const latestDay = await Day.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();

        const lastUpdate = Math.max(
            latestSession?.updatedAt?.getTime() || 0,
            latestDay?.updatedAt?.getTime() || 0
        );

        // Update cache
        cachedSync = { lastUpdate, timestamp: Date.now() };

        res.json({ lastUpdate });
    } catch (error) {
        console.error('❌ Sync check error details:', {
            message: error.message,
            stack: error.stack,
            cache: cachedSync
        });
        // Fallback to error but don't dump too much info to student
        res.status(500).json({
            message: 'Sync failed',
            error: error.message,
            lastUpdate: cachedSync.lastUpdate
        });
    }
});

export default router;
