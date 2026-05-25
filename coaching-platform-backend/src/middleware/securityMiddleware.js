/**
 * Security Middleware
 * Prevents sensitive data exposure in API responses
 */

/**
 * Security headers middleware
 * Adds security headers to all responses
 */
export const securityHeaders = (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Content Security Policy (adjust as needed)
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
    
    next();
};

/**
 * Sanitize error messages to prevent information disclosure
 * @param {Error} error - The error object
 * @param {boolean} isProduction - Whether we're in production
 * @returns {string} - Sanitized error message
 */
const sanitizeErrorMessage = (error, isProduction = true) => {
    if (!isProduction) {
        // In development, show more details
        return error.message || 'An error occurred';
    }
    
    // In production, return generic messages
    if (error.name === 'ValidationError') {
        return 'Invalid input data provided.';
    }
    
    if (error.name === 'CastError') {
        return 'Invalid data format.';
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return 'Database operation failed.';
    }
    
    if (error.name === 'JsonWebTokenError') {
        return 'Invalid authentication token.';
    }
    
    if (error.name === 'TokenExpiredError') {
        return 'Authentication token has expired.';
    }
    
    // Generic error message for production
    return 'An error occurred while processing your request.';
};

/**
 * Sanitize response data to remove sensitive fields
 * @param {Object} data - Response data object
 * @returns {Object} - Sanitized data
 */
const sanitizeResponseData = (data) => {
    try {
        // Handle null, undefined, or non-objects
        if (data === null || data === undefined || typeof data !== 'object') {
            return data;
        }
        
        // Handle Date objects
        if (data instanceof Date) {
            return data;
        }
        
        // Handle Buffer objects
        if (Buffer.isBuffer(data)) {
            return data;
        }
        
        // Handle Mongoose documents - convert to plain object first
        if (data.toObject && typeof data.toObject === 'function') {
            try {
                data = data.toObject();
            } catch (e) {
                // If toObject fails, try to continue with original
                console.warn('[Sanitize] Failed to convert Mongoose document to object:', e.message);
            }
        }
        
        // List of sensitive fields to remove
        const sensitiveFields = [
            'password',
            'passwordResetToken',
            'passwordResetExpires',
            'emailVerificationToken',
            'emailVerificationExpires',
            'activeSessions',
            '__v',
            'internalNotes',
            'apiKey',
            'secret',
            'privateKey',
            'accessToken',
            'refreshToken',
        ];
        
        // Track visited objects to prevent circular references
        const visited = new WeakSet();
        
        // Recursively sanitize objects
        const sanitizeObject = (obj, depth = 0) => {
            // Prevent infinite recursion
            if (depth > 10) {
                console.warn('[Sanitize] Maximum depth reached, stopping recursion');
                return obj;
            }
            
            // Handle null, undefined, or non-objects
            if (obj === null || obj === undefined || typeof obj !== 'object') {
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
            
            // Handle arrays
            if (Array.isArray(obj)) {
                visited.add(obj);
                try {
                    return obj.map(item => sanitizeObject(item, depth + 1));
                } catch (e) {
                    console.warn('[Sanitize] Error processing array:', e.message);
                    return obj;
                } finally {
                    visited.delete(obj);
                }
            }
            
            // Handle Mongoose documents
            if (obj.toObject && typeof obj.toObject === 'function') {
                try {
                    obj = obj.toObject();
                } catch (e) {
                    // Continue with original if conversion fails
                }
            }
            
            visited.add(obj);
            
            try {
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    // Skip sensitive fields
                    if (sensitiveFields.includes(key.toLowerCase())) {
                        continue;
                    }
                    
                    // Handle ObjectId conversion to string
                    if (value !== null && typeof value === 'object') {
                        // Check if it's an ObjectId
                        if (value.constructor && value.constructor.name === 'ObjectId') {
                            cleaned[key] = value.toString();
                        } else if (typeof value.toString === 'function' && typeof value.valueOf === 'function') {
                            const str = value.toString();
                            // Check if it looks like an ObjectId (24 hex characters)
                            if (/^[0-9a-fA-F]{24}$/.test(str) && str.length === 24) {
                                cleaned[key] = str;
                            } else {
                                // Recursively sanitize nested objects
                                cleaned[key] = sanitizeObject(value, depth + 1);
                            }
                        } else {
                            // Recursively sanitize nested objects
                            cleaned[key] = sanitizeObject(value, depth + 1);
                        }
                    } else {
                        cleaned[key] = value;
                    }
                }
                
                return cleaned;
            } catch (e) {
                console.warn('[Sanitize] Error processing object:', e.message);
                return obj;
            } finally {
                visited.delete(obj);
            }
        };
        
        return sanitizeObject(data);
    } catch (error) {
        console.error('[Sanitize] Critical error in sanitizeResponseData:', error.message);
        // Return original data if sanitization fails to prevent breaking the response
        return data;
    }
};

