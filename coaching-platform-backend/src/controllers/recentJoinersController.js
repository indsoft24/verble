// src/controllers/recentJoinersController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * @desc    Get recent full course joiners
 * @route   GET /api/recent-joiners
 * @access  Private
 */
export const getRecentJoiners = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    // Find users who have FULL_COURSE membership level
    // Sort by when they got FULL_COURSE (we'll use updatedAt as proxy, or can add a field)
    const users = await User.find({
        membershipLevel: 'FULL_COURSE',
    })
        .select('name email phoneNumber createdAt updatedAt')
        .sort({ updatedAt: -1 }) // Most recent first
        .limit(parseInt(limit))
        .lean();

    // Format response (extract city from phoneNumber or use a placeholder)
    // Note: If User model has a city field, use that instead
    const joiners = users.map(user => ({
        name: user.name,
        city: user.phoneNumber ? 'India' : 'N/A', // Placeholder - update when city field is added
        joinedAt: user.updatedAt || user.createdAt,
    }));

    res.status(200).json({
        status: 'success',
        data: {
            joiners,
        },
    });
});
