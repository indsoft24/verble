// src/utils/videoAccessHelper.js
import VideoWatchProgress from '../models/VideoWatchProgress.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { getActiveUserTierLevel, TIER_LEVEL } from './subscriptionTierAccess.js';

/**
 * Calculate which step a video belongs to (1 video per step)
 * @param {number} videoOrder - The order field of the video
 * @param {number} minOrder - The minimum order value in the module (for normalization)
 * @returns {number} - The set index (0-based)
 * 
 * Note: Videos can start at order 0, 1, or any number. We normalize by subtracting
 * the minimum order to ensure sets are calculated correctly regardless of starting order.
 * 
 * Example: If orders start at 1:
 * - Order 1 → Step 0
 * - Order 2 → Step 1
 * - Order 3 → Step 2
 */
export const getVideoSetIndex = (videoOrder, minOrder = 0) => {
    // Normalize order to 0-based by subtracting minimum order
    const normalizedOrder = videoOrder - minOrder;
    return normalizedOrder;
};

/**
 * Get all videos for a module sorted by order
 * @param {string} moduleId - The module ID
 * @returns {Promise<Array>} - Array of videos sorted by order
 */
export const getModuleVideos = async (moduleId) => {
    return await Video.find({ 
        modules: moduleId, 
        isPublished: true 
    }).sort({ order: 'asc' }).lean();
};

/**
 * Get the current unlocked set index for a user in a module
 * 
 * Logic:
 * - Set 0 is always unlocked initially (if no sets completed)
 * - After Set N completes, Set N+1 unlocks and Set N locks
 * - Only ONE set is unlocked at a time
 * 
 * @param {string} userId - The user ID
 * @param {string} moduleId - The module ID
 * @param {number} moduleCompletionCycle - Current completion cycle (0 or 1)
 * @returns {Promise<number>} - The unlocked set index (0-based)
 */
export const getCurrentUnlockedSetIndex = async (userId, moduleId, moduleCompletionCycle) => {
    // Get all videos for the module
    const videos = await getModuleVideos(moduleId);
    
    if (videos.length === 0) {
        return -1; // No videos, nothing unlocked
    }

    // Find minimum order value to normalize set calculation
    const minOrder = Math.min(...videos.map(v => v.order ?? 0));

    // Get all watch progress for this user, module, and cycle
    const watchProgress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: moduleCompletionCycle,
    }).lean();

    // Create a map of videoId -> progress
    const progressMap = new Map();
    watchProgress.forEach(progress => {
        progressMap.set(progress.video.toString(), progress);
    });

    // Group videos by set (using normalized order)
    const sets = new Map();
    videos.forEach(video => {
        const setIndex = getVideoSetIndex(video.order ?? 0, minOrder);
        if (!sets.has(setIndex)) {
            sets.set(setIndex, []);
        }
        sets.get(setIndex).push(video);
    });

    // Find the highest set where all videos are completed
    let highestCompletedSet = -1;
    const sortedSetIndices = Array.from(sets.keys()).sort((a, b) => a - b);

    for (const setIndex of sortedSetIndices) {
        const setVideos = sets.get(setIndex);
        
        // Check if all videos in this set are completed
        const allCompleted = setVideos.every(video => {
            const progress = progressMap.get(video._id.toString());
            return progress && progress.isCompleted;
        });

        if (allCompleted) {
            highestCompletedSet = setIndex;
        } else {
            break; // Stop at first incomplete set
        }
    }

    // The unlocked set is the highest completed set + 1
    // Set 0 is always unlocked initially (if highestCompletedSet is -1, unlockedSetIndex = 0)
    const unlockedSetIndex = Math.max(0, highestCompletedSet + 1);
    
    return unlockedSetIndex;
};

/**
 * Check if a video is in the unlocked set
 * @param {Object} video - The video object with order field
 * @param {number} unlockedSetIndex - The current unlocked set index
 * @param {number} minOrder - The minimum order value in the module (for normalization)
 * @returns {boolean} - True if video is unlocked
 * 
 * Note: Only the current unlocked set is accessible. Previous sets lock when next set unlocks.
 */
