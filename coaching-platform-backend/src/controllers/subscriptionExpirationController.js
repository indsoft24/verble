// src/controllers/subscriptionExpirationController.js
import asyncHandler from 'express-async-handler';
import { triggerSubscriptionExpirationCheck } from '../utils/subscriptionExpirationScheduler.js';
import { checkAndHandleSubscriptionExpiration, updateUnlockedLevelsFromSubscriptions } from '../services/subscriptionAccessService.js';

/**
 * @desc    Manually trigger subscription expiration check for all users (Admin only)
 * @route   POST /api/admin/subscriptions/check-expiration
 * @access  Private/Admin
 */
export const triggerExpirationCheckAdmin = asyncHandler(async (req, res) => {
    try {
        const result = await triggerSubscriptionExpirationCheck();
        res.status(200).json({
            status: 'success',
            message: 'Subscription expiration check completed successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to check subscription expiration'
        });
    }
});

/**
 * @desc    Check and update subscription expiration for current user
 * @route   POST /api/subscriptions/check-my-expiration
 * @access  Private
 */
export const checkMySubscriptionExpiration = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await checkAndHandleSubscriptionExpiration(userId);
        
        // Get updated user
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId).select('unlockedLevels membershipLevel subscriptions');
        
        res.status(200).json({
            status: 'success',
            message: 'Subscription expiration check completed',
            data: {
                ...result,
                user: {
                    unlockedLevels: user.unlockedLevels,
                    membershipLevel: user.membershipLevel
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to check subscription expiration'
        });
    }
});

/**
 * @desc    Update unlocked levels based on current subscriptions (for current user)
 * @route   POST /api/subscriptions/update-levels
 * @access  Private
 */
export const updateMyUnlockedLevels = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await updateUnlockedLevelsFromSubscriptions(userId);
        
        // Get updated user
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId).select('unlockedLevels membershipLevel');
        
        res.status(200).json({
            status: 'success',
            message: 'Unlocked levels updated successfully',
            data: {
                unlockedLevels: user.unlockedLevels,
                membershipLevel: user.membershipLevel,
                hasGold: result.hasGold,
                hasFullCourse: result.hasFullCourse
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update unlocked levels'
        });
    }
});
