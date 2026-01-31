// src/controllers/moduleQuizController.js
import asyncHandler from 'express-async-handler';
import ModuleQuiz from '../models/ModuleQuiz.js';
import ModuleQuizSubmission from '../models/ModuleQuizSubmission.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import Module from '../models/Module.js';
import VideoWatchProgress from '../models/VideoWatchProgress.js';
import Video from '../models/Video.js';

/**
 * @desc    Get quiz for a module (without answers for students)
 * @route   GET /api/module-quizzes/:moduleId
 * @access  Private
 */
export const getModuleQuiz = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;

    const quiz = await ModuleQuiz.findOne({ module: moduleId, isActive: true })
        .populate('module', 'title order');

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found for this module');
    }

    // Remove correct answers for students
    const quizForStudent = {
        _id: quiz._id,
        module: quiz.module,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            points: q.points,
        })),
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
    };

    // Get user's previous submissions
    const previousSubmissions = await ModuleQuizSubmission.find({
        user: userId,
        module: moduleId,
        quiz: quiz._id,
    }).sort({ submittedAt: -1 }).limit(5);

    res.status(200).json({
        status: 'success',
        data: {
            quiz: quizForStudent,
            previousAttempts: previousSubmissions.length,
            bestScore: previousSubmissions.length > 0 
                ? Math.max(...previousSubmissions.map(s => s.score))
                : null,
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

    const quiz = await ModuleQuiz.findOne({ module: moduleId, isActive: true });
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found for this module');
    }

    // Validate answers
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
        res.status(400);
        throw new Error('Invalid answers format or count');
    }

    // Grade the quiz
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
    const score = totalPossiblePoints > 0 
        ? Math.round((totalPoints / totalPossiblePoints) * 100)
        : 0;
    const passed = score >= quiz.passingScore;

    // Save submission
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

    // Update module completion if passed
    if (passed) {
        await updateModuleCompletion(userId, moduleId);
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
                answers: gradedAnswers.map(a => ({
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

    // Include correct answers and explanations
    const quiz = submission.quiz;
    const detailedAnswers = submission.answers.map(subAnswer => {
        const question = quiz.questions.find(q => q._id.toString() === subAnswer.questionId.toString());
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
 * Helper function to update module completion
 */
const updateModuleCompletion = async (userId, moduleId) => {
    const module = await Module.findById(moduleId).populate('course');
    if (!module) return;

    // Get all videos for the module
    const videos = await Video.find({ modules: moduleId, isPublished: true });
    const totalVideos = videos.length;

    // Get completed videos
    const completedVideos = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        isCompleted: true,
    });
    const videosCompleted = completedVideos.length;

    // Get or create module completion
    let completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (!completion) {
        completion = await ModuleCompletion.create({
            user: userId,
            module: moduleId,
            course: module.course._id || module.course,
            videosCompleted: 0,
            totalVideos,
            quizPassed: false,
        });
    }

    // Update completion
    completion.videosCompleted = videosCompleted;
    completion.totalVideos = totalVideos;
    completion.quizPassed = true;

    // Check if module is fully completed (all videos + quiz passed)
    if (videosCompleted >= totalVideos && completion.quizPassed) {
        completion.isCompleted = true;
        completion.completedAt = new Date();
    }

    await completion.save();

    // Check if next module should be unlocked
    await checkAndUnlockNextModule(userId, module.course._id || module.course, module.order);
};

/**
 * Helper function to check and unlock next module
 */
const checkAndUnlockNextModule = async (userId, courseId, currentModuleOrder) => {
    // Get next module
    const nextModule = await Module.findOne({
        course: courseId,
        order: currentModuleOrder + 1,
    });

    if (!nextModule) return; // No next module

    // Check if current module is completed
    const currentCompletion = await ModuleCompletion.findOne({
        user: userId,
        module: (await Module.findOne({ course: courseId, order: currentModuleOrder }))._id,
        isCompleted: true,
    });

    if (currentCompletion) {
        // Next module is automatically unlocked (access control happens at video level)
        // We just need to ensure the completion record exists for tracking
        const nextCompletion = await ModuleCompletion.findOne({
            user: userId,
            module: nextModule._id,
        });

        if (!nextCompletion) {
            await ModuleCompletion.create({
                user: userId,
                module: nextModule._id,
                course: courseId,
                videosCompleted: 0,
                totalVideos: (await Video.find({ modules: nextModule._id, isPublished: true })).length,
                quizPassed: false,
            });
        }
    }
};

/**
 * @desc    Get module completion status
 * @route   GET /api/modules/:moduleId/completion
 * @access  Private
 */
export const getModuleCompletion = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;

    const completion = await ModuleCompletion.findOne({ user: userId, module: moduleId })
        .populate('module', 'title order');

    if (!completion) {
        // Return default status
        const module = await Module.findById(moduleId);
        const videos = await Video.find({ modules: moduleId, isPublished: true });
        res.status(200).json({
            status: 'success',
            data: {
                completion: {
                    videosCompleted: 0,
                    totalVideos: videos.length,
                    quizPassed: false,
                    isCompleted: false,
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
                isCompleted: completion.isCompleted,
                completedAt: completion.completedAt,
            },
        },
    });
});
