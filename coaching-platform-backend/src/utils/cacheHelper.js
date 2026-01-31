import redisClient from '../config/redisClient.js';

const CACHE_TTL = {
    SHORT: 300,      // 5 minutes - for frequently changing data
    MEDIUM: 900,     // 15 minutes - for moderately changing data
    LONG: 3600,      // 1 hour - for relatively static data
    VERY_LONG: 7200  // 2 hours - for very static data
};

/**
 * Get cached data from Redis
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} - Cached data or null
 */
export const getCache = async (key) => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        const cached = await redisClient.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error(`[Cache] Error getting cache for key ${key}:`, error.message);
        return null; // Return null on error to allow fallback to database
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
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`[Cache] Error setting cache for key ${key}:`, error.message);
        return false; // Return false on error but don't throw
    }
};

/**
 * Delete cached data from Redis
 * @param {string} key - Cache key (supports wildcards with *)
 * @returns {Promise<boolean>} - Success status
 */
export const deleteCache = async (key) => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        // Handle wildcard patterns
        if (key.includes('*')) {
            const keys = await redisClient.keys(key);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } else {
            await redisClient.del(key);
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
        .map(key => `${key}:${params[key]}`)
        .join('|');
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
};

export { CACHE_TTL };

