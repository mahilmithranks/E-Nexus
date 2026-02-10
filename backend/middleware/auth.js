import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Simple in-memory user cache to avoid redundant DB hits under high load (500+ users)
const userCache = new Map();
const USER_CACHE_TTL = 10000; // 10 seconds

// Verify JWT token
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user is in cache
            const cachedUser = userCache.get(decoded.id);
            if (cachedUser && (Date.now() - cachedUser.timestamp < USER_CACHE_TTL)) {
                req.user = cachedUser.user;
                return next();
            }

            // Get user from token (DB Hit)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Save to cache
            userCache.set(decoded.id, {
                user: req.user,
                timestamp: Date.now()
            });



            next();
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Student, Teacher or Admin middleware (most permissive)
export const anyAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// Student only middleware (Allows students and administrators)
export const studentOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'student' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied.' });
    }
};