export const isVideoInUnlockedSet = (video, unlockedSetIndex, minOrder = 0) => {
    // Handle missing order field
    if (video.order === undefined || video.order === null) {
        console.warn(`[isVideoInUnlockedSet] Video ${video._id} missing order field, allowing access as fallback`);
        return true; // Allow access if order is missing (shouldn't happen, but be safe)
    }
    
    const videoSetIndex = getVideoSetIndex(video.order, minOrder);
    
    // Only the exact unlocked set is accessible (previous sets are locked)
    return videoSetIndex === unlockedSetIndex;
};

/**
 * Get the current module completion cycle for a user
 * 
 * Logic:
 * - Cycle 0: First complete watch-through (default)
 * - Cycle 1: Second complete watch-through (starts after cycle 0 completes)
 * - After cycle 1 completes: Maximum watch limit reached
 * 
 * @param {string} userId - The user ID
 * @param {string} moduleId - The module ID
 * @returns {Promise<number>} - The current completion cycle (0 or 1)
 */
export const getModuleCompletionCycle = async (userId, moduleId) => {
    // Get all videos for the module
    const videos = await getModuleVideos(moduleId);
    
    if (videos.length === 0) {
        return 0; // No videos, default to cycle 0
    }

    // Check if module was completed in cycle 0
    const cycle0Progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: 0,
    }).lean();

    const cycle0ProgressMap = new Map();
    cycle0Progress.forEach(progress => {
        cycle0ProgressMap.set(progress.video.toString(), progress);
    });

    // Check if all videos are completed in cycle 0
    const cycle0Complete = videos.every(video => {
        const progress = cycle0ProgressMap.get(video._id.toString());
        return progress && progress.isCompleted;
    });

    if (!cycle0Complete) {
        return 0; // Still in first cycle
    }

    // Cycle 0 is complete, check cycle 1
    const cycle1Progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: 1,
    }).lean();

    const cycle1ProgressMap = new Map();
    cycle1Progress.forEach(progress => {
        cycle1ProgressMap.set(progress.video.toString(), progress);
    });

    // Check if all videos are completed in cycle 1
    const cycle1Complete = videos.every(video => {
        const progress = cycle1ProgressMap.get(video._id.toString());
        return progress && progress.isCompleted;
    });

    if (cycle1Complete) {
        return 1; // Both cycles complete (but we still allow access until watch limit reached)
    }

    // Cycle 0 complete, cycle 1 in progress
    return 1;
};

/**
 * Check if a user can access a video based on sequential unlocking rules
 * 
 * Rules:
 * 1. Videos unlock one-by-one (strict order)
 * 2. Only ONE video step is unlocked at a time
 * 3. Previous steps lock when next step unlocks
 * 4. After completing all sets in cycle 0, cycle 1 starts
 * 5. Maximum 4 watches per video across all cycles
 * 
 * @param {string} userId - The user ID
 * @param {Object} video - The video object
 * @param {string} moduleId - The module ID
 * @param {number} [preCalculatedUnlockedSetIndex] - Optional pre-calculated unlocked set index (for performance and consistency)
 * @param {number} [preCalculatedCompletionCycle] - Optional pre-calculated completion cycle
 * @returns {Promise<Object>} - { canAccess: boolean, reason: string, watchCount: number, remainingWatches: number }
 */
