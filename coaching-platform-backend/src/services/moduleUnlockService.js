import Module from '../models/Module.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import { getLearningConfig } from './courseLearningConfigService.js';
import { getActiveQuizForModule } from './moduleQuizAccessService.js';

export async function getOrderedModulesForCourse(courseId) {
    return Module.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).lean();
}

/**
 * First module is always unlocked. Later modules require previous module completed + quiz passed (if quiz exists).
 */
export async function isModuleUnlockedForUser(userId, moduleId) {
    const module = await Module.findById(moduleId).select('order course title').lean();
    if (!module) {
        return { unlocked: false, reason: 'Module not found.' };
    }

    const modules = await getOrderedModulesForCourse(module.course);
    const index = modules.findIndex((m) => m._id.toString() === moduleId.toString());
    if (index <= 0) {
        return { unlocked: true, reason: null };
    }

    const config = await getLearningConfig(userId);
    if (!config.requireQuizToUnlockNextModule) {
        return { unlocked: true, reason: null };
    }

    const previousModule = modules[index - 1];
    const prevCompletion = await ModuleCompletion.findOne({
        user: userId,
        module: previousModule._id,
    }).lean();

    if (!prevCompletion?.isCompleted) {
        return {
            unlocked: false,
            reason: `Complete Module ${index}: “${previousModule.title}” (videos + quiz) to unlock this module.`,
            previousModuleId: previousModule._id.toString(),
        };
    }

    const prevQuiz = await getActiveQuizForModule(previousModule._id);
    if (prevQuiz && !prevCompletion.quizPassed) {
        return {
            unlocked: false,
            reason: `Pass the quiz for “${previousModule.title}” to unlock this module.`,
            previousModuleId: previousModule._id.toString(),
        };
    }

    return { unlocked: true, reason: null };
}

export async function enrichModulesWithUnlockStatus(userId, courseId, modules) {
    const enriched = [];
    for (const mod of modules) {
        const modId = mod._id?.toString?.() || mod._id;
        const { unlocked, reason, previousModuleId } = await isModuleUnlockedForUser(userId, modId);
        enriched.push({
            ...mod,
            isModuleLocked: !unlocked,
            moduleLockReason: reason,
            previousModuleId: previousModuleId || null,
        });
    }
    return enriched;
}

export function buildVideoLockFlags(hasSubscriptionAccess, sequentialAccess) {
    if (!hasSubscriptionAccess) {
        return {
            canAccess: false,
            isLocked: true,
            lockReason: 'subscription',
            accessReason: 'Subscription required',
            watchCount: 0,
            remainingWatches: 0,
        };
    }

    if (!sequentialAccess.canAccess) {
        const isWatchLimit = /maximum watch limit/i.test(sequentialAccess.reason || '');
        return {
            canAccess: false,
            isLocked: true,
            lockReason: isWatchLimit ? 'watch_limit' : 'sequence',
            accessReason: sequentialAccess.reason,
            watchCount: sequentialAccess.watchCount ?? 0,
            remainingWatches: sequentialAccess.remainingWatches ?? 0,
        };
    }

    return {
        canAccess: true,
        isLocked: false,
        lockReason: null,
        accessReason: sequentialAccess.reason || 'Access granted',
        watchCount: sequentialAccess.watchCount ?? 0,
        remainingWatches: sequentialAccess.remainingWatches ?? 0,
    };
}
