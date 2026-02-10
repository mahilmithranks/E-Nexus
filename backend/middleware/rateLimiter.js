import rateLimit from 'express-rate-limit';

// Rate limiter for login attempts
// Increased for 150+ users who might share an IP (NAT)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20000, // Allow 20000 attempts per 15 mins (approx 100 tries per user for 200 users sharing IP) - Increased for NAT/College Wifi
    message: 'Too many login attempts from this network, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    // keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip // Use X-Forwarded-For if available
});

// General API rate limiter
// Increased for 200+ concurrent users who might share an IP
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50000, // Allow 50000 requests per minute (~833 req/sec from same IP)
    message: 'Too many requests from this network, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
