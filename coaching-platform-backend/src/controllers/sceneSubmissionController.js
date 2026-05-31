// src/controllers/sceneSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserSceneSubmission from '../models/UserSceneSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';
import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';

/**
 * @desc    Submit a scene description
 * @route   POST /api/submit-scene-description
 * @access  Private
 */
export const submitSceneDescription = asyncHandler(async (req, res) => {
    const { sceneId, description } = req.body;

    if (!sceneId || !description) {
        res.status(400);
        throw new Error('Scene ID and description are required.');
    }

    if (!description.trim()) {
        res.status(400);
        throw new Error('Description cannot be empty.');
    }

    if (!mongoose.Types.ObjectId.isValid(sceneId)) {
        res.status(400);
        throw new Error('Invalid scene ID format.');
    }

    // Verify the scene exists
    const sceneContent = await DailyContent.findById(sceneId);
    if (!sceneContent) {
        res.status(404);
        throw new Error('Scene not found.');
    }

    if (sceneContent.type !== 'SCENE') {
        res.status(400);
        throw new Error('Content is not a scene.');
    }

    if (!isDailyContentScheduledForLocalToday(sceneContent.date)) {
        res.status(400);
        throw new Error('Only today\'s scene can be submitted.');
    }

    // Check if user already submitted for this scene
    const existingSubmission = await UserSceneSubmission.findOne({
        userId: req.user._id,
        sceneId: sceneId
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted a description for this scene.');
    }

    // Parse description into sentences (simple sentence splitting)
    const sentences = description
        .trim()
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const PARTICIPATION_POINTS = 10;

    const submission = await UserSceneSubmission.create({
        userId: req.user._id,
        sceneId: sceneId,
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
            sceneId,
            PARTICIPATION_POINTS
        );
        participationPointsAwarded = gamificationResult?.success ? PARTICIPATION_POINTS : 0;
        levelUpResult = await GamificationService.checkLevelUp(req.user._id.toString());
    } catch {
        // submission saved even if gamification fails
    }

    res.status(201).json({
        status: 'success',
        message: 'Scene description submitted successfully!',
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
 * @desc    Get user's scene submission
 * @route   GET /api/submit-scene-description/:sceneId
 * @access  Private
 */
export const getUserSceneSubmission = asyncHandler(async (req, res) => {
    const { sceneId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sceneId)) {
        res.status(400);
        throw new Error('Invalid scene ID format.');
    }

    const submission = await UserSceneSubmission.findOne({
        userId: req.user._id,
        sceneId: sceneId
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this scene.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission
        }
    });
});
