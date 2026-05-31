// src/controllers/sentenceSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserSentenceSubmission from '../models/UserSentenceSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import { autoValidateSimpleSentence } from '../services/aiValidationService.js';
import { getLocalTodayBounds, isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';
import mongoose from 'mongoose';

/**
 * @desc    Submit a sentence using a word
 * @route   POST /api/submit-sentence
 * @access  Private
 */
export const submitSentence = asyncHandler(async (req, res) => {
    const { wordId, word, sentence, sentences } = req.body;

    if (!wordId || !word || (!sentence && !Array.isArray(sentences))) {
        res.status(400);
        throw new Error('Word ID, word, and sentence data are required.');
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

    // Users can submit only for today's word/phrase (same local-day window as GET /daily-content/today).
    if (!isDailyContentScheduledForLocalToday(wordContent.date)) {
        res.status(400);
        throw new Error('You can only submit sentences for today\'s content.');
    }

    const normalizedSentences = Array.isArray(sentences)
        ? sentences.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
        : [String(sentence || '').trim()].filter(Boolean);

    if (normalizedSentences.length < 1 || normalizedSentences.length > 5) {
        res.status(400);
        throw new Error('Please submit between 1 and 5 sentences.');
    }

    // Unique compound index (userId, wordId, sentence): duplicates in one request must fail here, not as a generic DB error.
    const uniqueSentences = [...new Set(normalizedSentences)];
    if (uniqueSentences.length !== normalizedSentences.length) {
        res.status(400);
        throw new Error('Each sentence must be unique. Remove duplicate lines or overlapping text.');
    }

    const isBatch = Array.isArray(sentences);
    if (isBatch && uniqueSentences.length < 2) {
        res.status(400);
        throw new Error('Submit at least 2 distinct sentences after removing duplicates.');
    }

    // Cap: up to 5 sentence lines per user per word **per local calendar day** (matches "today's activity"
    // and avoids blocking a full batch of 5 when older rows exist from previous days or partial retries).
    const { start: dayStart, end: dayEnd } = getLocalTodayBounds();
    const existingTodayCount = await UserSentenceSubmission.countDocuments({
        userId: req.user._id,
        wordId: wordId,
        createdAt: { $gte: dayStart, $lt: dayEnd },
    });
    const remainingSlots = 5 - existingTodayCount;
    if (remainingSlots <= 0) {
        res.status(400);
        throw new Error(
            'You already saved 5 sentences for this word today. Come back tomorrow or use a new daily word.'
        );
    }
    if (uniqueSentences.length > remainingSlots) {
        res.status(400);
        throw new Error(
            `You can save ${remainingSlots} more sentence line(s) today (${existingTodayCount} already saved). ` +
                `Remove ${uniqueSentences.length - remainingSlots} line(s) or submit fewer sentences at once.`
        );
    }

    const existingSubmissions = await UserSentenceSubmission.find({
        userId: req.user._id,
        wordId: wordId,
        sentence: { $in: uniqueSentences }
    }).select('sentence').lean();

    if (existingSubmissions.length > 0) {
        res.status(400);
        throw new Error('You have already submitted one or more of these sentences for this content.');
    }

    const createdSubmissions = [];
    for (const sentenceText of uniqueSentences) {
        // Try AI/auto validation if enabled
        let autoValidationResult = null;
        if (process.env.ENABLE_AI_VALIDATION === 'true' || process.env.ENABLE_AUTO_VALIDATION === 'true') {
            try {
                autoValidationResult = await autoValidateSimpleSentence(sentenceText, word);
            } catch (error) {
                console.error('[SentenceSubmission] Error in auto-validation:', error);
            }
        }
        try {
            const submission = await UserSentenceSubmission.create({
                userId: req.user._id,
                wordId: wordId,
                word: word,
                sentence: sentenceText,
                isCorrect: autoValidationResult?.isCorrect === true && autoValidationResult?.confidence >= 0.8
                    ? true
                    : autoValidationResult?.isCorrect === false && autoValidationResult?.confidence >= 0.8
                    ? false
                    : null,
                feedback: autoValidationResult?.feedback || undefined,
            });
            createdSubmissions.push(submission);
        } catch (err) {
            if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
                res.status(400);
                throw new Error('This sentence is already saved for this word, or a duplicate line was detected.');
            }
            throw err;
        }
    }

    const PARTICIPATION_POINTS = 10;
    let participationPointsAwarded = 0;
    let levelUpResult;

    try {
        const gamificationResult = await GamificationService.recordActivity(
            req.user._id.toString(),
            wordId,
            PARTICIPATION_POINTS
        );
        participationPointsAwarded = gamificationResult?.success ? PARTICIPATION_POINTS : 0;
        levelUpResult = await GamificationService.checkLevelUp(req.user._id.toString());
    } catch {
        // submissions saved even if gamification fails
    }

    res.status(201).json({
        status: 'success',
        message: 'Sentence submission saved successfully!',
        data: {
            submissions: createdSubmissions.map((submission) => ({
                _id: submission._id,
                sentence: submission.sentence,
                submittedAt: submission.createdAt,
                isCorrect: submission.isCorrect,
                evaluationPoints: submission.evaluationPoints ?? 0,
                feedback: submission.feedback,
                reviewedAt: submission.reviewedAt,
            })),
            participationPointsAwarded,
            evaluationPoints: 0,
            levelUp: levelUpResult,
        },
    });
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
