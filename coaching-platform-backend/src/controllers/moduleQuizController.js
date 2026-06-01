// src/controllers/moduleQuizController.js
import asyncHandler from 'express-async-handler';
import ModuleQuiz from '../models/ModuleQuiz.js';
import ModuleQuizSubmission from '../models/ModuleQuizSubmission.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import Module from '../models/Module.js';
import Video from '../models/Video.js';
import {
    assertQuizUnlockedForTake,
    finalizeModuleCompletion,
    getActiveQuizForModule,
    syncModuleProgressFromVideos,
    countModuleVideoProgress,
    resolveModuleQuizGate,
    handleQuizSubmissionFail,
} from '../services/moduleQuizAccessService.js';

/**
 * @desc    Get quiz for a module (without answers for students)
 * @route   GET /api/module-quizzes/:moduleId
 * @access  Private
 */
export const getModuleQuiz = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;

    await assertQuizUnlockedForTake(userId, moduleId);

    const quiz = await ModuleQuiz.findOne({ module: moduleId, isActive: true })
        .populate('module', 'title order');

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found for this module');
    }

    const quizForStudent = {
        _id: quiz._id,
        module: quiz.module,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions.map((q) => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            points: q.points,
        })),
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
    };

    const previousSubmissions = await ModuleQuizSubmission.find({
        user: userId,
        module: moduleId,
        quiz: quiz._id,
    })
        .sort({ submittedAt: -1 })
        .limit(5);

    const videoProgress = await countModuleVideoProgress(userId, moduleId);
    const completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });

    res.status(200).json({
        status: 'success',
        data: {
            quiz: quizForStudent,
            previousAttempts: previousSubmissions.length,
            bestScore:
                previousSubmissions.length > 0
                    ? Math.max(...previousSubmissions.map((s) => s.score))
                    : null,
            hasPassed: previousSubmissions.some((s) => s.passed),
            videosComplete: videoProgress.allComplete,
            moduleCompleted: Boolean(completion?.isCompleted),
        },
    });
});

/**
 * @desc    Submit module quiz
 * @route   POST /api/module-quizzes/:moduleId/submit
 * @access  Private
 */
export const submitModuleQuiz = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;
    const { answers, timeSpent } = req.body;

    await assertQuizUnlockedForTake(userId, moduleId);

    const quiz = await ModuleQuiz.findOne({ module: moduleId, isActive: true });
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found for this module');
    }

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
        res.status(400);
        throw new Error('Invalid answers format or count');
    }

    let correctAnswers = 0;
    let totalPoints = 0;
    const gradedAnswers = answers.map((answer, index) => {
        const question = quiz.questions[index];
        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        const pointsEarned = isCorrect ? question.points : 0;

        if (isCorrect) {
            correctAnswers++;
            totalPoints += pointsEarned;
        }

        return {
            questionId: question._id,
            selectedAnswer: answer.selectedAnswer,
            isCorrect,
            pointsEarned,
        };
    });

    const totalPossiblePoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const score =
        totalPossiblePoints > 0 ? Math.round((totalPoints / totalPossiblePoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const submission = await ModuleQuizSubmission.create({
        user: userId,
        module: moduleId,
        quiz: quiz._id,
        answers: gradedAnswers,
        totalQuestions: quiz.questions.length,
        correctAnswers,
        totalPoints,
        score,
        passed,
        timeSpent: timeSpent || 0,
    });

    let moduleCompleted = false;
    let retakeMessage = null;
    if (passed) {
        const completion = await finalizeModuleCompletion(userId, moduleId, score);
        moduleCompleted = Boolean(completion?.isCompleted);
    } else {
        const failResult = await handleQuizSubmissionFail(userId, moduleId);
        retakeMessage = failResult.retakeMessage;
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission: {
                _id: submission._id,
                score,
                passed,
                correctAnswers,
                totalQuestions: quiz.questions.length,
                moduleCompleted,
                retakeMessage,
                answers: gradedAnswers.map((a) => ({
                    questionId: a.questionId,
                    isCorrect: a.isCorrect,
                    pointsEarned: a.pointsEarned,
                })),
            },
        },
    });
});

/**
 * @desc    Get user's quiz submission with correct answers
 * @route   GET /api/module-quizzes/:moduleId/submission/:submissionId
 * @access  Private
 */
export const getQuizSubmission = asyncHandler(async (req, res) => {
    const { moduleId, submissionId } = req.params;
    const userId = req.user._id;

    const submission = await ModuleQuizSubmission.findOne({
        _id: submissionId,
        user: userId,
        module: moduleId,
    }).populate('quiz', 'title questions passingScore');

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    const quiz = submission.quiz;
    const detailedAnswers = submission.answers.map((subAnswer) => {
        const question = quiz.questions.find(
            (q) => q._id.toString() === subAnswer.questionId.toString()
        );
        return {
            questionId: subAnswer.questionId,
            question: question ? question.question : '',
            options: question ? question.options : [],
            selectedAnswer: subAnswer.selectedAnswer,
            correctAnswer: question ? question.correctAnswer : null,
            isCorrect: subAnswer.isCorrect,
            pointsEarned: subAnswer.pointsEarned,
            explanation: question ? question.explanation : '',
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            submission: {
                _id: submission._id,
                score: submission.score,
                passed: submission.passed,
                correctAnswers: submission.correctAnswers,
                totalQuestions: submission.totalQuestions,
                answers: detailedAnswers,
                submittedAt: submission.submittedAt,
            },
        },
    });
});

/**
 * @desc    Get module completion status
 * @route   GET /api/module-quizzes/:moduleId/completion
 * @access  Private
 */
export const getModuleCompletion = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;

    await syncModuleProgressFromVideos(userId, moduleId);

    const completion = await ModuleCompletion.findOne({ user: userId, module: moduleId }).populate(
        'module',
        'title order'
    );

    const activeQuiz = await getActiveQuizForModule(moduleId);
    const videoProgress = await countModuleVideoProgress(userId, moduleId);

    if (!completion) {
        res.status(200).json({
            status: 'success',
            data: {
                completion: {
                    videosCompleted: videoProgress.videosCompleted,
                    totalVideos: videoProgress.totalVideos,
                    quizPassed: !activeQuiz && videoProgress.allComplete,
                    isCompleted: !activeQuiz && videoProgress.allComplete,
                    hasQuiz: Boolean(activeQuiz),
                    videosComplete: videoProgress.allComplete,
                },
            },
        });
        return;
    }

    res.status(200).json({
        status: 'success',
        data: {
            completion: {
                videosCompleted: completion.videosCompleted,
                totalVideos: completion.totalVideos,
                quizPassed: completion.quizPassed,
                quizScore: completion.quizScore,
                isCompleted: completion.isCompleted,
                completedAt: completion.completedAt,
                hasQuiz: Boolean(activeQuiz),
                videosComplete: videoProgress.allComplete,
            },
        },
    });
});

/**
 * @desc    Check if module has an active quiz (no video gate)
 * @route   GET /api/module-quizzes/:moduleId/availability
 * @access  Private
 */
export const getModuleQuizAvailability = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;

    const gate = await resolveModuleQuizGate(userId, moduleId);

    res.status(200).json({
        status: 'success',
        data: gate,
    });
});
