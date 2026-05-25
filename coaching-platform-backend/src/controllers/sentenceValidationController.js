// src/controllers/sentenceValidationController.js
import asyncHandler from 'express-async-handler';
import UserSentenceSubmission from '../models/UserSentenceSubmission.js';
import UserStorySubmission from '../models/UserStorySubmission.js';
import UserVocabSubmission from '../models/UserVocabSubmission.js';
import UserSceneSubmission from '../models/UserSceneSubmission.js';
import UserSpeechSubmission from '../models/UserSpeechSubmission.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

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

    // Try to find submission in different models
    let submission = await UserSentenceSubmission.findById(submissionId);
    let submissionType = 'sentence';
    let pointsPerCorrect = 10; // Default for regular sentences

    if (!submission) {
        submission = await UserStorySubmission.findById(submissionId);
        submissionType = 'story';
        pointsPerCorrect = 2; // 2 points per correct sentence in story
    }

    if (!submission) {
        submission = await UserVocabSubmission.findById(submissionId);
        submissionType = 'vocab';
        pointsPerCorrect = 10; // 10 points per correct sentence
    }

    if (!submission) {
        submission = await UserSceneSubmission.findById(submissionId);
        submissionType = 'scene';
        pointsPerCorrect = 2; // 2 points per correct sentence
    }

    if (!submission) {
        submission = await UserSpeechSubmission.findById(submissionId);
        submissionType = 'speech';
        pointsPerCorrect = 2; // 2 points per correct sentence
    }

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found.');
    }

    // Update submission
    submission.isCorrect = isCorrect;
    if (feedback) {
        submission.feedback = feedback;
    }
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    // Calculate points based on submission type
    let pointsToAdd = 0;
    let sentencesCorrect = 0;

    if (submissionType === 'sentence') {
        // Single sentence submission
        if (isCorrect) {
            pointsToAdd = pointsPerCorrect;
            sentencesCorrect = 1;
        }
        submission.pointsEarned = isCorrect ? pointsPerCorrect : 0;
    } else if (submissionType === 'story') {
        // Story summary - calculate based on sentences
        // Note: For story, use validateStorySentences endpoint for individual sentence validation
        // This endpoint is for overall validation
        const summary = submission.summary || [];
        if (isCorrect) {
            // If entire summary is correct, all sentences are correct
            sentencesCorrect = summary.length;
            pointsToAdd = 10 + (sentencesCorrect * pointsPerCorrect); // 10 base + 2 per sentence
        } else {
            // If marked incorrect overall, no additional points beyond base 10
            // Base 10 points were already awarded on submission
            sentencesCorrect = 0;
            pointsToAdd = 10; // Keep base points
        }
        submission.sentencesCorrect = sentencesCorrect;
        submission.pointsEarned = pointsToAdd;
    } else if (submissionType === 'vocab') {
        // Vocab submission - validate sentences
        const sentences = submission.sentences || [];
        if (isCorrect) {
            sentencesCorrect = sentences.length;
            pointsToAdd = sentencesCorrect * pointsPerCorrect; // 10 per sentence
        } else {
            sentencesCorrect = 0;
            pointsToAdd = 0;
        }
        submission.sentencesCorrect = sentencesCorrect;
        submission.pointsEarned = pointsToAdd;
    } else if (submissionType === 'scene' || submissionType === 'speech') {
        // Scene/Speech submission - validate sentences
        const sentences = submission.sentences || [];
        if (isCorrect) {
            sentencesCorrect = sentences.length;
            pointsToAdd = 10 + (sentencesCorrect * pointsPerCorrect); // 10 base + 2 per sentence
        } else {
            sentencesCorrect = 0;
            pointsToAdd = 0;
        }
        submission.sentencesCorrect = sentencesCorrect;
        submission.pointsEarned = pointsToAdd;
    }

    // Get previous points before updating
    const previousPoints = submission.pointsEarned || 0;
    await submission.save();

    // Update user points if there's a difference
    const user = await User.findById(submission.userId);
    if (user) {
        const pointsDifference = pointsToAdd - previousPoints;

        if (pointsDifference !== 0) {
            user.points += pointsDifference;

            // Update daily progress
            const submissionDate = new Date(submission.createdAt);
            submissionDate.setHours(0, 0, 0, 0);

            let dayProgress = user.dailyProgress.find(progress => {
                const progressDate = new Date(progress.date);
                progressDate.setHours(0, 0, 0, 0);
                return progressDate.getTime() === submissionDate.getTime();
            });

            if (dayProgress) {
                dayProgress.score += pointsDifference;
            } else {
                user.dailyProgress.push({
                    date: submissionDate,
                    activitiesCompleted: [submission._id],
                    score: pointsDifference,
                });
            }

            await user.save();
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Submission validated successfully.',
        data: {
            submission: {
                _id: submission._id,
                isCorrect: submission.isCorrect,
                pointsEarned: submission.pointsEarned,
                sentencesCorrect: submission.sentencesCorrect,
                feedback: submission.feedback,
                reviewedAt: submission.reviewedAt,
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
    const { sentenceValidations } = req.body; // Array of { sentenceIndex: number, isCorrect: boolean }

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

    // Validate each sentence
    let sentencesCorrect = 0;
    const summary = submission.summary || [];

    sentenceValidations.forEach((validation, index) => {
        if (validation.isCorrect && index < summary.length) {
            sentencesCorrect++;
        }
    });

    // Calculate points: 10 base + 2 per correct sentence
    const pointsEarned = 10 + (sentencesCorrect * 2);
    const previousPoints = submission.pointsEarned || 0;
    const pointsDifference = pointsEarned - previousPoints;

    // Update submission
    submission.sentencesCorrect = sentencesCorrect;
    submission.pointsEarned = pointsEarned;
    submission.isCorrect = sentencesCorrect === summary.length; // All correct
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    // Update user points
    if (pointsDifference > 0) {
        const user = await User.findById(submission.userId);
        if (user) {
            user.points += pointsDifference;

            // Update daily progress
            const submissionDate = new Date(submission.createdAt);
            submissionDate.setHours(0, 0, 0, 0);

            let dayProgress = user.dailyProgress.find(progress => {
                const progressDate = new Date(progress.date);
                progressDate.setHours(0, 0, 0, 0);
                return progressDate.getTime() === submissionDate.getTime();
            });

            if (dayProgress) {
                dayProgress.score += pointsDifference;
            } else {
                user.dailyProgress.push({
                    date: submissionDate,
                    activitiesCompleted: [submission._id],
                    score: pointsDifference,
                });
            }

            await user.save();
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Story sentences validated successfully.',
        data: {
            submission: {
                _id: submission._id,
                sentencesCorrect,
                pointsEarned,
                isCorrect: submission.isCorrect,
                reviewedAt: submission.reviewedAt,
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

    const query = { isCorrect: null }; // Not yet reviewed

    let submissions = [];

    if (!type || type === 'sentence') {
        const sentenceSubs = await UserSentenceSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('wordId', 'title type metadata')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sentenceSubs.map(s => ({ ...s, submissionType: 'sentence' })));
    }

    if (!type || type === 'story') {
        const storySubs = await UserStorySubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('storyId', 'title type metadata')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...storySubs.map(s => ({ ...s, submissionType: 'story' })));
    }

    if (!type || type === 'vocab') {
        const vocabSubs = await UserVocabSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('vocabSetId', 'title type metadata')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...vocabSubs.map(s => ({ ...s, submissionType: 'vocab' })));
    }

    if (!type || type === 'scene') {
        const sceneSubs = await UserSceneSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('sceneId', 'title type metadata')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sceneSubs.map(s => ({ ...s, submissionType: 'scene' })));
    }

    if (!type || type === 'speech') {
        const speechSubs = await UserSpeechSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('speechId', 'title type metadata')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...speechSubs.map(s => ({ ...s, submissionType: 'speech' })));
    }

    // Sort by creation date and limit
    submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    submissions = submissions.slice(0, parseInt(limit));

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

    // Build query based on status
    let query = {};
    if (status === 'pending') {
        query.isCorrect = null;
    } else if (status === 'reviewed') {
        query.isCorrect = { $ne: null };
    }
    // If status is 'all', no query filter needed

    let submissions = [];

    if (!type || type === 'sentence') {
        const sentenceSubs = await UserSentenceSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('wordId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sentenceSubs.map(s => ({ ...s, submissionType: 'sentence' })));
    }

    if (!type || type === 'story') {
        const storySubs = await UserStorySubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('storyId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...storySubs.map(s => ({ ...s, submissionType: 'story' })));
    }

    if (!type || type === 'vocab') {
        const vocabSubs = await UserVocabSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('vocabSetId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...vocabSubs.map(s => ({ ...s, submissionType: 'vocab' })));
    }

    if (!type || type === 'scene') {
        const sceneSubs = await UserSceneSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('sceneId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...sceneSubs.map(s => ({ ...s, submissionType: 'scene' })));
    }

    if (!type || type === 'speech') {
        const speechSubs = await UserSpeechSubmission.find(query)
            .populate('userId', 'name email phoneNumber mobile')
            .populate('speechId', 'title type metadata')
            .populate('reviewedBy', 'name email')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();
        submissions.push(...speechSubs.map(s => ({ ...s, submissionType: 'speech' })));
    }

    // Sort by creation date and limit
    submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    submissions = submissions.slice(0, parseInt(limit));

    // Calculate statistics
    const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s.isCorrect === null).length,
        correct: submissions.filter(s => s.isCorrect === true).length,
        incorrect: submissions.filter(s => s.isCorrect === false).length,
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
