import crypto from 'crypto';
import FinalAssessmentSettings from '../models/FinalAssessmentSettings.js';
import FinalAssessmentQuestion from '../models/FinalAssessmentQuestion.js';
import FinalAssessmentAttempt from '../models/FinalAssessmentAttempt.js';
import Module from '../models/Module.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { getActiveUserTierLevel, canAccessRequiredPlansByTier } from '../utils/subscriptionTierAccess.js';
import { tryAutomaticCourseCertificate } from './learningCertificateService.js';

export const secureShuffle = (items) => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = crypto.randomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const snapshotQuestion = (question, shuffleOptions) => {
    const indexed = question.options.map((text, index) => ({ text, correct: index === question.correctOption }));
    const options = shuffleOptions ? secureShuffle(indexed) : indexed;
    return {
        sourceQuestion: question._id,
        prompt: question.prompt,
        options: options.map((item) => item.text),
        correctOption: options.findIndex((item) => item.correct),
        explanation: question.explanation,
        points: question.points,
    };
};

export const gradeAttemptSnapshot = (questions, answers) => {
    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;
    questions.forEach((question, index) => {
        totalPoints += question.points;
        if (answers[index] === question.correctOption) {
            earnedPoints += question.points;
            correctCount += 1;
        }
    });
    return {
        earnedPoints,
        totalPoints,
        correctCount,
        score: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0,
    };
};

const completionStats = async (userId, courseId) => {
    const moduleIds = await Module.find({ course: courseId }).distinct('_id');
    const completed = moduleIds.length
        ? await ModuleCompletion.countDocuments({
              user: userId,
              course: courseId,
              module: { $in: moduleIds },
              isCompleted: true,
          })
        : 0;
    return {
        totalModules: moduleIds.length,
        completedModules: completed,
        completionPercent: moduleIds.length ? Math.round((completed / moduleIds.length) * 100) : 0,
    };
};

const assertCourseSubscriptionAccess = async (userId, courseId) => {
    const moduleIds = await Module.find({ course: courseId }).distinct('_id');
    const [user, restrictedVideos] = await Promise.all([
        User.findById(userId).select('subscriptions').lean(),
        Video.find({ modules: { $in: moduleIds }, 'requiredPlans.0': { $exists: true } })
            .populate('requiredPlans', 'name')
            .select('requiredPlans')
            .lean(),
    ]);
    if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
    const tier = getActiveUserTierLevel(user.subscriptions);
    const hasAccess = restrictedVideos.every((video) =>
        canAccessRequiredPlansByTier({ requiredPlans: video.requiredPlans, userTierLevel: tier })
    );
    if (!hasAccess) {
        throw Object.assign(new Error('An active course subscription is required.'), { statusCode: 403 });
    }
};

const expireAttemptIfNeeded = async (attempt) => {
    if (attempt?.status === 'IN_PROGRESS' && attempt.expiresAt <= new Date()) {
        attempt.status = 'EXPIRED';
        attempt.submittedAt = attempt.expiresAt;
        attempt.score = 0;
        attempt.passed = false;
        await attempt.save();
    }
    return attempt;
};

