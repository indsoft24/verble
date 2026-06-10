import Module from '../models/Module.js';
import ModuleQuiz from '../models/ModuleQuiz.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import ModuleQuizSubmission from '../models/ModuleQuizSubmission.js';
import Video from '../models/Video.js';
import VideoWatchProgress from '../models/VideoWatchProgress.js';
import { getLearningConfig } from './courseLearningConfigService.js';
import { getModuleVideos, PRIMARY_MODULE_CYCLE } from '../utils/videoAccessHelper.js';

export const getActiveQuizForModule = async (moduleId) =>
    ModuleQuiz.findOne({ module: moduleId, isActive: true });

export const hasPassingQuizSubmission = async (userId, moduleId) => {
    const count = await ModuleQuizSubmission.countDocuments({
        user: userId,
        module: moduleId,
        passed: true,
    });
    return count > 0;
};

/** Clear quizPassed when an active quiz exists but the user has no passing submission. */
export const reconcileQuizPassedWithSubmissions = async (userId, moduleId) => {
    const activeQuiz = await getActiveQuizForModule(moduleId);
    if (!activeQuiz) return null;

    const completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (!completion || !completion.quizPassed) return completion;

    const passedAttempt = await hasPassingQuizSubmission(userId, moduleId);
    if (passedAttempt) return completion;

    completion.quizPassed = false;
    completion.isCompleted = false;
    completion.completedAt = undefined;
    await completion.save();
    return completion;
};

/** Reset stale quizPassed for all users on a module when a quiz is created or reactivated. */
export const resetStaleQuizPassedForModule = async (moduleId) => {
    const completions = await ModuleCompletion.find({ module: moduleId, quizPassed: true }).lean();
    if (completions.length === 0) return 0;

    let resetCount = 0;
    for (const completion of completions) {
        const passedAttempt = await ModuleQuizSubmission.countDocuments({
            user: completion.user,
            module: moduleId,
            passed: true,
        });
        if (passedAttempt === 0) {
            await ModuleCompletion.updateOne(
                { _id: completion._id },
                { $set: { quizPassed: false, isCompleted: false }, $unset: { completedAt: 1 } }
            );
            resetCount += 1;
        }
    }
    return resetCount;
};

const ensureModuleCompletionRecord = async (userId, moduleId) => {
    const module = await Module.findById(moduleId).select('course order');
    if (!module) return null;

    let completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (!completion) {
        const totalVideos = await Video.countDocuments({ modules: moduleId, isPublished: true });
        completion = new ModuleCompletion({
            user: userId,
            module: moduleId,
            course: module.course,
            videosCompleted: 0,
            totalVideos,
            quizPassed: false,
            quizScore: 0,
            isCompleted: false,
            quizUnlocked: false,
            quizFailedAttempts: 0,
            quizExhausted: false,
        });
        await completion.save();
    }
    return completion;
};

export const areAllModuleVideosComplete = async (userId, moduleId) => {
    const videos = await getModuleVideos(moduleId);
    if (videos.length === 0) return true;

    const progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: PRIMARY_MODULE_CYCLE,
        isCompleted: true,
    }).lean();

    const progressMap = new Map(progress.map((p) => [p.video.toString(), p]));
    return videos.every((v) => {
        const p = progressMap.get(v._id.toString());
        return p && p.isCompleted;
    });
};

/** True when all published lessons were completed in completion cycle 0. */
export const hasCompletedFirstModuleCycle = async (userId, moduleId) => {
    const videos = await getModuleVideos(moduleId);
    if (videos.length === 0) return true;

    const progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: 0,
    }).lean();

    const progressMap = new Map(progress.map((p) => [p.video.toString(), p]));
    return videos.every((v) => {
        const p = progressMap.get(v._id.toString());
        return p && p.isCompleted;
    });
};

export const countModuleVideoProgress = async (userId, moduleId) => {
    const videos = await getModuleVideos(moduleId);
    const totalVideos = videos.length;
    if (totalVideos === 0) {
        return { videosCompleted: 0, totalVideos: 0, allComplete: true };
    }

    const progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: PRIMARY_MODULE_CYCLE,
        isCompleted: true,
    }).lean();

    const completedIds = new Set(progress.map((p) => p.video.toString()));
    const videosCompleted = videos.filter((v) => completedIds.has(v._id.toString())).length;
    return {
        videosCompleted,
        totalVideos,
        allComplete: videosCompleted >= totalVideos,
    };
};

/** Called when all lessons in the module are completed for the first time. */
export const onModuleFirstPassCompleted = async (userId, moduleId) => {
    const activeQuiz = await getActiveQuizForModule(moduleId);
    if (!activeQuiz) return null;

    const completion = await ensureModuleCompletionRecord(userId, moduleId);
    if (!completion || completion.quizExhausted) return completion;

    completion.quizUnlocked = true;
    completion.firstCycleCompleted = true;
    await completion.save();
    return completion;
};

