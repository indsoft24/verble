// src/controllers/lyricsSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserLyricsSubmission from '../models/UserLyricsSubmission.js';
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
 * @desc    Submit lyrics summaries (2–5)
 * @route   POST /api/submit-lyrics-sentences
 * @access  Private
 */
export const submitLyricsSentences = asyncHandler(async (req, res) => {
    const { lyricsId, summaries, description } = req.body;

    if (!lyricsId) {
        res.status(400);
        throw new Error('Lyrics ID is required.');
    }

    if (!mongoose.Types.ObjectId.isValid(lyricsId)) {
        res.status(400);
        throw new Error('Invalid lyrics ID format.');
    }

    const lyricsContent = await DailyContent.findById(lyricsId);
    if (!lyricsContent) {
        res.status(404);
        throw new Error('Song lyrics not found.');
    }

    if (lyricsContent.type !== 'LYRICS') {
        res.status(400);
        throw new Error('Content is not song lyrics.');
    }

    if (!isDailyContentScheduledForLocalToday(lyricsContent.date)) {
        res.status(400);
        throw new Error("Only today's song lyrics can be submitted.");
    }

    const existingSubmission = await UserLyricsSubmission.findOne({
        userId: req.user._id,
        lyricsId,
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted sentences for this song.');
    }

    let validated = normalizeSummaries(summaries);
    if (validated.length === 0 && description?.trim()) {
        validated = [description.trim()];
    }

    if (validated.length < SUMMARY_MIN) {
        res.status(400);
        throw new Error(`Please provide at least ${SUMMARY_MIN} sentences about the song.`);
    }

    if (validated.length > SUMMARY_MAX) {
        res.status(400);
        throw new Error(`You can submit at most ${SUMMARY_MAX} sentences.`);
    }

    const PARTICIPATION_POINTS = 10;

    const submission = await UserLyricsSubmission.create({
        userId: req.user._id,
        lyricsId,
        summaries: validated,
        sentences: validated,
        evaluationPoints: 0,
        pointsEarned: 0,
    });

    const { participationPointsAwarded, progress, levelUp: levelUpResult } =
        await GamificationService.runParticipationGamification(
            req.user._id.toString(),
            lyricsId,
            PARTICIPATION_POINTS
        );

    res.status(201).json({
        status: 'success',
        message: 'Lyrics sentences submitted successfully!',
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
 * @desc    Get user's lyrics submission
 * @route   GET /api/submit-lyrics-sentences/:lyricsId
 * @access  Private
 */
export const getUserLyricsSubmission = asyncHandler(async (req, res) => {
    const { lyricsId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lyricsId)) {
        res.status(400);
        throw new Error('Invalid lyrics ID format.');
    }

    const submission = await UserLyricsSubmission.findOne({
        userId: req.user._id,
        lyricsId,
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this song.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission,
        },
    });
});