export const checkSequentialVideoAccess = async (userId, video, moduleId, preCalculatedUnlockedSetIndex = null, preCalculatedCompletionCycle = null) => {
    const MAX_WATCHES_PER_VIDEO = 4;
    // Validate inputs
    if (!userId || !video || !moduleId) {
        return {
            canAccess: false,
            reason: 'Invalid access check parameters.',
            watchCount: 0,
            remainingWatches: 0,
        };
    }

    // Check if video has order field (required for sequential access)
    if (video.order === undefined || video.order === null) {
        console.warn(`[checkSequentialVideoAccess] Video ${video._id} missing order field, allowing access as fallback`);
        return {
            canAccess: true,
            reason: 'Access granted (order field missing)',
            watchCount: 0,
            remainingWatches: MAX_WATCHES_PER_VIDEO,
        };
    }

    // Get current completion cycle (use pre-calculated if provided)
    const completionCycle = preCalculatedCompletionCycle !== null 
        ? preCalculatedCompletionCycle 
        : await getModuleCompletionCycle(userId, moduleId);

    // Get all videos for the module
    const videos = await getModuleVideos(moduleId);
    if (videos.length === 0) {
        return {
            canAccess: false,
            reason: 'No videos are available in this module.',
            watchCount: 0,
            remainingWatches: 0,
        };
    }

    const minOrder = Math.min(...videos.map(v => v.order ?? 0));
    
    // Get watch progress for both cycles
    const cycle0Progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: 0,
    }).lean();
    const cycle1Progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: 1,
    }).lean();

    const cycle0ProgressMap = new Map();
    cycle0Progress.forEach(p => cycle0ProgressMap.set(p.video.toString(), p));
    const cycle1ProgressMap = new Map();
    cycle1Progress.forEach(p => cycle1ProgressMap.set(p.video.toString(), p));

    // Get watch counts for this video
    const videoCycle0 = cycle0ProgressMap.get(video._id.toString());
    const videoCycle1 = cycle1ProgressMap.get(video._id.toString());
    const totalWatchCount = (videoCycle0?.watchCount || 0) + (videoCycle1?.watchCount || 0);

    // Enforce sequential one-by-one unlocking.
    const unlockedSetIndex = preCalculatedUnlockedSetIndex !== null
        ? preCalculatedUnlockedSetIndex
        : await getCurrentUnlockedSetIndex(userId, moduleId, completionCycle);
    const isInUnlockedSet = isVideoInUnlockedSet(video, unlockedSetIndex, minOrder);

    if (!isInUnlockedSet) {
        const targetSet = getVideoSetIndex(video.order, minOrder) + 1;
        const currentSet = unlockedSetIndex + 1;
        return {
            canAccess: false,
            reason: `This video is currently locked. Complete lesson ${currentSet} to unlock lesson ${targetSet}.`,
            watchCount: totalWatchCount,
            remainingWatches: Math.max(0, MAX_WATCHES_PER_VIDEO - totalWatchCount),
        };
    }

    if (totalWatchCount >= MAX_WATCHES_PER_VIDEO) {
        return {
            canAccess: false,
            reason: `Maximum watch limit reached for this video (${MAX_WATCHES_PER_VIDEO} watches).`,
            watchCount: totalWatchCount,
            remainingWatches: 0,
        };
    }

    return {
        canAccess: true,
        reason: 'Access granted',
        watchCount: totalWatchCount,
        remainingWatches: Math.max(0, MAX_WATCHES_PER_VIDEO - totalWatchCount),
    };
};

/**
 * Mark a video as completed and update progress
 * 
 * This function:
 * 1. Saves progress for ALL modules the video belongs to
 * 2. Tracks progress per user-module-video-cycle combination
 * 3. Enforces watch count limits (max 4 per video across all cycles)
 * 4. Checks set and module completion
 * 
 * @param {string} userId - The user ID
 * @param {string} videoId - The video ID
 * @param {string} moduleId - The module ID (requested module, but progress saved for all modules)
 * @returns {Promise<Object>} - Updated progress and unlock status
 */
