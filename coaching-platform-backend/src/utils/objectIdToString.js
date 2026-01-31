/**
 * Utility to recursively convert all MongoDB ObjectIds to strings in an object
 * This ensures consistent ID format in API responses
 */

/**
 * Recursively converts all ObjectId instances to strings
 * @param {any} obj - Object to process
 * @param {number} depth - Current recursion depth (prevents infinite loops)
 * @param {WeakSet} visited - Set of visited objects (prevents circular references)
 * @returns {any} - Object with all ObjectIds converted to strings
 */
export const convertObjectIdsToStrings = (obj, depth = 0, visited = new WeakSet()) => {
    // Prevent infinite recursion
    if (depth > 20) {
        console.warn('[convertObjectIdsToStrings] Maximum depth reached');
        return obj;
    }

    // Handle null/undefined
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle primitives
    if (typeof obj !== 'object') {
        return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return obj;
    }

    // Handle Buffer objects
    if (Buffer.isBuffer(obj)) {
        return obj;
    }

    // Handle circular references
    if (visited.has(obj)) {
        return '[Circular Reference]';
    }

    // Handle ObjectId (MongoDB)
    if (obj.constructor && obj.constructor.name === 'ObjectId') {
        return obj.toString();
    }

    // Check if it's an ObjectId-like object (has toString method and looks like ObjectId)
    if (typeof obj.toString === 'function' && typeof obj.valueOf === 'function') {
        const str = obj.toString();
        // ObjectIds are 24 hex characters
        if (/^[0-9a-fA-F]{24}$/.test(str) && str.length === 24) {
            return str;
        }
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        visited.add(obj);
        try {
            return obj.map(item => convertObjectIdsToStrings(item, depth + 1, visited));
        } finally {
            visited.delete(obj);
        }
    }

    // Handle plain objects
    visited.add(obj);
    try {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            // Recursively process nested objects
            if (value !== null && typeof value === 'object') {
                result[key] = convertObjectIdsToStrings(value, depth + 1, visited);
            } else {
                result[key] = value;
            }
        }
        return result;
    } finally {
        visited.delete(obj);
    }
};

/**
 * Middleware to ensure all ObjectIds in responses are converted to strings
 * This should be applied before sending JSON responses
 */
export const ensureStringIds = (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
        try {
            // Convert all ObjectIds to strings
            const processedData = convertObjectIdsToStrings(data);
            return originalJson(processedData);
        } catch (error) {
            console.error('[ensureStringIds] Error converting ObjectIds:', error);
            // If conversion fails, return original data
            return originalJson(data);
        }
    };
    
    next();
};

