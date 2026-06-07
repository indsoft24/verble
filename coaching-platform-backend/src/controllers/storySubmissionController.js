// src/controllers/storySubmissionController.js
import asyncHandler from 'express-async-handler';
import UserStorySubmission from '../models/UserStorySubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';
import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';

/**
 * @desc    Submit a story summary
 * @route   POST /api/submit-story-summary
 * @access  Private
 */
export const submitStorySummary = asyncHandler(async (req, res) => {
    const { storyId, summary } = req.body;

    if (!storyId || !summary) {
        res.status(400);
        throw new Error('Story ID and summary are required.');
    }

    if (!Array.isArray(summary) || summary.length < 2 || summary.length > 5) {
        res.status(400);
        throw new Error('Summary must contain between 2 and 5 sentences.');
    }

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
        res.status(400);
        throw new Error('Invalid story ID format.');
    }

    // Verify the story exists
    const storyContent = await DailyContent.findById(storyId);
    if (!storyContent) {
        res.status(404);
        throw new Error('Story not found.');
    }

    if (storyContent.type !== 'STORY') {
        res.status(400);
        throw new Error('Content is not a story.');
    }

    if (!isDailyContentScheduledForLocalToday(storyContent.date)) {
        res.status(400);
        throw new Error('You can only submit summary for today\'s story.');
    }

    // Check if user already submitted a summary for this story
    const existingSubmission = await UserStorySubmission.findOne({
        userId: req.user._id,
        storyId: storyId
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted a summary for this story.');
    }

    // Trim and validate sentences
    const trimmedSummary = summary.map(s => s.trim()).filter(s => s.length > 0);
    
    if (trimmedSummary.length < 2 || trimmedSummary.length > 5) {
        res.status(400);
        throw new Error('Summary must contain between 2 and 5 non-empty sentences.');
    }

    const PARTICIPATION_POINTS = 10;

    const submission = await UserStorySubmission.create({
        userId: req.user._id,
        storyId: storyId,
        summary: trimmedSummary,
        evaluationPoints: 0,
        pointsEarned: 0,
        sentencesCorrect: 0,
    });

    const { participationPointsAwarded, progress, levelUp: levelUpResult } =
        await GamificationService.runParticipationGamification(
            req.user._id.toString(),
            storyId,
            PARTICIPATION_POINTS
        );

    res.status(201).json({
        status: 'success',
        message: 'Story summary submitted successfully!',
        data: {
            submission: {
                _id: submission._id,
                summary: submission.summary,
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
 * @desc    Get user's story submission
 * @route   GET /api/submit-story-summary/:storyId
 * @access  Private
 */
export const getUserStorySubmission = asyncHandler(async (req, res) => {
    const { storyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
        res.status(400);
        throw new Error('Invalid story ID format.');
    }

    const submission = await UserStorySubmission.findOne({
        userId: req.user._id,
        storyId: storyId
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this story.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission
        }
    });
});
