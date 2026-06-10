// src/utils/videoAccessHelper.js
import VideoWatchProgress from '../models/VideoWatchProgress.js';
import Video from '../models/Video.js';
import { getLearningConfig } from '../services/courseLearningConfigService.js';

/** Single progress pass — cumulative unlock uses cycle 0 only. */
export const PRIMARY_MODULE_CYCLE = 0;

export function resolveMaxWatchesPerVideo(config) {
    return config?.maxWatchesPerVideo ?? config?.maxWatchesPerVideoPerCycle ?? 4;
}

/** @deprecated Cycles removed; always 0 for API compatibility. */
export const getModuleCompletionCycle = async () => PRIMARY_MODULE_CYCLE;

async function getCycleWatchCount(userId, moduleId, videoId, cycle = PRIMARY_MODULE_CYCLE) {
    const p = await VideoWatchProgress.findOne({
        user: userId,
        module: moduleId,
        video: videoId,
        moduleCompletionCycle: cycle,
    }).lean();
    return p?.watchCount || 0;
}

/** Lifetime watch count for a lesson (sums all cycle rows for legacy data). */
export const getTotalWatchCount = async (userId, moduleId, videoId) => {
    const rows = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        video: videoId,
    }).lean();
    return rows.reduce((sum, row) => sum + (row.watchCount || 0), 0);
};

export const getVideoSetIndex = (videoOrder, minOrder = 0) => videoOrder - minOrder;

export const sortModuleVideosForSequence = (videos) =>
    [...videos].sort((a, b) => {
        const oa = a.order ?? 0;
        const ob = b.order ?? 0;
        if (oa !== ob) return oa - ob;
        const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (ca !== cb) return ca - cb;
        return String(a._id).localeCompare(String(b._id));
    });

export const getVideoStepIndex = (video, sortedVideos) => {
    const idx = sortedVideos.findIndex((v) => v._id.toString() === video._id.toString());
    return idx >= 0 ? idx : 0;
};

export const getModuleVideos = async (moduleId) =>
    Video.find({ modules: moduleId, isPublished: true }).sort({ order: 'asc' }).lean();

/**
 * Highest step index the user may access (cumulative).
 * Lesson 0 always unlocked; completing step N unlocks steps 0..N+1.
 */
export const getCurrentUnlockedSetIndex = async (userId, moduleId, moduleCompletionCycle = PRIMARY_MODULE_CYCLE) => {
    const videos = sortModuleVideosForSequence(await getModuleVideos(moduleId));
    if (videos.length === 0) return -1;

    const watchProgress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: moduleCompletionCycle,
    }).lean();

    const progressMap = new Map();
    watchProgress.forEach((progress) => {
        progressMap.set(progress.video.toString(), progress);
    });

    let highestCompletedStep = -1;
    for (let step = 0; step < videos.length; step++) {
        const video = videos[step];
        const progress = progressMap.get(video._id.toString());
        if (progress && progress.isCompleted) {
            highestCompletedStep = step;
        } else {
            break;
        }
    }

    return Math.min(Math.max(0, highestCompletedStep + 1), videos.length - 1);
};

/** Cumulative unlock: all steps up to unlockedSetIndex are accessible. */
export const isVideoInUnlockedSet = (video, unlockedSetIndex, sortedVideos) => {
    const videoStepIndex = getVideoStepIndex(video, sortedVideos);
    return videoStepIndex <= unlockedSetIndex;
};

function buildAccessPayload(base, config) {
    const maxWatches = resolveMaxWatchesPerVideo(config);
    return {
        ...base,
        maxWatchesPerVideo: maxWatches,
        maxWatchesPerCycle: maxWatches,
        maxModuleCycles: 1,
        completionCycle: PRIMARY_MODULE_CYCLE,
    };
}

