/**
 * Utility functions for safely extracting string IDs from objects
 * Handles cases where IDs might be objects (MongoDB ObjectId) or strings
 */

/**
 * Safely extracts a string ID from an object that might have _id as ObjectId or string
 * @param obj - Object with _id property (can be ObjectId or string)
 * @returns String ID or null if invalid
 */
export const extractId = (obj: any): string | null => {
    if (!obj) return null;
    
    // If it's already a string, return it
    if (typeof obj === 'string') {
        return obj.trim() || null;
    }
    
    // If it's an object with _id property
    if (typeof obj === 'object' && obj !== null) {
        // Check for _id property
        if (obj._id !== undefined) {
            const id = obj._id;
            // If _id is a string, return it
            if (typeof id === 'string') {
                return id.trim() || null;
            }
            // If _id is an object (ObjectId), try to convert to string
            if (typeof id === 'object' && id !== null) {
                // Try toString() method (MongoDB ObjectId has this)
                if (typeof id.toString === 'function') {
                    const str = id.toString();
                    return str.trim() || null;
                }
                // Try accessing $oid property (BSON format)
                if (id.$oid) {
                    return String(id.$oid).trim() || null;
                }
            }
        }
        
        // If the object itself might be an ID (like a direct ObjectId)
        if (typeof obj.toString === 'function' && obj.constructor?.name === 'ObjectId') {
            return obj.toString().trim() || null;
        }
    }
    
    return null;
};

/**
 * Safely extracts a string ID from a value that might be an object or string
 * This is a more general version that handles direct values
 * @param value - Value that might be an ID (string, object with _id, or ObjectId)
 * @returns String ID or null if invalid
 */
export const getStringId = (value: any): string | null => {
    if (!value) return null;
    
    // If it's already a string, return it
    if (typeof value === 'string') {
        return value.trim() || null;
    }
    
    // If it's an object, try to extract ID
    if (typeof value === 'object' && value !== null) {
        // Try _id property first
        if (value._id !== undefined) {
            return extractId(value._id);
        }
        // Try toString() method (for ObjectId)
        if (typeof value.toString === 'function') {
            const str = value.toString();
            // Check if it looks like an ObjectId (24 hex characters)
            if (/^[0-9a-fA-F]{24}$/.test(str)) {
                return str;
            }
        }
    }
    
    return null;
};

