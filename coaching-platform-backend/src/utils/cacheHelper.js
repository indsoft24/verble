import redisClient from '../config/redisClient.js';

const CACHE_TTL = {
    SHORT: 300,      // 5 minutes - for frequently changing data
    MEDIUM: 900,     // 15 minutes - for moderately changing data
    LONG: 3600,      // 1 hour - for relatively static data
    VERY_LONG: 7200  // 2 hours - for very static data
};

const REDIS_OP_TIMEOUT_MS = 3000;

function withRedisTimeout(promise, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Redis ${label} timed out`)), REDIS_OP_TIMEOUT_MS)
        ),
    ]);
}

async function ensureConnected() {
    if (redisClient.isOpen) return;
    await withRedisTimeout(redisClient.connect(), 'connect');
}

/**
 * Get cached data from Redis
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} - Cached data or null
 */
export const getCache = async (key) => {
    try {
        await ensureConnected();
        const cached = await withRedisTimeout(redisClient.get(key), 'get');
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error(`[Cache] Error getting cache for key ${key}:`, error.message);
        return null;
    }
};

/**
 * Set cached data in Redis
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: MEDIUM)
 * @returns {Promise<boolean>} - Success status
 */
export const setCache = async (key, data, ttl = CACHE_TTL.MEDIUM) => {
    try {
        await ensureConnected();
        await withRedisTimeout(redisClient.setEx(key, ttl, JSON.stringify(data)), 'setEx');
        return true;
    } catch (error) {
        console.error(`[Cache] Error setting cache for key ${key}:`, error.message);
        return false;
    }
};

async function scanKeys(pattern) {
    const keys = [];
    const iter = redisClient.scanIterator({ MATCH: pattern, COUNT: 100 });
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis scan timed out')), REDIS_OP_TIMEOUT_MS * 3)
    );
    await Promise.race([
        (async () => {
            for await (const key of iter) {
                keys.push(key);
            }
        })(),
        timeout,
    ]);
    return keys;
}

/**
 * Delete cached data from Redis
 * @param {string} key - Cache key (supports wildcards with *)
 * @returns {Promise<boolean>} - Success status
 */
export const deleteCache = async (key) => {
    try {
        await ensureConnected();
        if (key.includes('*')) {
            const keys = await scanKeys(key);
            if (keys.length > 0) {
                await withRedisTimeout(redisClient.del(keys), 'del');
            }
        } else {
            await withRedisTimeout(redisClient.del(key), 'del');
        }
        return true;
    } catch (error) {
        console.error(`[Cache] Error deleting cache for key ${key}:`, error.message);
        return false;
    }
};

/**
 * Generate cache key for list endpoints
 * @param {string} prefix - Cache prefix (e.g., 'videos', 'courses')
 * @param {object} params - Query parameters
 * @returns {string} - Cache key
 */
export const generateCacheKey = (prefix, params = {}) => {
    const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}:${params[k]}`)
        .join('|');
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
};

export { CACHE_TTL };
