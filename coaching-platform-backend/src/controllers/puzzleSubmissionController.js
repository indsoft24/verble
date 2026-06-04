// src/controllers/puzzleSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserPuzzleSubmission from '../models/UserPuzzleSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';
import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';
import { isFilledOption, isValidFilledSelection } from '../utils/quizOptionUtils.js';

/**
 * @desc    Submit puzzle answers
 * @route   POST /api/submit-puzzle
 * @access  Private
 */
export const submitPuzzle = asyncHandler(async (req, res) => {
    const { puzzleId, puzzleType, answers } = req.body;

    if (!puzzleId || !puzzleType || !answers) {
        res.status(400);
        throw new Error('Puzzle ID, puzzle type, and answers are required.');
    }

    if (!['SPOT_CORRECT_SENTENCE', 'GRAMMAR_FILL_BLANK'].includes(puzzleType)) {
        res.status(400);
        throw new Error('Invalid puzzle type.');
    }

    if (!Array.isArray(answers) || answers.length !== 5) {
        res.status(400);
        throw new Error('Must submit exactly 5 answers.');
    }

    if (!mongoose.Types.ObjectId.isValid(puzzleId)) {
        res.status(400);
        throw new Error('Invalid puzzle ID format.');
    }

    // Verify the puzzle exists
    const puzzleContent = await DailyContent.findById(puzzleId);
    if (!puzzleContent) {
        res.status(404);
        throw new Error('Puzzle not found.');
    }

    if (puzzleContent.type !== 'PUZZLE') {
        res.status(400);
        throw new Error('Content is not a puzzle.');
    }

    if (!isDailyContentScheduledForLocalToday(puzzleContent.date)) {
        res.status(400);
        throw new Error('Only today\'s puzzle can be submitted.');
    }

    // Get questions from metadata
    const questions = puzzleContent.metadata?.questions || [];
    if (questions.length !== 5) {
        res.status(400);
        throw new Error('Puzzle must have exactly 5 questions.');
    }

    // Validate and check answers
    const validatedAnswers = [];
    let correctCount = 0;
    let totalPoints = 0;

    for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        const question = questions[i];

        if (answer.questionIndex !== i) {
            res.status(400);
            throw new Error(`Invalid question index for answer ${i}.`);
        }

        if (!isValidFilledSelection(question.options, answer.selectedAnswer)) {
            res.status(400);
            throw new Error(`Invalid answer index for question ${i}.`);
        }

        const isCorrect =
            answer.selectedAnswer === question.correct_idx &&
            isFilledOption(question.options[question.correct_idx]);
        if (isCorrect) {
            correctCount++;
            totalPoints += 10;
        }

        validatedAnswers.push({
            questionIndex: i,
            selectedAnswer: answer.selectedAnswer,
            isCorrect: isCorrect
        });
    }

    // Check if user already submitted for this puzzle
    const existingSubmission = await UserPuzzleSubmission.findOne({
        userId: req.user._id,
        puzzleId: puzzleId
    });

    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted answers for this puzzle.');
    }

    // Create the submission
    const submission = await UserPuzzleSubmission.create({
        userId: req.user._id,
        puzzleId: puzzleId,
        puzzleType: puzzleType,
        answers: validatedAnswers,
        correctCount: correctCount,
        pointsEarned: totalPoints,
    });

    // Record activity in gamification system (points for correct answers)
    try {
        await GamificationService.recordActivity(req.user._id.toString(), puzzleId, totalPoints);
        
        // Check for level up
        const levelUpResult = await GamificationService.checkLevelUp(req.user._id.toString());
        
        res.status(201).json({
            status: 'success',
            message: `Puzzle submitted! You got ${correctCount} out of 5 correct and earned ${totalPoints} points.`,
            data: {
                submission: {
                    _id: submission._id,
                    correctCount: submission.correctCount,
                    pointsEarned: submission.pointsEarned,
                    answers: submission.answers,
                    submittedAt: submission.createdAt
                },
                levelUp: levelUpResult
            }
        });
    } catch (error) {
        // Even if gamification fails, the submission is saved
        res.status(201).json({
            status: 'success',
            message: `Puzzle submitted! You got ${correctCount} out of 5 correct and earned ${totalPoints} points.`,
            data: {
                submission: {
                    _id: submission._id,
                    correctCount: submission.correctCount,
                    pointsEarned: submission.pointsEarned,
                    answers: submission.answers,
                    submittedAt: submission.createdAt
                }
            }
        });
    }
});

/**
 * @desc    Get user's puzzle submission
 * @route   GET /api/submit-puzzle/:puzzleId
 * @access  Private
 */
export const getUserPuzzleSubmission = asyncHandler(async (req, res) => {
    const { puzzleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(puzzleId)) {
        res.status(400);
        throw new Error('Invalid puzzle ID format.');
    }

    const submission = await UserPuzzleSubmission.findOne({
        userId: req.user._id,
        puzzleId: puzzleId
    });

    if (!submission) {
        res.status(404);
        throw new Error('No submission found for this puzzle.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission
        }
    });
});
