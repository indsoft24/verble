// src/controllers/leaderboardController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

function buildLeaderboard(users, viewerUserId) {
    let currentRank = 1;
    let previousPoints = null;
    const viewerId = viewerUserId?.toString();

    return users.map((user, index) => {
        const points = user.points || 0;
        if (previousPoints !== null && points < previousPoints) {
            currentRank = index + 1;
        }
        previousPoints = points;

        const userId = user._id.toString();
        const entry = {
            rank: currentRank,
            userId,
            name: user.name,
            membershipLevel: user.membershipLevel || 'FREE',
        };

        if (viewerId && userId === viewerId) {
            entry.points = points;
        } else {
            entry.points = null;
        }

        return entry;
    });
}

const SCORED_USER_FILTER = { points: { $gt: 0 } };

/**
 * @desc    Get leaderboard for free challenges (scored users only)
 * @route   GET /api/leaderboard/free
 * @access  Private
 */
export const getFreeLeaderboard = asyncHandler(async (req, res) => {
    const { limit = 100 } = req.query;

    const users = await User.find({
        role: 'user',
        membershipLevel: { $in: ['FREE', 'BRONZE', 'SILVER', 'GOLD'] },
        ...SCORED_USER_FILTER,
    })
        .select('name points membershipLevel')
        .sort({ points: -1 })
        .limit(parseInt(limit, 10))
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            leaderboard: buildLeaderboard(users, req.user._id),
            type: 'free',
        },
    });
});

/**
 * @desc    Get leaderboard for paid challenges (scored Full Course users only)
 * @route   GET /api/leaderboard/paid
 * @access  Private
 */
export const getPaidLeaderboard = asyncHandler(async (req, res) => {
    const { limit = 100 } = req.query;

    const users = await User.find({
        role: 'user',
        membershipLevel: 'FULL_COURSE',
        ...SCORED_USER_FILTER,
    })
        .select('name points membershipLevel')
        .sort({ points: -1 })
        .limit(parseInt(limit, 10))
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            leaderboard: buildLeaderboard(users, req.user._id),
            type: 'paid',
        },
    });
});

/**
 * @desc    Get user's rank in leaderboard (only meaningful when points > 0)
 * @route   GET /api/leaderboard/my-rank
 * @access  Private
 */
export const getMyRank = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId).select('points evaluationScore membershipLevel role');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const userPoints = user.points || 0;
    const leaderboardType = user.membershipLevel === 'FULL_COURSE' ? 'paid' : 'free';

    const query =
        leaderboardType === 'paid'
            ? { role: 'user', membershipLevel: 'FULL_COURSE', ...SCORED_USER_FILTER }
            : { role: 'user', membershipLevel: { $in: ['FREE', 'BRONZE', 'SILVER', 'GOLD'] }, ...SCORED_USER_FILTER };

    if (userPoints <= 0) {
        return res.status(200).json({
            status: 'success',
            data: {
                rank: null,
                points: 0,
                evaluationScore: user.evaluationScore || 0,
                membershipLevel: user.membershipLevel,
                leaderboardType,
            },
        });
    }

    const usersWithHigherPoints = await User.countDocuments({
        ...query,
        points: { $gt: userPoints },
    });

    const rank = usersWithHigherPoints + 1;

    res.status(200).json({
        status: 'success',
        data: {
            rank,
            points: userPoints,
            evaluationScore: user.evaluationScore || 0,
            membershipLevel: user.membershipLevel,
            leaderboardType,
        },
    });
});
