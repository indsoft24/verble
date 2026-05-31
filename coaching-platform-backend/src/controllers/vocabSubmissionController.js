// src/controllers/vocabSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserVocabSubmission from '../models/UserVocabSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';
import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';
import { getMinVocabWordsRequired } from '../utils/vocabPracticeRules.js';

/**
 * @desc    Submit sentences using vocabulary words
 * @route   POST /api/submit-vocab-sentences
 * @access  Private
 */
export const submitVocabSentences = asyncHandler(async (req, res) => {
    const { vocabSetId, sentences } = req.body;

    if (!vocabSetId || !sentences) {
        res.status(400);
        throw new Error('Vocab set ID and sentences are required.');
    }

    if (!Array.isArray(sentences) || sentences.length < 2 || sentences.length > 5) {
        res.status(400);
        throw new Error('Must submit between 2 and 5 sentences.');
    }

    if (!mongoose.Types.ObjectId.isValid(vocabSetId)) {
        res.status(400);
        throw new Error('Invalid vocab set ID format.');
    }

    // Verify the vocab set exists
    const vocabContent = await DailyContent.findById(vocabSetId);
    if (!vocabContent) {
        res.status(404);
        throw new Error('Vocabulary set not found.');
    }

    if (vocabContent.type !== 'VOCAB_SET') {
        res.status(400);
        throw new Error('Content is not a vocabulary set.');
    }

    if (!isDailyContentScheduledForLocalToday(vocabContent.date)) {
        res.status(400);
        throw new Error('You can only submit sentences for this week\'s active vocabulary set.');
    }

    // Get available vocab words from the set
    const vocabItems = vocabContent.metadata?.vocabItems || [];
    const availableWords = vocabItems.map((item) => item.word?.toLowerCase() || '');

    // Validate sentences
    const validatedSentences = [];
    const allVocabWordsUsed = new Set();

    for (const sentenceData of sentences) {
        if (!sentenceData.sentence || !sentenceData.sentence.trim()) {
            res.status(400);
            throw new Error('All sentences must be non-empty.');
        }

        if (!Array.isArray(sentenceData.vocabWordsUsed) || sentenceData.vocabWordsUsed.length === 0) {
            res.status(400);
            throw new Error('Each sentence must use at least one vocabulary word.');
        }

        // Validate that vocab words used are from the set
        const vocabWordsUsed = sentenceData.vocabWordsUsed.map((word) => word.toLowerCase());
        const invalidWords = vocabWordsUsed.filter(word => !availableWords.includes(word));
        
        if (invalidWords.length > 0) {
            res.status(400);
            throw new Error(`Invalid vocabulary words: ${invalidWords.join(', ')}. Please use words from this vocabulary set.`);
        }

        // Track all unique vocab words used
        vocabWordsUsed.forEach(word => allVocabWordsUsed.add(word));

        validatedSentences.push({
            sentence: sentenceData.sentence.trim(),
            vocabWordsUsed: vocabWordsUsed
        });
    }

    const minWordsRequired = getMinVocabWordsRequired(vocabItems);
    if (allVocabWordsUsed.size < minWordsRequired) {
        res.status(400);
        throw new Error(
            `You must use at least ${minWordsRequired} different vocabulary word${minWordsRequired === 1 ? '' : 's'} across all sentences. Currently using ${allVocabWordsUsed.size}.`
        );
    }

    // Check if user already submitted for this vocab set
    const existingSubmission = await UserVocabSubmission.findOne({
        userId: req.user._id,
        vocabSetId: vocabSetId
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted sentences for this vocabulary set.');
    }

    const PARTICIPATION_POINTS = 10;

    const submission = await UserVocabSubmission.create({
        userId: req.user._id,
        vocabSetId: vocabSetId,
        sentences: validatedSentences,
        totalVocabWordsUsed: allVocabWordsUsed.size,
        evaluationPoints: 0,
        pointsEarned: 0,
    });

    let participationPointsAwarded = 0;
    let levelUpResult;

    try {
        const gamificationResult = await GamificationService.recordActivity(
            req.user._id.toString(),
            vocabSetId,
            PARTICIPATION_POINTS
        );
        participationPointsAwarded = gamificationResult?.success ? PARTICIPATION_POINTS : 0;
        levelUpResult = await GamificationService.checkLevelUp(req.user._id.toString());
    } catch {
        // submission saved even if gamification fails
    }

    res.status(201).json({
        status: 'success',
        message: 'Sentences submitted successfully!',
        data: {
            submission: {
                _id: submission._id,
                sentences: submission.sentences,
                totalVocabWordsUsed: submission.totalVocabWordsUsed,
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
 * @desc    Get user's vocab submission
 * @route   GET /api/submit-vocab-sentences/:vocabSetId
 * @access  Private
 */
export const getUserVocabSubmission = asyncHandler(async (req, res) => {
    const { vocabSetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vocabSetId)) {
        res.status(400);
        throw new Error('Invalid vocab set ID format.');
    }

    const submission = await UserVocabSubmission.findOne({
        userId: req.user._id,
        vocabSetId: vocabSetId
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this vocabulary set.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission
        }
    });
});
