// src/controllers/speechSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserSpeechSubmission from '../models/UserSpeechSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';
import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';
import {
    SUMMARY_MIN,
    SUMMARY_MAX,
    normalizeSummaries,
} from '../utils/goldSummaryConstants.js';

/**
 * @desc    Submit speech summaries (2–5)
 * @route   POST /api/submit-speech-description
 * @access  Private
 */
export const submitSpeechDescription = asyncHandler(async (req, res) => {
    const { speechId, summaries, description } = req.body;

    if (!speechId) {
        res.status(400);
        throw new Error('Speech ID is required.');
    }

    if (!mongoose.Types.ObjectId.isValid(speechId)) {
        res.status(400);
        throw new Error('Invalid speech ID format.');
    }

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
        throw new Error("Only today's speech can be submitted.");
    }

    const existingSubmission = await UserSpeechSubmission.findOne({
        userId: req.user._id,
        speechId,
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted summaries for this speech.');
    }

    let validated = normalizeSummaries(summaries);
    if (validated.length === 0 && description?.trim()) {
        validated = [description.trim()];
    }

    if (validated.length < SUMMARY_MIN) {
        res.status(400);
        throw new Error(`Please provide at least ${SUMMARY_MIN} summaries about the speech.`);
    }

    if (validated.length > SUMMARY_MAX) {
        res.status(400);
        throw new Error(`You can submit at most ${SUMMARY_MAX} summaries.`);
    }

    const PARTICIPATION_POINTS = 10;

    const submission = await UserSpeechSubmission.create({
        userId: req.user._id,
        speechId,
        summaries: validated,
        sentences: validated,
        evaluationPoints: 0,
        pointsEarned: 0,
    });

    const { participationPointsAwarded, progress, levelUp: levelUpResult } =
        await GamificationService.runParticipationGamification(
            req.user._id.toString(),
            speechId,
            PARTICIPATION_POINTS
        );

    res.status(201).json({
        status: 'success',
        message: 'Speech summaries submitted successfully!',
        data: {
            submission: {
                _id: submission._id,
                summaries: submission.summaries,
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
        speechId,
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this speech.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission,
        },
    });
});