export const markVideoAsCompleted = async (userId, videoId, moduleId) => {
    const MAX_WATCHES_PER_VIDEO = 4;
    // Get the video to find all modules it belongs to
    const video = await Video.findById(videoId).select('modules').lean();
    if (!video) {
        throw new Error('Video not found');
    }

    // Get all modules this video belongs to (normalize to strings)
    const videoModules = Array.isArray(video.modules) 
        ? video.modules.map(m => (m && typeof m.toString === 'function') ? m.toString() : String(m))
        : [moduleId.toString()];
    
    const moduleIdStr = moduleId.toString();
    
    // If the provided moduleId is not in the video's modules, use it anyway (fallback)
    const modulesToUpdate = videoModules.includes(moduleIdStr) ? videoModules : [moduleIdStr];

    // Save progress for ALL modules this video belongs to
    const progressResults = [];
    
    for (const modId of modulesToUpdate) {
        // Get current completion cycle for this module
        let completionCycle = await getModuleCompletionCycle(userId, modId);

        // Get or create progress record for current cycle
        let progress = await VideoWatchProgress.findOne({
            user: userId,
            video: videoId,
            module: modId,
            moduleCompletionCycle: completionCycle,
        });

        if (!progress) {
            // Create new progress record for current cycle
            progress = new VideoWatchProgress({
                user: userId,
                video: videoId,
                module: modId,
                moduleCompletionCycle: completionCycle,
                watchCount: 0,
                isCompleted: false,
            });
        }

        // Check total watch count across both cycles for THIS MODULE before incrementing
        const allVideoProgress = await VideoWatchProgress.find({
            user: userId,
            video: videoId,
            module: modId, // Check watch count per module
        }).lean();
        
        const totalWatchCount = allVideoProgress.reduce((sum, p) => sum + (p.watchCount || 0), 0);
        
        if (totalWatchCount >= MAX_WATCHES_PER_VIDEO) {
            throw new Error(`Maximum watch limit reached for this video (${MAX_WATCHES_PER_VIDEO} watches).`);
        }

        // Increment watch count for current cycle
        progress.watchCount += 1;
        progress.isCompleted = true;
        progress.lastWatchedAt = new Date();
        progress.completedAt = new Date();

        await progress.save();
        
        progressResults.push({
            moduleId: modId,
            progress: progress,
            totalWatchCount: totalWatchCount + 1,
        });
    }

    // Return results for the requested moduleId (or first module if not found)
    const requestedModuleResult = progressResults.find(r => r.moduleId === moduleIdStr) || progressResults[0];
    
    if (!requestedModuleResult) {
        throw new Error('No progress was saved for any module');
    }

    const { progress, totalWatchCount: finalTotalWatchCount } = requestedModuleResult;
    const remainingWatches = Math.max(0, MAX_WATCHES_PER_VIDEO - finalTotalWatchCount);

    // Check if current set is complete for the requested module
    const videos = await getModuleVideos(moduleId);
    const videoObj = videos.find(v => v._id.toString() === videoId);
    
    if (!videoObj) {
        throw new Error('Video not found in module');
    }

    // Get completion cycle for the requested module
    const requestedModuleCycle = await getModuleCompletionCycle(userId, moduleId);

    // Find minimum order value for normalization
    const minOrder = Math.min(...videos.map(v => v.order ?? 0));

    const videoSetIndex = getVideoSetIndex(videoObj.order ?? 0, minOrder);
    const setVideos = videos.filter(v => getVideoSetIndex(v.order ?? 0, minOrder) === videoSetIndex);

    // Check if current set is complete
    const allSetProgress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: requestedModuleCycle,
        video: { $in: setVideos.map(v => v._id) },
    }).lean();

    const setProgressMap = new Map();
    allSetProgress.forEach(p => {
        setProgressMap.set(p.video.toString(), p);
    });

    const setComplete = setVideos.every(v => {
        const p = setProgressMap.get(v._id.toString());
        return p && p.isCompleted;
    });

    // Check if entire module is complete
    const allModuleProgress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: requestedModuleCycle,
    }).lean();

    const moduleProgressMap = new Map();
    allModuleProgress.forEach(p => {
        moduleProgressMap.set(p.video.toString(), p);
    });

    const moduleComplete = videos.every(v => {
        const p = moduleProgressMap.get(v._id.toString());
        return p && p.isCompleted;
    });

    let nextCycleStarted = false;
    let newCompletionCycle = requestedModuleCycle;
    
    if (moduleComplete && requestedModuleCycle < 1) {
        // Module is complete in cycle 0, next access should be cycle 1
        nextCycleStarted = true;
        newCompletionCycle = 1;
    }

    return {
        progress: progress,
        setComplete: setComplete,
        moduleComplete: moduleComplete,
        nextCycleStarted: nextCycleStarted,
        newCompletionCycle: newCompletionCycle,
        watchCount: finalTotalWatchCount,
        remainingWatches: remainingWatches,
        currentCycleWatchCount: progress.watchCount,
    };
};
