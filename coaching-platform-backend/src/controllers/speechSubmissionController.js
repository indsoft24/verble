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

    // Create the submission
    // Initial points: 10 for submission (will be updated when sentences are reviewed)
    const submission = await UserSpeechSubmission.create({
        userId: req.user._id,
        speechId: speechId,
        description: description.trim(),
        sentences: sentences,
        pointsEarned: 10, // Base points for submission
    });

    // Record activity in gamification system (10 points for submission)
    try {
        await GamificationService.recordActivity(req.user._id.toString(), speechId, 10);
        
        // Check for level up
        const levelUpResult = await GamificationService.checkLevelUp(req.user._id.toString());
        
        res.status(201).json({
            status: 'success',
            message: 'Speech description submitted successfully!',
            data: {
                submission: {
                    _id: submission._id,
                    description: submission.description,
                    sentences: submission.sentences,
                    pointsEarned: submission.pointsEarned,
                    submittedAt: submission.createdAt
                },
                levelUp: levelUpResult
            }
        });
    } catch (error) {
        // Even if gamification fails, the submission is saved
        res.status(201).json({
            status: 'success',
            message: 'Speech description submitted successfully!',
            data: {
                submission: {
                    _id: submission._id,
                    description: submission.description,
                    sentences: submission.sentences,
                    pointsEarned: submission.pointsEarned,
                    submittedAt: submission.createdAt
                }
            }
        });
    }
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