export const getFinalAssessmentAvailability = async (userId, courseId) => {
    const [course, settings, completion, attempts, activeQuestionCount] = await Promise.all([
        Course.findById(courseId).select('title isPublished').lean(),
        FinalAssessmentSettings.findOne({ course: courseId }).lean(),
        completionStats(userId, courseId),
        FinalAssessmentAttempt.find({ user: userId, course: courseId })
            .sort({ attemptNumber: -1 })
            .select('attemptNumber status score passed startedAt submittedAt expiresAt')
            .lean(),
        FinalAssessmentQuestion.countDocuments({ course: courseId, active: true }),
    ]);
    if (!course || !course.isPublished) throw Object.assign(new Error('Course not found or unavailable.'), { statusCode: 404 });
    await assertCourseSubscriptionAccess(userId, courseId);
    const current = attempts.find((attempt) => attempt.status === 'IN_PROGRESS' && attempt.expiresAt > new Date());
    const completedAttempts = attempts.filter((attempt) => attempt.status !== 'IN_PROGRESS');
    const last = completedAttempts[0];
    const cooldownUntil =
        last && settings?.cooldownMinutes
            ? new Date(new Date(last.submittedAt || last.expiresAt).getTime() + settings.cooldownMinutes * 60000)
            : null;
    const reasons = [];
    if (!settings || settings.status !== 'ACTIVE') reasons.push('Final assessment is not active.');
    if (settings && activeQuestionCount < settings.questionCount) reasons.push('The question bank is not ready.');
    if (settings && completion.completionPercent < settings.unlockAtCompletionPercent) {
        reasons.push(`Complete ${settings.unlockAtCompletionPercent}% of the course to unlock the assessment.`);
    }
    if (settings && completedAttempts.length >= settings.maxAttempts && !current) reasons.push('Maximum attempts reached.');
    if (cooldownUntil && cooldownUntil > new Date() && !current) reasons.push('Attempt cooldown is active.');
    return {
        course,
        settings,
        completion,
        activeQuestionCount,
        attemptsUsed: completedAttempts.length,
        attemptsRemaining: settings ? Math.max(0, settings.maxAttempts - completedAttempts.length) : 0,
        cooldownUntil,
        resumableAttemptId: current?._id || null,
        available: Boolean(current) || reasons.length === 0,
        reasons,
    };
};

const learnerAttemptView = (attempt) => ({
    _id: attempt._id,
    course: attempt.course,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    bankVersion: attempt.bankVersion,
    questions: attempt.questions.map((question) => ({
        _id: question._id,
        sourceQuestion: question.sourceQuestion,
        prompt: question.prompt,
        options: question.options,
        points: question.points,
    })),
    answers: attempt.answers,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    serverTime: new Date(),
});

export const startOrResumeFinalAssessment = async (userId, courseId) => {
    let current = await FinalAssessmentAttempt.findOne({ user: userId, course: courseId, status: 'IN_PROGRESS' })
        .sort({ attemptNumber: -1 })
        .select('+questions.correctOption +questions.explanation');
    current = await expireAttemptIfNeeded(current);
    if (current?.status === 'IN_PROGRESS') return learnerAttemptView(current);

    const availability = await getFinalAssessmentAvailability(userId, courseId);
    if (!availability.available) {
        throw Object.assign(new Error(availability.reasons[0] || 'Assessment is unavailable.'), { statusCode: 403 });
    }
    const settings = await FinalAssessmentSettings.findOne({ course: courseId, status: 'ACTIVE' });
    const questions = await FinalAssessmentQuestion.find({ course: courseId, active: true }).lean();
    if (questions.length < settings.questionCount) throw new Error('The active question bank is too small.');
    const selected = secureShuffle(questions).slice(0, settings.questionCount);
    const snapshots = selected.map((question) => snapshotQuestion(question, settings.shuffleOptions));
    const ordered = settings.shuffleQuestions ? secureShuffle(snapshots) : snapshots;
    const latest = await FinalAssessmentAttempt.findOne({ user: userId, course: courseId })
        .sort({ attemptNumber: -1 })
        .select('attemptNumber')
        .lean();
    const attemptNumber = (latest?.attemptNumber || 0) + 1;
    const startedAt = new Date();
    try {
        const attempt = await FinalAssessmentAttempt.create({
            user: userId,
            course: courseId,
            settings: settings._id,
            attemptNumber,
            bankVersion: settings.bankVersion,
            settingsSnapshot: {
                passingScore: settings.passingScore,
                timeLimitMinutes: settings.timeLimitMinutes,
                reviewPolicy: settings.reviewPolicy,
                questionCount: settings.questionCount,
            },
            questions: ordered,
            answers: Array(ordered.length).fill(-1),
            startedAt,
            expiresAt: new Date(startedAt.getTime() + settings.timeLimitMinutes * 60000),
        });
        return learnerAttemptView(attempt);
    } catch (error) {
        if (error?.code === 11000) {
            const raced = await FinalAssessmentAttempt.findOne({ user: userId, course: courseId, status: 'IN_PROGRESS' });
            if (raced) return learnerAttemptView(raced);
        }
        throw error;
    }
};