export const checkSequentialVideoAccess = async (
    userId,
    video,
    moduleId,
    preCalculatedUnlockedSetIndex = null,
    _preCalculatedCompletionCycle = null
) => {
    const config = await getLearningConfig(userId);
    const maxWatches = resolveMaxWatchesPerVideo(config);

    if (!userId || !video || !moduleId) {
        return buildAccessPayload(
            {
                canAccess: false,
                reason: 'Invalid access check parameters.',
                watchCount: 0,
                remainingWatches: 0,
            },
            config
        );
    }

    if (video.order === undefined || video.order === null) {
        console.warn(`[checkSequentialVideoAccess] Video ${video._id} missing order field; using list position for sequence.`);
    }

    const videos = sortModuleVideosForSequence(await getModuleVideos(moduleId));
    if (videos.length === 0) {
        return buildAccessPayload(
            {
                canAccess: false,
                reason: 'No videos are available in this module.',
                watchCount: 0,
                remainingWatches: 0,
            },
            config
        );
    }

    const totalWatchCount = await getTotalWatchCount(userId, moduleId, video._id);

    const unlockedSetIndex =
        preCalculatedUnlockedSetIndex !== null
            ? preCalculatedUnlockedSetIndex
            : await getCurrentUnlockedSetIndex(userId, moduleId, PRIMARY_MODULE_CYCLE);

    const isInUnlockedSet = isVideoInUnlockedSet(video, unlockedSetIndex, videos);

    if (!isInUnlockedSet) {
        const targetStep = getVideoStepIndex(video, videos) + 1;
        const unlockAfterStep = Math.max(1, unlockedSetIndex);
        return buildAccessPayload(
            {
                canAccess: false,
                reason: `This lesson is locked. Complete lesson ${unlockAfterStep} to unlock lesson ${targetStep}.`,
                watchCount: totalWatchCount,
                remainingWatches: Math.max(0, maxWatches - totalWatchCount),
            },
            config
        );
    }

    if (totalWatchCount >= maxWatches) {
        return buildAccessPayload(
            {
                canAccess: false,
                reason: `Maximum watch limit reached for this lesson (${maxWatches} watches).`,
                watchCount: totalWatchCount,
                remainingWatches: 0,
            },
            config
        );
    }

    return buildAccessPayload(
        {
            canAccess: true,
            reason: 'Access granted',
            watchCount: totalWatchCount,
            remainingWatches: Math.max(0, maxWatches - totalWatchCount),
        },
        config
    );
};

export const markVideoAsCompleted = async (userId, videoId, moduleId) => {
    const config = await getLearningConfig(userId);
    const maxWatches = resolveMaxWatchesPerVideo(config);

    const video = await Video.findById(videoId).select('modules').lean();
    if (!video) {
        throw new Error('Video not found');
    }

    const videoModules = Array.isArray(video.modules)
        ? video.modules.map((m) => (m && typeof m.toString === 'function' ? m.toString() : String(m)))
        : [moduleId.toString()];

    const moduleIdStr = moduleId.toString();
    const modulesToUpdate = videoModules.includes(moduleIdStr) ? videoModules : [moduleIdStr];

    const progressResults = [];

    for (const modId of modulesToUpdate) {
        const totalBefore = await getTotalWatchCount(userId, modId, videoId);
        if (totalBefore >= maxWatches) {
            throw new Error(`Maximum watch limit reached for this lesson (${maxWatches} watches).`);
        }

        let progress = await VideoWatchProgress.findOne({
            user: userId,
            video: videoId,
            module: modId,
            moduleCompletionCycle: PRIMARY_MODULE_CYCLE,
        });

        if (!progress) {
            progress = new VideoWatchProgress({
                user: userId,
                video: videoId,
                module: modId,
                moduleCompletionCycle: PRIMARY_MODULE_CYCLE,
                watchCount: 0,
                isCompleted: false,
            });
        }

        progress.watchCount += 1;
        progress.isCompleted = true;
        progress.lastWatchedAt = new Date();
        progress.completedAt = new Date();
        await progress.save();

        const totalAfter = await getTotalWatchCount(userId, modId, videoId);
        progressResults.push({
            moduleId: modId,
            progress,
            watchCount: totalAfter,
            completionCycle: PRIMARY_MODULE_CYCLE,
        });
    }

    const requestedModuleResult = progressResults.find((r) => r.moduleId === moduleIdStr) || progressResults[0];
    if (!requestedModuleResult) {
        throw new Error('No progress was saved for any module');
    }

    const { progress, watchCount: finalWatchCount } = requestedModuleResult;
    const remainingWatches = Math.max(0, maxWatches - finalWatchCount);

    const videos = sortModuleVideosForSequence(await getModuleVideos(moduleId));
    const videoObj = videos.find((v) => v._id.toString() === videoId);
    if (!videoObj) {
        throw new Error('Video not found in module');
    }

    const allModuleProgress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: PRIMARY_MODULE_CYCLE,
        isCompleted: true,
    }).lean();

    const completedIds = new Set(allModuleProgress.map((p) => p.video.toString()));
    const moduleComplete = videos.length > 0 && videos.every((v) => completedIds.has(v._id.toString()));

    if (moduleComplete) {
        const { syncModuleProgressFromVideos, onModuleFirstPassCompleted } = await import(
            '../services/moduleQuizAccessService.js'
        );
        await syncModuleProgressFromVideos(userId, moduleId);
        await onModuleFirstPassCompleted(userId, moduleId);
    }

    return {
        progress,
        setComplete: true,
        moduleComplete,
        nextCycleStarted: false,
        newCompletionCycle: PRIMARY_MODULE_CYCLE,
        watchCount: finalWatchCount,
        remainingWatches,
        currentCycleWatchCount: progress.watchCount,
        completionCycle: PRIMARY_MODULE_CYCLE,
        maxWatchesPerVideo: maxWatches,
        maxWatchesPerCycle: maxWatches,
        maxModuleCycles: 1,
    };
};
