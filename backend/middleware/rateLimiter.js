import rateLimit from 'express-rate-limit';

// Rate limiter for login attempts
// Increased for 150+ users who might share an IP (NAT)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Allow 5000 attempts per 15 mins (approx 25 tries per user for 200 users sharing IP)
    message: 'Too many login attempts from this network, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
// Increased for 200+ concurrent users who might share an IP
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20000, // Allow 20000 requests per minute (~333 req/sec from same IP)
    message: 'Too many requests from this network, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
