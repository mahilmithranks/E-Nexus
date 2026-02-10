// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export const cacheMiddleware = (key, ttl = CACHE_TTL) => {
    return (req, res, next) => {
        try {
            // Skip caching if explicitly disabled via query param (e.g., ?refresh=true)
            if (req.query.refresh) {
                return next();
            }

            const cacheKey = key + (req.user ? `_user_${req.user.id}` : '') + JSON.stringify(req.params) + JSON.stringify(req.query);
            const cached = cache.get(cacheKey);

            if (cached && (Date.now() - cached.timestamp < ttl)) {
                console.log(`⚡ Serving from cache: ${key}`);
                return res.json(cached.data);
            }

            // Hook into res.json to capture the response
            const originalJson = res.json;
            res.json = function (body) {
                cache.set(cacheKey, {
                    data: body,
                    timestamp: Date.now()
                });
                return originalJson.call(this, body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
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
