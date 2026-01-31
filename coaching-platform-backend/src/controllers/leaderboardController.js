// src/controllers/leaderboardController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * @desc    Get leaderboard for free challenges
 * @route   GET /api/leaderboard/free
 * @access  Private
 */
export const getFreeLeaderboard = asyncHandler(async (req, res) => {
    const { limit = 100 } = req.query;

    const users = await User.find({
        membershipLevel: { $in: ['FREE', 'BRONZE', 'SILVER', 'GOLD'] },
    })
        .select('name points membershipLevel')
        .sort({ points: -1 })
        .limit(parseInt(limit))
        .lean();

    // Calculate ranks with proper tie handling
    let currentRank = 1;
    let previousPoints = null;
    const leaderboard = users.map((user, index) => {
        const points = user.points || 0;
        // If points are different from previous, update rank
        if (previousPoints !== null && points < previousPoints) {
            currentRank = index + 1;
        }
        previousPoints = points;
        
        return {
            rank: currentRank,
            name: user.name,
            points: points,
            membershipLevel: user.membershipLevel || 'FREE',
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            leaderboard,
            type: 'free',
        },
    });
});

/**
 * @desc    Get leaderboard for paid challenges (Full Course users)
 * @route   GET /api/leaderboard/paid
 * @access  Private
 */
export const getPaidLeaderboard = asyncHandler(async (req, res) => {
    const { limit = 100 } = req.query;

    const users = await User.find({
        membershipLevel: 'FULL_COURSE',
    })
        .select('name points membershipLevel')
        .sort({ points: -1 })
        .limit(parseInt(limit))
        .lean();

    // Calculate ranks with proper tie handling
    let currentRank = 1;
    let previousPoints = null;
    const leaderboard = users.map((user, index) => {
        const points = user.points || 0;
        // If points are different from previous, update rank
        if (previousPoints !== null && points < previousPoints) {
            currentRank = index + 1;
        }
        previousPoints = points;
        
        return {
            rank: currentRank,
            name: user.name,
            points: points,
            membershipLevel: user.membershipLevel,
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            leaderboard,
            type: 'paid',
        },
    });
});

/**
 * @desc    Get user's rank in leaderboard
 * @route   GET /api/leaderboard/my-rank
 * @access  Private
 */
export const getMyRank = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId).select('points membershipLevel');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Get rank in appropriate leaderboard
    const leaderboardType = user.membershipLevel === 'FULL_COURSE' ? 'paid' : 'free';
    
    const query = leaderboardType === 'paid'
        ? { membershipLevel: 'FULL_COURSE' }
        : { membershipLevel: { $in: ['FREE', 'BRONZE', 'SILVER', 'GOLD'] } };

    const usersWithHigherPoints = await User.countDocuments({
        ...query,
        points: { $gt: user.points || 0 },
    });

    const rank = usersWithHigherPoints + 1;

    res.status(200).json({
        status: 'success',
        data: {
            rank,
            points: user.points || 0,
            membershipLevel: user.membershipLevel,
            leaderboardType,
        },
    });
});