/**
 * Response sanitization middleware
 * Removes sensitive data from all responses
 * Skips sanitization for admin routes and certain public routes
 */
export const sanitizeResponse = (req, res, next) => {
    // Skip sanitization for:
    // - Admin routes (admins need full data)
    // - Webhooks (server-to-server)
    // - Image serving routes
    // - Static file routes
    // - Module routes (to preserve array structure for mobile apps)
    const path = req.path || req.url || '';
    if (path.includes('/admin') || 
        path.includes('/webhook') ||
        path.includes('/images/') ||
        path.includes('/public/') ||
        path.includes('/thumbnail') ||
        path.includes('/player') ||
        path.includes('/modules/')) {
        return next();
    }
    
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
        try {
            // Sanitize the response data
            const sanitized = sanitizeResponseData(data);
            return originalJson(sanitized);
        } catch (error) {
            console.error('[Sanitize] Error in response sanitization:', error.message);
            // If sanitization fails, return original data to prevent breaking the response
            return originalJson(data);
        }
    };
    
    next();
};

/**
 * Global error handler middleware
 * Catches all errors and returns sanitized responses
 */
export const errorHandler = (err, req, res, next) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Log full error details on server (never expose to client)
        console.error('ERROR:', {
            message: err?.message || 'Unknown error',
            stack: err?.stack,
            name: err?.name || 'Error',
            path: req?.path || 'unknown',
            method: req?.method || 'unknown',
            timestamp: new Date().toISOString(),
        });
        
        // Status: prefer err.statusCode; else Express may already be set via res.status(4xx) before throw
        let statusCode = err?.statusCode ?? err?.status;
        if (statusCode == null) {
            const rc = res.statusCode;
            if (typeof rc === 'number' && rc >= 400 && rc < 600) {
                statusCode = rc;
            } else {
                statusCode = 500;
            }
        }

        let message = sanitizeErrorMessage(err, isProduction);

        // Handle specific error types
        if (err?.name === 'ValidationError') {
            statusCode = 400;
            message = 'Invalid input data provided.';
        } else if (err?.name === 'CastError') {
            statusCode = 400;
            // Provide more specific error message for CastError
            if (err?.path && err?.value) {
                message = `Invalid ${err.path} format: ${err.value} is not a valid ID.`;
            } else {
                message = 'Invalid data format.';
            }
        } else if (err?.name === 'MongoError' || err?.name === 'MongoServerError') {
            statusCode = 500;
            message = 'Database operation failed.';
        } else if (err?.name === 'JsonWebTokenError') {
            statusCode = 401;
            message = 'Invalid authentication token.';
        } else if (err?.name === 'TokenExpiredError') {
            statusCode = 401;
            message = 'Authentication token has expired.';
        } else if (err?.name === 'UnauthorizedError') {
            statusCode = 401;
            message = 'Not authorized to access this resource.';
        }

        // Client errors from async handlers: res.status(4xx); throw new Error('…') — use the intended message
        if (statusCode >= 400 && statusCode < 500 && err?.message) {
            const curatedNames = [
                'ValidationError',
                'CastError',
                'JsonWebTokenError',
                'TokenExpiredError',
                'UnauthorizedError',
            ];
            if (!curatedNames.includes(err?.name)) {
                message = err.message;
            }
        }

        // Never expose stack traces or internal error details
        const errorResponse = {
            status: statusCode >= 500 ? 'error' : 'fail',
            message: message,
        };
        
        // Only include additional data if it's safe and in development
        if (!isProduction && err?.name) {
            errorResponse.error = err.name;
        }
        
        // Ensure response hasn't been sent already
        if (!res.headersSent) {
            res.status(statusCode).json(errorResponse);
        }
    } catch (handlerError) {
        // If error handler itself fails, send minimal response
        console.error('CRITICAL: Error handler failed:', handlerError);
        if (!res.headersSent) {
            res.status(500).json({
                status: 'error',
                message: 'An internal server error occurred.'
            });
        }
    }
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: 'The requested resource was not found.',
    });
};

