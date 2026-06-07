import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import UserConversationSubmission from '../models/UserConversationSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';
import { getConversationParticipants } from '../utils/conversationParticipants.js';

const PARTICIPATION_POINTS = 10;

function normalizeExchanges(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((row) => ({
            participant1Line: String(row?.participant1Line ?? '').trim(),
            participant2Line: String(row?.participant2Line ?? '').trim(),
        }))
        .filter((row) => row.participant1Line || row.participant2Line);
}

/**
 * @desc    Submit practical conversation practice (2–5 exchanges)
 * @route   POST /api/submit-conversation-practice
 * @access  Private
 */
export const submitConversationPractice = asyncHandler(async (req, res) => {
    const { conversationId, exchanges: rawExchanges } = req.body;

    if (!conversationId || !rawExchanges) {
        res.status(400);
        throw new Error('Conversation ID and exchanges are required.');
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        res.status(400);
        throw new Error('Invalid conversation ID format.');
    }

    const exchanges = normalizeExchanges(rawExchanges);

    if (exchanges.length < 2 || exchanges.length > 5) {
        res.status(400);
        throw new Error('Must submit between 2 and 5 exchanges.');
    }

    for (const row of exchanges) {
        if (!row.participant1Line || !row.participant2Line) {
            res.status(400);
            throw new Error('Each exchange must include both participant lines.');
        }
    }

    const conversation = await DailyContent.findById(conversationId);
    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found.');
    }

    if (conversation.type !== 'CONVERSATION') {
        res.status(400);
        throw new Error('Content is not a practical conversation.');
    }

    if (conversation.metadata?.isProfessionalLibrary) {
        res.status(400);
        throw new Error('Practice submissions are only available for daily practical conversations.');
    }

    if (!isDailyContentScheduledForLocalToday(conversation.date)) {
        res.status(400);
        throw new Error('You can only submit practice for today\'s practical conversation.');
    }

    const { participant1, participant2 } = getConversationParticipants(conversation.metadata);

    const existing = await UserConversationSubmission.findOne({
        userId: req.user._id,
        conversationId,
    });

    if (existing) {
        res.status(400);
        throw new Error('You have already submitted practice for this conversation.');
    }

    const submission = await UserConversationSubmission.create({
        userId: req.user._id,
        conversationId,
        participant1,
        participant2,
        exchanges,
        evaluationPoints: 0,
        pointsEarned: 0,
    });

    const { participationPointsAwarded, progress, levelUp: levelUpResult } =
        await GamificationService.runParticipationGamification(
            req.user._id.toString(),
            conversationId,
            PARTICIPATION_POINTS
        );

    res.status(201).json({
        status: 'success',
        message: 'Practice submitted successfully!',
        data: {
            submission: {
                _id: submission._id,
                exchanges: submission.exchanges,
                participant1: submission.participant1,
                participant2: submission.participant2,
                evaluationPoints: 0,
                submittedAt: submission.createdAt,
                isCorrect: submission.isCorrect,
            },
            participationPointsAwarded,
            evaluationPoints: 0,
            progress,
            levelUp: levelUpResult,
        },
    });
});

/**
 * @desc    Get user's conversation practice submission
 * @route   GET /api/submit-conversation-practice/:conversationId
 * @access  Private
 */
export const getUserConversationSubmission = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        res.status(400);
        throw new Error('Invalid conversation ID format.');
    }

    const submission = await UserConversationSubmission.findOne({
        userId: req.user._id,
        conversationId,
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this conversation.');
    }

    res.status(200).json({
        status: 'success',
        data: { submission },
    });
});