const validateAnswers = (attempt, answers, partial) => {
    if (!Array.isArray(answers) || (!partial && answers.length !== attempt.questions.length)) {
        throw Object.assign(new Error('Invalid answers payload.'), { statusCode: 400 });
    }
    const normalized = partial ? [...attempt.answers] : Array(attempt.questions.length).fill(-1);
    const indexedPartial = partial && answers.some((answer) => typeof answer === 'object' && answer !== null);
    if (partial && !indexedPartial && answers.length !== attempt.questions.length) {
        throw Object.assign(new Error('Full autosave payload must include every question.'), { statusCode: 400 });
    }
    answers.forEach((answer, requestIndex) => {
        const index = indexedPartial ? Number(answer.questionIndex) : requestIndex;
        const selectedOption = indexedPartial ? Number(answer.selectedOption) : Number(answer);
        if (!Number.isInteger(index) || index < 0 || index >= attempt.questions.length) {
            throw Object.assign(new Error('Invalid question index.'), { statusCode: 400 });
        }
        if (!Number.isInteger(selectedOption) || selectedOption < -1 || selectedOption >= attempt.questions[index].options.length) {
            throw Object.assign(new Error(`Invalid option for question ${index + 1}.`), { statusCode: 400 });
        }
        normalized[index] = selectedOption;
    });
    return normalized;
};

export const autosaveFinalAssessment = async (userId, attemptId, answers) => {
    const attempt = await FinalAssessmentAttempt.findOne({ _id: attemptId, user: userId, status: 'IN_PROGRESS' });
    if (!attempt) throw Object.assign(new Error('Active attempt not found.'), { statusCode: 404 });
    await expireAttemptIfNeeded(attempt);
    if (attempt.status !== 'IN_PROGRESS') throw Object.assign(new Error('Assessment time has expired.'), { statusCode: 409 });
    attempt.answers = validateAnswers(attempt, answers, true);
    attempt.lastSavedAt = new Date();
    await attempt.save();
    return { savedAt: attempt.lastSavedAt, expiresAt: attempt.expiresAt };
};

export const submitFinalAssessment = async (userId, attemptId, answers) => {
    const attempt = await FinalAssessmentAttempt.findOne({ _id: attemptId, user: userId })
        .select('+questions.correctOption +questions.explanation');
    if (!attempt) throw Object.assign(new Error('Attempt not found.'), { statusCode: 404 });
    if (attempt.status !== 'IN_PROGRESS') return buildAttemptResult(attempt);
    if (attempt.expiresAt <= new Date()) {
        await expireAttemptIfNeeded(attempt);
        return buildAttemptResult(attempt);
    }
    attempt.answers = validateAnswers(attempt, answers, false);
    const grade = gradeAttemptSnapshot(attempt.questions, attempt.answers);
    attempt.status = 'SUBMITTED';
    attempt.submittedAt = new Date();
    attempt.score = grade.score;
    attempt.passed = grade.score >= attempt.settingsSnapshot.passingScore;
    attempt.correctCount = grade.correctCount;
    attempt.totalPoints = grade.totalPoints;
    attempt.earnedPoints = grade.earnedPoints;
    await attempt.save();
    if (attempt.passed) await tryAutomaticCourseCertificate(userId, attempt.course);
    return buildAttemptResult(attempt);
};

export const buildAttemptResult = (attempt) => {
    const result = {
        _id: attempt._id,
        attemptId: attempt._id,
        course: attempt.course,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        score: attempt.score,
        passed: attempt.passed,
        correctCount: attempt.correctCount,
        questionCount: attempt.questions.length,
        submittedAt: attempt.submittedAt,
        certificateEligible: Boolean(attempt.passed),
    };
    if (attempt.status === 'SUBMITTED' && attempt.settingsSnapshot.reviewPolicy === 'FULL_AFTER_SUBMIT') {
        result.review = attempt.questions.map((question, index) => ({
            questionId: question.sourceQuestion,
            prompt: question.prompt,
            options: question.options,
            selectedOption: attempt.answers[index],
            correctOption: question.correctOption,
            correct: attempt.answers[index] === question.correctOption,
            explanation: question.explanation,
        }));
    }
    return result;
};

export const getFinalAssessmentHistory = async (userId, courseId) => {
    const attempts = await FinalAssessmentAttempt.find({ user: userId, course: courseId })
        .sort({ attemptNumber: -1 })
        .select('attemptNumber status score passed startedAt submittedAt expiresAt bankVersion')
        .lean();
    return attempts;
};
