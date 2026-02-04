// src/controllers/sentenceSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserSentenceSubmission from '../models/UserSentenceSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import { autoValidateSimpleSentence } from '../services/aiValidationService.js';
import mongoose from 'mongoose';

/**
 * @desc    Submit a sentence using a word
 * @route   POST /api/submit-sentence
 * @access  Private
 */
export const submitSentence = asyncHandler(async (req, res) => {
    const { wordId, word, sentence } = req.body;

    if (!wordId || !word || !sentence) {
        res.status(400);
        throw new Error('Word ID, word, and sentence are required.');
    }

    if (!mongoose.Types.ObjectId.isValid(wordId)) {
        res.status(400);
        throw new Error('Invalid word ID format.');
    }

    // Verify the word exists
    const wordContent = await DailyContent.findById(wordId);
    if (!wordContent) {
        res.status(404);
        throw new Error('Word not found.');
    }

    if (wordContent.type !== 'WORD' && wordContent.type !== 'PHRASE') {
        res.status(400);
        throw new Error('Content is not a word or phrase.');
    }

    // Check if user already submitted this exact sentence for this word
    const existingSubmission = await UserSentenceSubmission.findOne({
        userId: req.user._id,
        wordId: wordId,
        sentence: sentence.trim()
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted this sentence for this word.');
    }

    // Try AI/auto validation if enabled
    let autoValidationResult = null;
    if (process.env.ENABLE_AI_VALIDATION === 'true' || process.env.ENABLE_AUTO_VALIDATION === 'true') {
        try {
            autoValidationResult = await autoValidateSimpleSentence(sentence.trim(), word);
        } catch (error) {
            console.error('[SentenceSubmission] Error in auto-validation:', error);
            // Continue without auto-validation
        }
    }

    // Create the submission
    const submission = await UserSentenceSubmission.create({
        userId: req.user._id,
        wordId: wordId,
        word: word,
        sentence: sentence.trim(),
        // Set initial validation if auto-validation succeeded with high confidence
        isCorrect: autoValidationResult?.isCorrect === true && autoValidationResult?.confidence >= 0.8 
            ? true 
            : autoValidationResult?.isCorrect === false && autoValidationResult?.confidence >= 0.8
            ? false
            : null,
        feedback: autoValidationResult?.feedback || undefined,
    });

    try {
        // Record activity completion (award base points once per content per day)
        // This keeps leaderboards/streaks functional even when AI validation is disabled.
        const gamificationResult = await GamificationService.recordActivity(
            req.user._id.toString(),
            wordId,
            10
        );
        
        // Check for level up
        const levelUpResult = await GamificationService.checkLevelUp(req.user._id.toString());
        
        res.status(201).json({
            status: 'success',
            message: 'Sentence submitted successfully!',
            data: {
                submission: {
                    _id: submission._id,
                    sentence: submission.sentence,
                    submittedAt: submission.createdAt,
                    isCorrect: submission.isCorrect,
                    autoValidated: autoValidationResult !== null,
                },
                pointsAwarded: gamificationResult?.success ? 10 : 0,
                levelUp: levelUpResult
            }
        });
    } catch (error) {
        // Even if gamification fails, the submission is saved
        res.status(201).json({
            status: 'success',
            message: 'Sentence submitted successfully!',
            data: {
                submission: {
                    _id: submission._id,
                    sentence: submission.sentence,
                    submittedAt: submission.createdAt,
                    isCorrect: submission.isCorrect,
                    autoValidated: autoValidationResult !== null,
                }
            }
        });
    }
});

/**
 * @desc    Get user's sentence submissions for a word
 * @route   GET /api/submit-sentence/:wordId
 * @access  Private
 */
export const getUserSubmissions = asyncHandler(async (req, res) => {
    const { wordId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(wordId)) {
        res.status(400);
        throw new Error('Invalid word ID format.');
    }

    const submissions = await UserSentenceSubmission.find({
        userId: req.user._id,
        wordId: wordId
    }).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: {
            submissions
        }
    });
});
