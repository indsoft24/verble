import asyncHandler from 'express-async-handler';
import FinalAssessmentSettings from '../models/FinalAssessmentSettings.js';
import FinalAssessmentQuestion from '../models/FinalAssessmentQuestion.js';
import FinalAssessmentAttempt from '../models/FinalAssessmentAttempt.js';
import Course from '../models/Course.js';
import {
    autosaveFinalAssessment,
    buildAttemptResult,
    getFinalAssessmentAvailability,
    getFinalAssessmentHistory,
    startOrResumeFinalAssessment,
    submitFinalAssessment,
} from '../services/finalAssessmentService.js';

const fail = (res, status, message) => {
    res.status(status);
    throw new Error(message);
};

const questionPayload = (body, userId) => ({
    externalId: typeof body.externalId === 'string' && body.externalId.trim() ? body.externalId.trim() : undefined,
    prompt: typeof body.prompt === 'string' ? body.prompt.trim() : body.prompt,
    options: Array.isArray(body.options) ? body.options.map((option) => String(option).trim()) : body.options,
    correctOption: body.correctOption,
    explanation: typeof body.explanation === 'string' ? body.explanation.trim() : body.explanation,
    points: body.points ?? 1,
    active: body.active ?? true,
    updatedBy: userId,
});

const bumpBankVersion = (courseId, userId) =>
    FinalAssessmentSettings.findOneAndUpdate(
        { course: courseId },
        { $inc: { bankVersion: 1 }, $set: { updatedBy: userId } },
        { new: true }
    );

export const getAvailability = asyncHandler(async (req, res) => {
    const data = await getFinalAssessmentAvailability(req.user._id, req.params.courseId);
    res.json({ status: 'success', data });
});

export const startOrResume = asyncHandler(async (req, res) => {
    const attempt = await startOrResumeFinalAssessment(req.user._id, req.params.courseId);
    res.json({ status: 'success', data: { attempt } });
});

export const autosave = asyncHandler(async (req, res) => {
    const data = await autosaveFinalAssessment(req.user._id, req.params.attemptId, req.body.answers);
    res.json({ status: 'success', data });
});

export const submit = asyncHandler(async (req, res) => {
    const result = await submitFinalAssessment(req.user._id, req.params.attemptId, req.body.answers);
    res.json({ status: 'success', data: { result } });
});

export const getResult = asyncHandler(async (req, res) => {
    const attempt = await FinalAssessmentAttempt.findOne({
        _id: req.params.attemptId,
        user: req.user._id,
        status: { $in: ['SUBMITTED', 'EXPIRED'] },
    }).select('+questions.correctOption +questions.explanation');
    if (!attempt) fail(res, 404, 'Result not found.');
    res.json({ status: 'success', data: { result: buildAttemptResult(attempt) } });
});

export const getHistory = asyncHandler(async (req, res) => {
    const attempts = await getFinalAssessmentHistory(req.user._id, req.params.courseId);
    res.json({ status: 'success', data: { attempts } });
});

export const getAdminSettings = asyncHandler(async (req, res) => {
    const settings = await FinalAssessmentSettings.findOne({ course: req.params.courseId });
    res.json({ status: 'success', data: { settings } });
});

export const upsertAdminSettings = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if (!course) fail(res, 404, 'Course not found.');
    const allowed = [
        'status',
        'questionCount',
        'passingScore',
        'timeLimitMinutes',
        'maxAttempts',
        'cooldownMinutes',
        'shuffleQuestions',
        'shuffleOptions',
        'reviewPolicy',
        'unlockAtCompletionPercent',
    ];
    const update = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
    const currentSettings = await FinalAssessmentSettings.findOne({ course: course._id });
    const resultingStatus = update.status ?? currentSettings?.status ?? 'DRAFT';
    if (resultingStatus === 'ACTIVE') {
        const requestedCount = update.questionCount ?? currentSettings?.questionCount ?? 80;
        const bankCount = await FinalAssessmentQuestion.countDocuments({ course: course._id, active: true });
        if (bankCount < requestedCount) fail(res, 400, `At least ${requestedCount} active questions are required.`);
    }
    const settings = await FinalAssessmentSettings.findOneAndUpdate(
        { course: course._id },
        { $set: { ...update, updatedBy: req.user._id } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ status: 'success', data: { settings } });
});

export const deleteAdminSettings = asyncHandler(async (req, res) => {
    const settings = await FinalAssessmentSettings.findOneAndDelete({ course: req.params.courseId });
    if (!settings) fail(res, 404, 'Final assessment settings not found.');
    res.json({ status: 'success', data: { deleted: true } });
});