/** @deprecated Use onModuleFirstPassCompleted */
export const onModuleCycleCompleted = onModuleFirstPassCompleted;

const persistFirstCycleQuizUnlock = async (completion, userId, moduleId) => {
    if (!completion || completion.quizExhausted) return completion;

    const firstCycleDone =
        Boolean(completion.firstCycleCompleted) || (await hasCompletedFirstModuleCycle(userId, moduleId));

    if (!firstCycleDone) return completion;

    let dirty = false;
    if (!completion.firstCycleCompleted) {
        completion.firstCycleCompleted = true;
        dirty = true;
    }
    if (!completion.quizUnlocked) {
        completion.quizUnlocked = true;
        dirty = true;
    }
    if (dirty) await completion.save();
    return completion;
};

/**
 * Resolve quiz gate for UI and API.
 */
export const resolveModuleQuizGate = async (userId, moduleId) => {
    const activeQuiz = await getActiveQuizForModule(moduleId);
    const videoProgress = await countModuleVideoProgress(userId, moduleId);
    const config = await getLearningConfig(userId);
    const maxQuizAttempts = config.maxQuizAttempts ?? 3;

    const hasQuiz = Boolean(activeQuiz);

    let completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (completion && hasQuiz) {
        completion = await persistFirstCycleQuizUnlock(completion, userId, moduleId);
        completion = (await reconcileQuizPassedWithSubmissions(userId, moduleId)) || completion;
    }

    let quizPassed = Boolean(completion?.quizPassed);
    if (hasQuiz && quizPassed) {
        quizPassed = await hasPassingQuizSubmission(userId, moduleId);
    }
    const quizUnlocked = Boolean(completion?.quizUnlocked);
    const firstCycleCompleted = Boolean(completion?.firstCycleCompleted);
    const quizExhausted = Boolean(completion?.quizExhausted);
    const quizFailedAttempts = completion?.quizFailedAttempts ?? 0;
    const isModuleComplete = Boolean(completion?.isCompleted);

    let quizState = 'locked';
    let canTakeQuiz = false;
    let message = '';

    if (!hasQuiz) {
        message = 'This module has no quiz.';
    } else if (quizExhausted && !quizPassed) {
        quizState = 'exhausted';
        message =
            'You have used all quiz attempts for this module. Please contact support to request a progress reset.';
    } else if (quizPassed) {
        quizState = 'passed';
        canTakeQuiz = quizUnlocked && !quizExhausted;
        message = 'You passed the module quiz. You can review lessons or retake the quiz.';
    } else if (quizUnlocked || firstCycleCompleted) {
        quizState = 'ready';
        canTakeQuiz = true;
        message = 'All lessons are complete. Take the module quiz when you are ready.';
    } else {
        quizState = 'locked';
        const remaining = videoProgress.totalVideos - videoProgress.videosCompleted;
        message =
            remaining > 0
                ? `Complete all ${videoProgress.totalVideos} lessons to unlock the module quiz (${videoProgress.videosCompleted}/${videoProgress.totalVideos} done).`
                : 'Complete all lessons to unlock the module quiz.';
    }

    return {
        hasQuiz,
        canTakeQuiz,
        videosComplete: videoProgress.allComplete,
        videosCompleted: videoProgress.videosCompleted,
        totalVideos: videoProgress.totalVideos,
        isModuleComplete,
        quizState,
        currentCycle: 0,
        maxCycles: 1,
        cyclesCompleted: videoProgress.allComplete ? 1 : 0,
        quizFailedAttempts,
        maxQuizAttempts,
        needsAdminReset: quizExhausted && !quizPassed,
        quizUnlocked,
        quizPassed,
        firstCycleCompleted,
        message,
    };
};

export const assertQuizUnlockedForTake = async (userId, moduleId) => {
    const gate = await resolveModuleQuizGate(userId, moduleId);
    if (!gate.hasQuiz) {
        const err = new Error('Quiz not found for this module');
        err.statusCode = 404;
        throw err;
    }
    if (gate.quizState === 'exhausted') {
        const err = new Error(gate.message);
        err.statusCode = 403;
        throw err;
    }
    if (!gate.canTakeQuiz) {
        const err = new Error(gate.message || 'Complete all lessons in this module before taking the quiz.');
        err.statusCode = 403;
        throw err;
    }
};

/**
 * After a failed quiz: increment attempts, optionally exhaust, reset all video progress.
 */
