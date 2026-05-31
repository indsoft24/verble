// src/controllers/sentenceValidationController.js
import asyncHandler from 'express-async-handler';
import UserSentenceSubmission from '../models/UserSentenceSubmission.js';
import UserStorySubmission from '../models/UserStorySubmission.js';
import UserVocabSubmission from '../models/UserVocabSubmission.js';
import UserSceneSubmission from '../models/UserSceneSubmission.js';
import UserSpeechSubmission from '../models/UserSpeechSubmission.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';

function getPreviousEvaluationPoints(submission) {
    if (submission.evaluationPoints != null && submission.evaluationPoints > 0) {
        return submission.evaluationPoints;
    }
    return submission.pointsEarned || 0;
}

function computeEvaluationPoints(submissionType, isCorrect, submission, pointsPerCorrect) {
    let sentencesCorrect = 0;
    let evaluationPoints = 0;

    if (submissionType === 'sentence') {
        if (isCorrect) {
            sentencesCorrect = 1;
            evaluationPoints = pointsPerCorrect;
        }
    } else if (submissionType === 'story') {
        const summary = submission.summary || [];
        if (isCorrect) {
            sentencesCorrect = summary.length;
            evaluationPoints = 10 + sentencesCorrect * pointsPerCorrect;
        }
    } else if (submissionType === 'vocab') {
        const sentences = submission.sentences || [];
        if (isCorrect) {
            sentencesCorrect = sentences.length;
            evaluationPoints = sentencesCorrect * pointsPerCorrect;
        }
    } else if (submissionType === 'scene' || submissionType === 'speech') {
        const sentences = submission.sentences || [];
        if (isCorrect) {
            sentencesCorrect = sentences.length;
            evaluationPoints = 10 + sentencesCorrect * pointsPerCorrect;
        }
    }

    return { evaluationPoints, sentencesCorrect };
}

async function applyEvaluationToSubmission(submission, submissionType, evaluationPoints, sentencesCorrect) {
    const previous = getPreviousEvaluationPoints(submission);
    const delta = evaluationPoints - previous;

    submission.evaluationPoints = evaluationPoints;
    submission.pointsEarned = evaluationPoints;
    if (sentencesCorrect !== undefined) {
        submission.sentencesCorrect = sentencesCorrect;
    }

    await submission.save();

    if (delta !== 0) {
        await GamificationService.applyEvaluationDelta(submission.userId.toString(), delta);
    }

    return { evaluationPoints, delta, previous };
}

/**
 * @desc    Validate a sentence submission (mark as correct/incorrect)
 * @route   PUT /api/validate-sentence/:submissionId
 * @access  Private (Admin)
 */
export const validateSentenceSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { isCorrect, feedback } = req.body;

    if (typeof isCorrect !== 'boolean') {
        res.status(400);
        throw new Error('isCorrect must be a boolean value.');
    }

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        res.status(400);
        throw new Error('Invalid submission ID format.');
    }

    let submission = await UserSentenceSubmission.findById(submissionId);
    let submissionType = 'sentence';
    let pointsPerCorrect = 10;

    if (!submission) {
        submission = await UserStorySubmission.findById(submissionId);
        submissionType = 'story';
        pointsPerCorrect = 2;
    }

    if (!submission) {
        submission = await UserVocabSubmission.findById(submissionId);
        submissionType = 'vocab';
        pointsPerCorrect = 10;
    }

    if (!submission) {
        submission = await UserSceneSubmission.findById(submissionId);
        submissionType = 'scene';
        pointsPerCorrect = 2;
    }

    if (!submission) {
        submission = await UserSpeechSubmission.findById(submissionId);
        submissionType = 'speech';
        pointsPerCorrect = 2;
    }

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found.');
    }

    submission.isCorrect = isCorrect;
    if (feedback) {
        submission.feedback = feedback;
    }
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    const { evaluationPoints, sentencesCorrect } = computeEvaluationPoints(
        submissionType,
        isCorrect,
        submission,
        pointsPerCorrect
    );

    const { delta } = await applyEvaluationToSubmission(
        submission,
        submissionType,
        evaluationPoints,
        sentencesCorrect
    );

    res.status(200).json({
        status: 'success',
        message: 'Submission validated successfully.',
        data: {
            submission: {
                _id: submission._id,
                isCorrect: submission.isCorrect,
                evaluationPoints: submission.evaluationPoints,
                pointsEarned: submission.evaluationPoints,
                sentencesCorrect: submission.sentencesCorrect,
                feedback: submission.feedback,
                reviewedAt: submission.reviewedAt,
                evaluationDelta: delta,
            },
        },
    });
});

/**
 * @desc    Validate individual sentences in a story summary
 * @route   PUT /api/validate-story/:submissionId/sentences
 * @access  Private (Admin)
 */