export const listAdminQuestions = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit || '50', 10)));
    const query = { course: req.params.courseId };
    if (req.query.active === 'true') query.active = true;
    if (req.query.active === 'false') query.active = false;
    const [questions, total] = await Promise.all([
        FinalAssessmentQuestion.find(query).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
        FinalAssessmentQuestion.countDocuments(query),
    ]);
    res.json({
        status: 'success',
        data: { questions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
});

export const createAdminQuestion = asyncHandler(async (req, res) => {
    const question = await FinalAssessmentQuestion.create({
        ...questionPayload(req.body, req.user._id),
        course: req.params.courseId,
        createdBy: req.user._id,
    });
    await bumpBankVersion(req.params.courseId, req.user._id);
    res.status(201).json({ status: 'success', data: { question } });
});

export const updateAdminQuestion = asyncHandler(async (req, res) => {
    const question = await FinalAssessmentQuestion.findOne({
        _id: req.params.questionId,
        course: req.params.courseId,
    });
    if (!question) fail(res, 404, 'Question not found.');
    const update = questionPayload(req.body, req.user._id);
    Object.entries(update).forEach(([key, value]) => {
        if (value !== undefined) question[key] = value;
    });
    await question.save();
    await bumpBankVersion(req.params.courseId, req.user._id);
    res.json({ status: 'success', data: { question } });
});

export const deleteAdminQuestion = asyncHandler(async (req, res) => {
    const question = await FinalAssessmentQuestion.findOneAndDelete({
        _id: req.params.questionId,
        course: req.params.courseId,
    });
    if (!question) fail(res, 404, 'Question not found.');
    await bumpBankVersion(req.params.courseId, req.user._id);
    res.json({ status: 'success', data: { deleted: true } });
});

export const bulkImportQuestions = asyncHandler(async (req, res) => {
    const { mode = 'append', questions } = req.body;
    if (!['append', 'upsert', 'replace'].includes(mode)) fail(res, 400, 'mode must be append, upsert, or replace.');
    if (!Array.isArray(questions) || questions.length === 0 || questions.length > 5000) {
        fail(res, 400, 'questions must contain 1-5000 items.');
    }
    const normalized = questions.map((item) => questionPayload(item, req.user._id));
    normalized.forEach((item, index) => {
        if (!item.prompt || !Array.isArray(item.options) || item.options.length < 2) fail(res, 400, `Invalid question at index ${index}.`);
        if (!Number.isInteger(item.correctOption) || item.correctOption < 0 || item.correctOption >= item.options.length) {
            fail(res, 400, `Invalid correctOption at index ${index}.`);
        }
        if (mode === 'upsert' && !item.externalId) fail(res, 400, `externalId is required for upsert at index ${index}.`);
        const validationError = new FinalAssessmentQuestion({
            ...item,
            course: req.params.courseId,
            createdBy: req.user._id,
        }).validateSync();
        if (validationError) fail(res, 400, `Invalid question at index ${index}: ${validationError.message}`);
    });
    const externalIds = normalized.map((item) => item.externalId).filter(Boolean);
    if (new Set(externalIds).size !== externalIds.length) fail(res, 400, 'Duplicate externalId values in import payload.');
    if (mode === 'replace') {
        const settings = await FinalAssessmentSettings.findOne({ course: req.params.courseId, status: 'ACTIVE' }).lean();
        const activeCount = normalized.filter((item) => item.active !== false).length;
        if (settings && activeCount < settings.questionCount) {
            fail(res, 400, `Replace payload requires at least ${settings.questionCount} active questions.`);
        }
    }
    let created = 0;
    let updated = 0;
    let deleted = 0;
    if (mode === 'replace') {
        const deletion = await FinalAssessmentQuestion.deleteMany({ course: req.params.courseId });
        deleted = deletion.deletedCount;
    }
    if (mode === 'upsert') {
        const result = await FinalAssessmentQuestion.bulkWrite(
            normalized.map((item) => ({
                updateOne: {
                    filter: { course: req.params.courseId, externalId: item.externalId },
                    update: { $set: item, $setOnInsert: { createdBy: req.user._id } },
                    upsert: true,
                },
            })),
            { ordered: false }
        );
        created = result.upsertedCount;
        updated = result.modifiedCount;
    } else {
        const inserted = await FinalAssessmentQuestion.insertMany(
            normalized.map((item) => ({ ...item, course: req.params.courseId, createdBy: req.user._id })),
            { ordered: true }
        );
        created = inserted.length;
    }
    await bumpBankVersion(req.params.courseId, req.user._id);
    res.json({ status: 'success', data: { imported: normalized.length, created, updated, deleted, mode } });
});

export const exportQuestions = asyncHandler(async (req, res) => {
    const [questions, settings] = await Promise.all([
        FinalAssessmentQuestion.find({ course: req.params.courseId })
            .select('-__v -createdBy -updatedBy')
            .sort({ createdAt: 1 })
            .lean(),
        FinalAssessmentSettings.findOne({ course: req.params.courseId }).select('bankVersion').lean(),
    ]);
    res.setHeader('Content-Disposition', `attachment; filename="final-assessment-${req.params.courseId}.json"`);
    res.json({ courseId: req.params.courseId, bankVersion: settings?.bankVersion || 1, exportedAt: new Date(), questions });
});

export const reportAttempts = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit || '50', 10)));
    const query = { course: req.params.courseId };
    if (req.query.status) query.status = String(req.query.status).toUpperCase();
    if (req.query.passed === 'true') query.passed = true;
    if (req.query.passed === 'false') query.passed = false;
    const [attempts, total] = await Promise.all([
        FinalAssessmentAttempt.find(query)
            .select('-questions -answers -settingsSnapshot')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        FinalAssessmentAttempt.countDocuments(query),
    ]);
    res.json({
        status: 'success',
        data: { attempts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
});
