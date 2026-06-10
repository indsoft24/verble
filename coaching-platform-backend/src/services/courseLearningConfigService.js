import AppLearningSettings from '../models/AppLearningSettings.js';
import UserLearningOverride from '../models/UserLearningOverride.js';

export const DEFAULT_LEARNING_CONFIG = {
    maxModuleCompletionCycles: 1,
    maxWatchesPerVideoPerCycle: 4,
    maxWatchesPerVideo: 4,
    maxQuizAttempts: 3,
    requireQuizToUnlockNextModule: true,
};

function normalizeSettings(doc) {
    const maxWatchesPerVideo = doc.maxWatchesPerVideo ?? doc.maxWatchesPerVideoPerCycle ?? 4;
    return {
        maxModuleCompletionCycles: 1,
        maxWatchesPerVideoPerCycle: maxWatchesPerVideo,
        maxWatchesPerVideo,
        maxQuizAttempts: doc.maxQuizAttempts ?? 3,
        requireQuizToUnlockNextModule: doc.requireQuizToUnlockNextModule ?? true,
    };
}

export async function getGlobalLearningSettings() {
    let doc = await AppLearningSettings.findOne();
    if (!doc) {
        doc = await AppLearningSettings.create(DEFAULT_LEARNING_CONFIG);
    }
    return normalizeSettings(doc);
}

export async function updateGlobalLearningSettings(updates, adminUserId) {
    let doc = await AppLearningSettings.findOne();
    if (!doc) {
        doc = new AppLearningSettings(DEFAULT_LEARNING_CONFIG);
    }
    if (typeof updates.maxWatchesPerVideo === 'number') {
        doc.maxWatchesPerVideo = updates.maxWatchesPerVideo;
        doc.maxWatchesPerVideoPerCycle = updates.maxWatchesPerVideo;
    } else if (typeof updates.maxWatchesPerVideoPerCycle === 'number') {
        doc.maxWatchesPerVideoPerCycle = updates.maxWatchesPerVideoPerCycle;
        doc.maxWatchesPerVideo = updates.maxWatchesPerVideoPerCycle;
    }
    if (typeof updates.maxQuizAttempts === 'number') {
        doc.maxQuizAttempts = updates.maxQuizAttempts;
    }
    if (typeof updates.requireQuizToUnlockNextModule === 'boolean') {
        doc.requireQuizToUnlockNextModule = updates.requireQuizToUnlockNextModule;
    }
    doc.maxModuleCompletionCycles = 1;
    if (adminUserId) doc.updatedBy = adminUserId;
    await doc.save();
    return getGlobalLearningSettings();
}

/**
 * Effective limits for a user (global + optional per-user override).
 */
export async function getLearningConfig(userId = null) {
    const global = await getGlobalLearningSettings();
    if (!userId) return global;

    const override = await UserLearningOverride.findOne({ user: userId }).lean();
    if (!override) return global;

    const maxWatches =
        override.maxWatchesPerVideo ??
        override.maxWatchesPerVideoPerCycle ??
        global.maxWatchesPerVideo;

    return {
        ...global,
        maxWatchesPerVideo: maxWatches,
        maxWatchesPerVideoPerCycle: maxWatches,
        maxQuizAttempts: override.maxQuizAttempts ?? global.maxQuizAttempts,
    };
}

export async function upsertUserLearningOverride(userId, updates, adminUserId) {
    const doc = await UserLearningOverride.findOneAndUpdate(
        { user: userId },
        {
            ...(typeof updates.maxWatchesPerVideo === 'number'
                ? { maxWatchesPerVideo: updates.maxWatchesPerVideo, maxWatchesPerVideoPerCycle: updates.maxWatchesPerVideo }
                : {}),
            ...(typeof updates.maxWatchesPerVideoPerCycle === 'number'
                ? { maxWatchesPerVideoPerCycle: updates.maxWatchesPerVideoPerCycle, maxWatchesPerVideo: updates.maxWatchesPerVideoPerCycle }
                : {}),
            ...(typeof updates.maxQuizAttempts === 'number' ? { maxQuizAttempts: updates.maxQuizAttempts } : {}),
            ...(updates.resetProgressAt ? { resetProgressAt: updates.resetProgressAt } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
            updatedBy: adminUserId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return doc;
}

export async function resetUserModuleVideoProgress(userId, moduleId) {
    const VideoWatchProgress = (await import('../models/VideoWatchProgress.js')).default;
    const ModuleCompletion = (await import('../models/ModuleCompletion.js')).default;
    await VideoWatchProgress.deleteMany({ user: userId, module: moduleId });
    await ModuleCompletion.findOneAndUpdate(
        { user: userId, module: moduleId },
        {
            $set: {
                quizUnlocked: false,
                quizFailedAttempts: 0,
                quizExhausted: false,
                quizPassed: false,
                isCompleted: false,
                videosCompleted: 0,
                firstCycleCompleted: false,
            },
            $unset: { completedAt: 1 },
        },
        { upsert: false }
    );
}

export async function resetUserCourseVideoProgress(userId, courseId) {
    const Module = (await import('../models/Module.js')).default;
    const VideoWatchProgress = (await import('../models/VideoWatchProgress.js')).default;
    const moduleIds = await Module.find({ course: courseId }).distinct('_id');
    if (moduleIds.length === 0) return;
    await VideoWatchProgress.deleteMany({ user: userId, module: { $in: moduleIds } });
}

/** Admin-only: clear module video progress for a retake reset. */
export async function resetModuleVideosForQuizRetake(userId, moduleId) {
    const VideoWatchProgress = (await import('../models/VideoWatchProgress.js')).default;
    const ModuleCompletion = (await import('../models/ModuleCompletion.js')).default;

    await VideoWatchProgress.deleteMany({ user: userId, module: moduleId });

    await ModuleCompletion.findOneAndUpdate(
        { user: userId, module: moduleId },
        {
            $set: {
                quizPassed: false,
                isCompleted: false,
                quizUnlocked: false,
                firstCycleCompleted: false,
                quizFailedAttempts: 0,
                quizExhausted: false,
            },
            $unset: { completedAt: 1 },
        },
        { upsert: false }
    );

    return { currentCycle: 0 };
}