export const validateStorySentences = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { sentenceValidations } = req.body;

    if (!Array.isArray(sentenceValidations)) {
        res.status(400);
        throw new Error('sentenceValidations must be an array.');
    }

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        res.status(400);
        throw new Error('Invalid submission ID format.');
    }

    const submission = await UserStorySubmission.findById(submissionId);
    if (!submission) {
        res.status(404);
        throw new Error('Story submission not found.');
    }

    let sentencesCorrect = 0;
    const summary = submission.summary || [];

    sentenceValidations.forEach((validation, index) => {
        if (validation.isCorrect && index < summary.length) {
            sentencesCorrect++;
        }
    });

    const evaluationPoints = sentencesCorrect > 0 ? 10 + sentencesCorrect * 2 : 0;

    submission.sentencesCorrect = sentencesCorrect;
    submission.isCorrect = sentencesCorrect === summary.length && summary.length > 0;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    const { delta } = await applyEvaluationToSubmission(
        submission,
        'story',
        evaluationPoints,
        sentencesCorrect
    );

    res.status(200).json({
        status: 'success',
        message: 'Story sentences validated successfully.',
        data: {
            submission: {
                _id: submission._id,
                sentencesCorrect,
                evaluationPoints: submission.evaluationPoints,
                pointsEarned: submission.evaluationPoints,
                isCorrect: submission.isCorrect,
                reviewedAt: submission.reviewedAt,
                evaluationDelta: delta,
            },
        },
    });
});

/**
 * @desc    Get all pending submissions for review
 * @route   GET /api/validate-sentence/pending
 * @access  Private (Admin)
 */
export const getPendingSubmissions = asyncHandler(async (req, res) => {
    const { type, limit = 50 } = req.query;

    const query = { isCorrect: null };

    let submissions = [];

    if (!type || type === 'sentence') {
        const sentenceSubs = await UserSentenceSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('wordId', 'title type metadata')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sentenceSubs.map((s) => ({ ...s, submissionType: 'sentence' })));
    }

    if (!type || type === 'story') {
        const storySubs = await UserStorySubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('storyId', 'title type metadata')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...storySubs.map((s) => ({ ...s, submissionType: 'story' })));
    }

    if (!type || type === 'vocab') {
        const vocabSubs = await UserVocabSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('vocabSetId', 'title type metadata')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...vocabSubs.map((s) => ({ ...s, submissionType: 'vocab' })));
    }

    if (!type || type === 'scene') {
        const sceneSubs = await UserSceneSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('sceneId', 'title type metadata')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sceneSubs.map((s) => ({ ...s, submissionType: 'scene' })));
    }

    if (!type || type === 'speech') {
        const speechSubs = await UserSpeechSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('speechId', 'title type metadata')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...speechSubs.map((s) => ({ ...s, submissionType: 'speech' })));
    }

    submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    submissions = submissions.slice(0, parseInt(limit, 10));

    res.status(200).json({
        status: 'success',
        data: {
            submissions,
            count: submissions.length,
        },
    });
});

/**
 * @desc    Get all submissions (pending and reviewed)
 * @route   GET /api/validate-sentence/all
 * @access  Private (Admin)
 */
export const getAllSubmissions = asyncHandler(async (req, res) => {
    const { type, status = 'all', limit = 100 } = req.query;

    let query = {};
    if (status === 'pending') {
        query.isCorrect = null;
    } else if (status === 'reviewed') {
        query.isCorrect = { $ne: null };
    }

    let submissions = [];

    if (!type || type === 'sentence') {
        const sentenceSubs = await UserSentenceSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('wordId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sentenceSubs.map((s) => ({ ...s, submissionType: 'sentence' })));
    }

    if (!type || type === 'story') {
        const storySubs = await UserStorySubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('storyId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...storySubs.map((s) => ({ ...s, submissionType: 'story' })));
    }

    if (!type || type === 'vocab') {
        const vocabSubs = await UserVocabSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('vocabSetId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...vocabSubs.map((s) => ({ ...s, submissionType: 'vocab' })));
    }

    if (!type || type === 'scene') {
        const sceneSubs = await UserSceneSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('sceneId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sceneSubs.map((s) => ({ ...s, submissionType: 'scene' })));
    }

    if (!type || type === 'speech') {
        const speechSubs = await UserSpeechSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('speechId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...speechSubs.map((s) => ({ ...s, submissionType: 'speech' })));
    }

    submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    submissions = submissions.slice(0, parseInt(limit, 10));

    const stats = {
        total: submissions.length,
        pending: submissions.filter((s) => s.isCorrect === null).length,
        correct: submissions.filter((s) => s.isCorrect === true).length,
        incorrect: submissions.filter((s) => s.isCorrect === false).length,
    };

    res.status(200).json({
        status: 'success',
        data: {
            submissions,
            count: submissions.length,
            stats,
        },
    });
});
