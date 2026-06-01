import AppLearningSettings from '../models/AppLearningSettings.js';
import UserLearningOverride from '../models/UserLearningOverride.js';

export const DEFAULT_LEARNING_CONFIG = {
    maxModuleCompletionCycles: 4,
    maxWatchesPerVideoPerCycle: 4,
    requireQuizToUnlockNextModule: true,
};

export async function getGlobalLearningSettings() {
    let doc = await AppLearningSettings.findOne();
    if (!doc) {
        doc = await AppLearningSettings.create(DEFAULT_LEARNING_CONFIG);
    }
    return {
        maxModuleCompletionCycles: doc.maxModuleCompletionCycles,
        maxWatchesPerVideoPerCycle: doc.maxWatchesPerVideoPerCycle,
        requireQuizToUnlockNextModule: doc.requireQuizToUnlockNextModule,
    };
}

export async function updateGlobalLearningSettings(updates, adminUserId) {
    let doc = await AppLearningSettings.findOne();
    if (!doc) {
        doc = new AppLearningSettings(DEFAULT_LEARNING_CONFIG);
    }
    if (typeof updates.maxModuleCompletionCycles === 'number') {
        doc.maxModuleCompletionCycles = updates.maxModuleCompletionCycles;
    }
    if (typeof updates.maxWatchesPerVideoPerCycle === 'number') {
        doc.maxWatchesPerVideoPerCycle = updates.maxWatchesPerVideoPerCycle;
    }
    if (typeof updates.requireQuizToUnlockNextModule === 'boolean') {
        doc.requireQuizToUnlockNextModule = updates.requireQuizToUnlockNextModule;
    }
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

    return {
        maxModuleCompletionCycles:
            override.maxModuleCompletionCycles ?? global.maxModuleCompletionCycles,
        maxWatchesPerVideoPerCycle:
            override.maxWatchesPerVideoPerCycle ?? global.maxWatchesPerVideoPerCycle,
        requireQuizToUnlockNextModule: global.requireQuizToUnlockNextModule,
    };
}

export async function upsertUserLearningOverride(userId, updates, adminUserId) {
    const doc = await UserLearningOverride.findOneAndUpdate(
        { user: userId },
        {
            ...(typeof updates.maxModuleCompletionCycles === 'number'
                ? { maxModuleCompletionCycles: updates.maxModuleCompletionCycles }
                : {}),
            ...(typeof updates.maxWatchesPerVideoPerCycle === 'number'
                ? { maxWatchesPerVideoPerCycle: updates.maxWatchesPerVideoPerCycle }
                : {}),
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
    await VideoWatchProgress.deleteMany({ user: userId, module: moduleId });
}

export async function resetUserCourseVideoProgress(userId, courseId) {
    const Module = (await import('../models/Module.js')).default;
    const VideoWatchProgress = (await import('../models/VideoWatchProgress.js')).default;
    const moduleIds = await Module.find({ course: courseId }).distinct('_id');
    if (moduleIds.length === 0) return;
    await VideoWatchProgress.deleteMany({ user: userId, module: { $in: moduleIds } });
}

/**
 * After a failed quiz attempt: clear current-cycle video progress so the learner must rewatch before retaking.
 */
export async function resetModuleVideosForQuizRetake(userId, moduleId) {
    const VideoWatchProgress = (await import('../models/VideoWatchProgress.js')).default;
    const ModuleCompletion = (await import('../models/ModuleCompletion.js')).default;
    const { getModuleCompletionCycle } = await import('../utils/videoAccessHelper.js');

    const currentCycle = await getModuleCompletionCycle(userId, moduleId);
    await VideoWatchProgress.deleteMany({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: currentCycle,
    });

    await ModuleCompletion.findOneAndUpdate(
        { user: userId, module: moduleId },
        {
            $set: {
                quizPassed: false,
                isCompleted: false,
            },
        },
        { upsert: false }
    );

    return { currentCycle };
}
