// src/middleware/oauthMiddleware.js
import User from '../models/User.js';

/**
 * Middleware to check if user has Google account linked
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const checkGoogleLinked = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Authentication required'
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user.googleId) {
            return res.status(400).json({
                status: 'fail',
                message: 'No Google account is linked to this user'
            });
        }

        req.googleLinked = true;
        next();
    } catch (error) {
        console.error('Check Google Linked Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check Google account status'
        });
    }
};

/**
 * Middleware to check if user can unlink Google account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const canUnlinkGoogle = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Authentication required'
            });
        }

        const user = await User.findById(req.user._id).select('+password');
        
        if (!user.googleId) {
            return res.status(400).json({
                status: 'fail',
                message: 'No Google account is linked to this user'
            });
        }

        // Check if user has alternative authentication method
        if (!user.password && user.authProvider === 'google') {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot unlink Google account. Please set a password first or link another authentication method'
            });
        }

        req.canUnlinkGoogle = true;
        next();
    } catch (error) {
        console.error('Can Unlink Google Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check unlink permissions'
        });
    }
};

/**
 * Middleware to validate OAuth callback state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateOAuthCallback = (req, res, next) => {
    const { code, error, state } = req.query;

    // Handle OAuth errors
    if (error) {
        console.error('OAuth Error:', error);
        return res.status(400).json({
            status: 'fail',
            message: `OAuth authentication failed: ${error}`
        });
    }

    // Validate authorization code
    if (!code) {
        return res.status(400).json({
            status: 'fail',
            message: 'Authorization code is required'
        });
    }

    // Validate state parameter (if used for CSRF protection)
    if (state && req.session && req.session.oauthState && state !== req.session.oauthState) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid state parameter'
        });
    }

    next();
};

/**
 * Middleware to check if user can link Google account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const canLinkGoogle = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Authentication required'
            });
        }

        const user = await User.findById(req.user._id);
        
        if (user.googleId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Google account is already linked to this user'
            });
        }

        req.canLinkGoogle = true;
        next();
    } catch (error) {
        console.error('Can Link Google Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check link permissions'
        });
    }
};

export default {
    checkGoogleLinked,
    canUnlinkGoogle,
    validateOAuthCallback,
    canLinkGoogle
};
