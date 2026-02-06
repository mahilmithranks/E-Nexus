// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export const cacheMiddleware = (key, ttl = CACHE_TTL) => {
    return (req, res, next) => {
        // Include user identification in cache key if authenticated
        // This is critical for routes that return user-specific data (like sessions)
        const userPart = req.user ? `_user_${req.user.registerNumber}` : '';
        const cacheKey = key + userPart + JSON.stringify(req.params) + JSON.stringify(req.query);
        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < ttl) {
            return res.json(cached.data);
        }

        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            cache.set(cacheKey, { data, timestamp: Date.now() });
            console.log(`💾 Cache SET: ${cacheKey}`);
            return originalJson(data);
        };

        next();
    };
};

export const clearCache = (pattern) => {
    if (pattern) {
        // Clear specific cache entries matching pattern
        for (const key of cache.keys()) {
            if (key.includes(pattern)) {
                cache.delete(key);
            }
        }
    } else {
        // Clear all cache
        cache.clear();
    }
    console.log(`🗑️ Cache cleared: ${pattern || 'ALL'}`);
};

export default { cacheMiddleware, clearCache };
