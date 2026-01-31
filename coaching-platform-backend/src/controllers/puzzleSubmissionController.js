// src/controllers/puzzleSubmissionController.js
import asyncHandler from 'express-async-handler';
import UserPuzzleSubmission from '../models/UserPuzzleSubmission.js';
import DailyContent from '../models/DailyContent.js';
import GamificationService from '../services/GamificationService.js';
import mongoose from 'mongoose';

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

        if (typeof answer.selectedAnswer !== 'number' || answer.selectedAnswer < 0 || answer.selectedAnswer >= question.options.length) {
            res.status(400);
            throw new Error(`Invalid answer index for question ${i}.`);
        }

        const isCorrect = answer.selectedAnswer === question.correct_idx;
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
        // Get user to manually update points (since puzzles award 10 points per correct answer, not a fixed 10)
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.user._id);
        
        if (user) {
            // Add points for correct answers (10 points per correct answer)
            user.points += totalPoints;
            
            // Update daily progress
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let todayProgress = user.dailyProgress.find(progress => {
                const progressDate = new Date(progress.date);
                progressDate.setHours(0, 0, 0, 0);
                return progressDate.getTime() === today.getTime();
            });

            if (todayProgress) {
                if (!todayProgress.activitiesCompleted.some(id => id.toString() === puzzleId.toString())) {
                    todayProgress.activitiesCompleted.push(puzzleId);
                    todayProgress.score += totalPoints;
                }
            } else {
                user.dailyProgress.push({
                    date: today,
                    activitiesCompleted: [puzzleId],
                    score: totalPoints
                });
            }

            // Update streaks
            const levelKey = user.membershipLevel === 'FREE' ? 'free' : 
                           user.membershipLevel === 'BRONZE' ? 'bronze' : 
                           user.membershipLevel === 'SILVER' ? 'silver' : null;
            
            if (levelKey && user.streaks && user.streaks[levelKey]) {
                const streak = user.streaks[levelKey];
                const lastActive = streak.lastActive ? new Date(streak.lastActive) : null;
                const lastActiveDate = lastActive ? new Date(lastActive.setHours(0, 0, 0, 0)) : null;
                const todayDate = new Date(today);

                if (!lastActiveDate || lastActiveDate.getTime() === todayDate.getTime()) {
                    // Same day, no change
                } else {
                    const daysDiff = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysDiff === 1) {
                        // Consecutive day
                        streak.current += 1;
                        streak.max = Math.max(streak.max, streak.current);
                    } else {
                        // Streak broken
                        streak.current = 1;
                    }
                }
                streak.lastActive = today;
            }

            await user.save();
        }
        
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
