// src/controllers/speechSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserSpeechSubmission from '../models/UserSpeechSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';
import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';

/**
 * @desc    Submit a speech description
 * @route   POST /api/submit-speech-description
 * @access  Private
 */
export const submitSpeechDescription = asyncHandler(async (req, res) => {
    const { speechId, description } = req.body;

    if (!speechId || !description) {
        res.status(400);
        throw new Error('Speech ID and description are required.');
    }

    if (!description.trim()) {
        res.status(400);
        throw new Error('Description cannot be empty.');
    }

    if (!mongoose.Types.ObjectId.isValid(speechId)) {
        res.status(400);
        throw new Error('Invalid speech ID format.');
    }

    // Verify the speech exists
    const speechContent = await DailyContent.findById(speechId);
    if (!speechContent) {
        res.status(404);
        throw new Error('Speech not found.');
    }

    if (speechContent.type !== 'SPEECH') {
        res.status(400);
        throw new Error('Content is not a speech.');
    }

    if (!isDailyContentScheduledForLocalToday(speechContent.date)) {
        res.status(400);
        throw new Error('Only today\'s speech can be submitted.');
    }

    // Check if user already submitted for this speech
    const existingSubmission = await UserSpeechSubmission.findOne({
        userId: req.user._id,
        speechId: speechId
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted a description for this speech.');
    }

    // Parse description into sentences (simple sentence splitting)
    const sentences = description
        .trim()
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const PARTICIPATION_POINTS = 10;

    const submission = await UserSpeechSubmission.create({
        userId: req.user._id,
        speechId: speechId,
        description: description.trim(),
        sentences: sentences,
        evaluationPoints: 0,
        pointsEarned: 0,
    });

    let participationPointsAwarded = 0;
    let levelUpResult;

    try {
        const gamificationResult = await GamificationService.recordActivity(
            req.user._id.toString(),
            speechId,
            PARTICIPATION_POINTS
        );
        participationPointsAwarded = gamificationResult?.success ? PARTICIPATION_POINTS : 0;
        levelUpResult = await GamificationService.checkLevelUp(req.user._id.toString());
    } catch {
        // submission saved even if gamification fails
    }

    res.status(201).json({
        status: 'success',
        message: 'Speech description submitted successfully!',
        data: {
            submission: {
                _id: submission._id,
                description: submission.description,
                sentences: submission.sentences,
                evaluationPoints: 0,
                submittedAt: submission.createdAt,
                isCorrect: submission.isCorrect,
            },
            participationPointsAwarded,
            evaluationPoints: 0,
            levelUp: levelUpResult,
        },
    });
});

/**
 * @desc    Get user's speech submission
 * @route   GET /api/submit-speech-description/:speechId
 * @access  Private
 */
export const getUserSpeechSubmission = asyncHandler(async (req, res) => {
    const { speechId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(speechId)) {
        res.status(400);
        throw new Error('Invalid speech ID format.');
    }

    const submission = await UserSpeechSubmission.findOne({
        userId: req.user._id,
        speechId: speechId
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this speech.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission
        }
    });
});
