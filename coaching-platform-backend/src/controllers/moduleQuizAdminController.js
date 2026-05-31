import asyncHandler from 'express-async-handler';
import ModuleQuiz from '../models/ModuleQuiz.js';
import ModuleQuizSubmission from '../models/ModuleQuizSubmission.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';

const validateQuestions = (questions) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('At least one question is required.');
    }
    questions.forEach((q, i) => {
        if (!q.question?.trim()) throw new Error(`Question ${i + 1} text is required.`);
        if (!Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`Question ${i + 1} needs at least 2 options.`);
        }
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
            throw new Error(`Question ${i + 1} has an invalid correct answer index.`);
        }
    });
};

export const listModuleQuizzesAdmin = asyncHandler(async (req, res) => {
    const { courseId, moduleId } = req.query;
    const filter = {};
    if (moduleId) filter.module = moduleId;
    if (courseId) {
        const modules = await Module.find({ course: courseId }).select('_id');
        filter.module = { $in: modules.map((m) => m._id) };
    }

    const quizzes = await ModuleQuiz.find(filter)
        .populate({ path: 'module', select: 'title order course', populate: { path: 'course', select: 'title' } })
        .sort({ updatedAt: -1 });

    res.status(200).json({ status: 'success', data: { quizzes } });
});

export const getModuleQuizByModuleAdmin = asyncHandler(async (req, res) => {
    const quiz = await ModuleQuiz.findOne({ module: req.params.moduleId }).populate({
        path: 'module',
        select: 'title order course',
        populate: { path: 'course', select: 'title' },
    });
    res.status(200).json({ status: 'success', data: { quiz: quiz || null } });
});

export const createModuleQuizAdmin = asyncHandler(async (req, res) => {
    const { moduleId, title, description, questions, passingScore, timeLimit, isActive } = req.body;
    if (!moduleId || !title?.trim()) {
        res.status(400);
        throw new Error('moduleId and title are required.');
    }
    const module = await Module.findById(moduleId);
    if (!module) {
        res.status(404);
        throw new Error('Module not found.');
    }
    const existing = await ModuleQuiz.findOne({ module: moduleId });
    if (existing) {
        res.status(409);
        throw new Error('This module already has a quiz. Edit the existing quiz instead.');
    }
    validateQuestions(questions);

    const quiz = await ModuleQuiz.create({
        module: moduleId,
        title: title.trim(),
        description: description?.trim() || '',
        questions,
        passingScore: passingScore ?? 70,
        timeLimit: timeLimit ?? 0,
        isActive: isActive !== false,
        createdBy: req.user._id,
    });

    res.status(201).json({ status: 'success', data: { quiz } });
});

export const updateModuleQuizAdmin = asyncHandler(async (req, res) => {
    const quiz = await ModuleQuiz.findById(req.params.quizId);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found.');
    }
    const { title, description, questions, passingScore, timeLimit, isActive } = req.body;
    if (typeof title === 'string') quiz.title = title.trim();
    if (typeof description === 'string') quiz.description = description.trim();
    if (questions) {
        validateQuestions(questions);
        quiz.questions = questions;
    }
    if (typeof passingScore === 'number') quiz.passingScore = passingScore;
    if (typeof timeLimit === 'number') quiz.timeLimit = timeLimit;
    if (typeof isActive === 'boolean') quiz.isActive = isActive;
    await quiz.save();
    res.status(200).json({ status: 'success', data: { quiz } });
});

/** Upsert quiz for a module from validated bulk import payload (frontend parses CSV). */
export const importModuleQuizAdmin = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const { title, description, questions, passingScore, timeLimit, isActive } = req.body;

    if (!moduleId) {
        res.status(400);
        throw new Error('moduleId is required.');
    }
    if (!title?.trim()) {
        res.status(400);
        throw new Error('Quiz title is required.');
    }

    const module = await Module.findById(moduleId);
    if (!module) {
        res.status(404);
        throw new Error('Module not found.');
    }

    validateQuestions(questions);

    const existing = await ModuleQuiz.findOne({ module: moduleId });
    if (existing) {
        existing.title = title.trim();
        existing.description = description?.trim() || '';
        existing.questions = questions;
        existing.passingScore = passingScore ?? 70;
        existing.timeLimit = timeLimit ?? 0;
        existing.isActive = isActive !== false;
        await existing.save();
        return res.status(200).json({ status: 'success', data: { quiz: existing, created: false } });
    }

    const quiz = await ModuleQuiz.create({
        module: moduleId,
        title: title.trim(),
        description: description?.trim() || '',
        questions,
        passingScore: passingScore ?? 70,
        timeLimit: timeLimit ?? 0,
        isActive: isActive !== false,
        createdBy: req.user._id,
    });

    res.status(201).json({ status: 'success', data: { quiz, created: true } });
});

export const deleteModuleQuizAdmin = asyncHandler(async (req, res) => {
    const quiz = await ModuleQuiz.findById(req.params.quizId);
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found.');
    }
    quiz.isActive = false;
    await quiz.save();
    res.status(200).json({ status: 'success', message: 'Quiz deactivated.' });
});

export const listCoursesForQuizAdmin = asyncHandler(async (_req, res) => {
    const courses = await Course.find().select('title isPublished').sort({ title: 1 });
    res.status(200).json({ status: 'success', data: { courses } });
});

export const listModuleQuizSubmissionsAdmin = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.moduleId) filter.module = req.query.moduleId;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.passed === 'true') filter.passed = true;
    if (req.query.passed === 'false') filter.passed = false;
    if (req.query.courseId) {
        const modules = await Module.find({ course: req.query.courseId }).select('_id');
        filter.module = { $in: modules.map((m) => m._id) };
    }

    const [submissions, total] = await Promise.all([
        ModuleQuizSubmission.find(filter)
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email')
            .populate({ path: 'module', select: 'title course', populate: { path: 'course', select: 'title' } })
            .populate('quiz', 'title passingScore'),
        ModuleQuizSubmission.countDocuments(filter),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            submissions,
            pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
        },
    });
});

export const getModuleQuizSubmissionAdmin = asyncHandler(async (req, res) => {
    const submission = await ModuleQuizSubmission.findById(req.params.submissionId)
        .populate('user', 'name email')
        .populate({ path: 'module', select: 'title course', populate: { path: 'course', select: 'title' } })
        .populate('quiz', 'title questions passingScore');

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found.');
    }

    const quiz = submission.quiz;
    const detailedAnswers = submission.answers.map((subAnswer) => {
        const question = quiz.questions.find(
            (q) => q._id.toString() === subAnswer.questionId.toString()
        );
        return {
            questionId: subAnswer.questionId,
            question: question?.question || '',
            options: question?.options || [],
            selectedAnswer: subAnswer.selectedAnswer,
            correctAnswer: question?.correctAnswer ?? null,
            isCorrect: subAnswer.isCorrect,
            explanation: question?.explanation || '',
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            submission: {
                ...submission.toObject(),
                detailedAnswers,
            },
        },
    });
});

export const updateModuleQuizSubmissionNotesAdmin = asyncHandler(async (req, res) => {
    const submission = await ModuleQuizSubmission.findById(req.params.submissionId);
    if (!submission) {
        res.status(404);
        throw new Error('Submission not found.');
    }
    if (typeof req.body.adminNotes === 'string') {
        submission.adminNotes = req.body.adminNotes.trim();
    }
    await submission.save();
    res.status(200).json({ status: 'success', data: { submission } });
});