export const handleQuizSubmissionFail = async (userId, moduleId) => {
    const config = await getLearningConfig(userId);
    const maxAttempts = config.maxQuizAttempts ?? 3;
    const completion = await ensureModuleCompletionRecord(userId, moduleId);
    if (!completion) return { exhausted: false };

    completion.quizFailedAttempts = (completion.quizFailedAttempts || 0) + 1;
    completion.firstCycleCompleted = true;
    completion.quizUnlocked = true;
    completion.quizPassed = false;
    completion.isCompleted = false;
    completion.completedAt = undefined;

    let exhausted = false;
    if (completion.quizFailedAttempts >= maxAttempts) {
        completion.quizExhausted = true;
        exhausted = true;
    }

    await completion.save();
    await syncModuleProgressFromVideos(userId, moduleId);

    return {
        exhausted,
        attemptsRemaining: Math.max(0, maxAttempts - completion.quizFailedAttempts),
        retakeMessage: exhausted
            ? 'Maximum quiz attempts reached. Contact support to reset your module progress.'
            : 'Review the lessons and try the quiz again. Your lesson unlock progress is preserved.',
    };
};

/**
 * Upsert ModuleCompletion from video progress. If no active quiz and videos done, mark module complete.
 */
export const syncModuleProgressFromVideos = async (userId, moduleId) => {
    const module = await Module.findById(moduleId).select('course order');
    if (!module) return null;

    const { videosCompleted, totalVideos, allComplete } = await countModuleVideoProgress(userId, moduleId);
    const activeQuiz = await getActiveQuizForModule(moduleId);

    let completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (!completion) {
        completion = new ModuleCompletion({
            user: userId,
            module: moduleId,
            course: module.course,
            videosCompleted: 0,
            totalVideos,
            quizPassed: false,
            quizScore: 0,
            isCompleted: false,
            quizUnlocked: false,
            quizFailedAttempts: 0,
            quizExhausted: false,
        });
    }

    completion.videosCompleted = videosCompleted;
    completion.totalVideos = totalVideos;

    if (!activeQuiz && allComplete && totalVideos > 0) {
        completion.quizPassed = true;
        completion.isCompleted = true;
        completion.completedAt = completion.completedAt || new Date();
    } else if (activeQuiz) {
        const passedAttempt = completion.quizPassed
            ? await hasPassingQuizSubmission(userId, moduleId)
            : false;
        if (passedAttempt) {
            completion.isCompleted = true;
            completion.completedAt = completion.completedAt || new Date();
        } else {
            completion.quizPassed = false;
            completion.isCompleted = false;
            completion.completedAt = undefined;
        }
    }

    await completion.save();
    return completion;
};

/**
 * After a passing quiz attempt, finalize module completion (quiz pass unlocks module; extra cycles optional).
 */
export const finalizeModuleCompletion = async (userId, moduleId, quizScore = 0) => {
    const module = await Module.findById(moduleId).select('course order');
    if (!module) return null;

    const { videosCompleted, totalVideos } = await countModuleVideoProgress(userId, moduleId);

    let completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (!completion) {
        completion = new ModuleCompletion({
            user: userId,
            module: moduleId,
            course: module.course,
            videosCompleted,
            totalVideos,
        });
    }

    completion.videosCompleted = videosCompleted;
    completion.totalVideos = totalVideos;
    completion.quizPassed = true;
    completion.quizUnlocked = true;
    completion.quizScore = Math.max(completion.quizScore || 0, quizScore);
    completion.isCompleted = true;
    completion.completedAt = completion.completedAt || new Date();
    await completion.save();

    await ensureNextModuleCompletionStub(userId, module.course, module.order);
    return completion;
};

const ensureNextModuleCompletionStub = async (userId, courseId, currentModuleOrder) => {
    const nextModule = await Module.findOne({ course: courseId, order: currentModuleOrder + 1 });
    if (!nextModule) return;

    const currentModule = await Module.findOne({ course: courseId, order: currentModuleOrder });
    if (!currentModule) return;

    const currentDone = await ModuleCompletion.findOne({
        user: userId,
        module: currentModule._id,
        isCompleted: true,
    });
    if (!currentDone) return;

    const existing = await ModuleCompletion.findOne({ user: userId, module: nextModule._id });
    if (existing) return;

    const totalVideos = await Video.countDocuments({ modules: nextModule._id, isPublished: true });
    await ModuleCompletion.create({
        user: userId,
        module: nextModule._id,
        course: courseId,
        videosCompleted: 0,
        totalVideos,
        quizPassed: false,
        quizUnlocked: false,
        quizFailedAttempts: 0,
        quizExhausted: false,
    });
};

/** @deprecated Use assertQuizUnlockedForTake */
export const assertVideosCompleteForQuiz = async (userId, moduleId) => {
    await assertQuizUnlockedForTake(userId, moduleId);
};
