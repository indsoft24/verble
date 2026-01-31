/**
 * Razorpay Payment Gateway Configuration
 * Generic configuration for Verble platform
 */

/**
 * Get Razorpay credentials from environment variables
 * @returns {Object} Razorpay configuration with key_id, key_secret, and webhook_secret
 */
export const getRazorpayConfig = () => {
    const config = {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
    };

    if (!config.key_id || !config.key_secret) {
        throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }

    return config;
};

/**
 * Get app identifier from request headers (optional, for future multi-app support)
 * @param {Object} req - Express request object
 * @returns {string} App identifier or 'default'
 */
export const getAppIdentifier = (req) => {
    return req.headers['x-app-identifier']?.toLowerCase() || 'default';
};

export default {
    getRazorpayConfig,
    getAppIdentifier,
};

