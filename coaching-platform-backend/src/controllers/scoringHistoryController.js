import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import {
    getScoringSummary,
    listScoringHistory,
    listAdminScoringUsers,
} from '../services/userScoringHistoryService.js';

export const getMyScoringSummary = asyncHandler(async (req, res) => {
    const summary = await getScoringSummary(req.user._id.toString());
    res.status(200).json({ status: 'success', data: summary });
});

export const getMyScoringHistory = asyncHandler(async (req, res) => {
    const { page, limit, category } = req.query;
    const result = await listScoringHistory(req.user._id.toString(), { page, limit, category });
    res.status(200).json({ status: 'success', data: result });
});

export const getAdminScoringUsers = asyncHandler(async (req, res) => {
    const { search, page, limit } = req.query;
    const result = await listAdminScoringUsers({ search, page, limit });
    res.status(200).json({ status: 'success', data: result });
});

export const getAdminUserScoringSummary = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error('Invalid user ID');
    }
    const summary = await getScoringSummary(userId);
    res.status(200).json({ status: 'success', data: summary });
});

export const getAdminUserScoringHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error('Invalid user ID');
    }
    const { page, limit, category } = req.query;
    const result = await listScoringHistory(userId, { page, limit, category });
    res.status(200).json({ status: 'success', data: result });
});
