import Module from '../models/Module.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import VideoWatchProgress from '../models/VideoWatchProgress.js';
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import { checkSequentialVideoAccess, getModuleCompletionCycle, getCurrentUnlockedSetIndex } from '../utils/videoAccessHelper.js';
import { buildVideoLockFlags, isModuleUnlockedForUser } from '../services/moduleUnlockService.js';
import { getLearningConfig } from '../services/courseLearningConfigService.js';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../utils/cacheHelper.js';
import { getStreamProvider } from '../utils/videoStreamProvider.js';
import { getActiveUserTierLevel, canAccessRequiredPlansByTier } from '../utils/subscriptionTierAccess.js';

/**
 * @desc    Helper function to check if a user has subscription access to a video.
 * @param   {object} user - The full user object with subscriptions.
 * @param   {object} video - The full video object with requiredPlans.
 * @returns {boolean} - True if the user has subscription access, false otherwise.
 */
const checkSubscriptionAccess = (user, video) => {
    if (video.videoStatus !== 'AVAILABLE') {
        return false;
    }

    if (!video.requiredPlans || video.requiredPlans.length === 0) {
        return true; // Free video
    }

    if (!user || !user.subscriptions || user.subscriptions.length === 0) {
        return false;
    }
    const userTierLevel = getActiveUserTierLevel(user.subscriptions);
    return canAccessRequiredPlansByTier({
        requiredPlans: video.requiredPlans,
        userTierLevel,
    });
};


/**
 * @desc    Get a single published module and its videos for a user.
 * @route   GET /api/modules/:moduleId/videos
 * @access  Private (User must be logged in)
 */
export const getVideosForModule = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user?._id; 

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        res.status(400);
        throw new Error('Invalid Module ID format.');
    }

    // Generate cache key (user-specific for personalized data)
    const cacheKey = `module:videos:${moduleId}:${userId?.toString() || 'anonymous'}`;

    // Try to get from cache first (only for anonymous users to avoid stale user data)
    if (!userId) {
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }
    }

    // Parallel queries for better performance
    const [module, videos] = await Promise.all([
        Module.findById(moduleId).populate('course', 'title').lean(),
        Video.find({ modules: moduleId, isPublished: true })
            .populate('requiredPlans', '_id name')
            .sort({ order: 'asc' })
            .select('_id title description durationSeconds order videoStatus processingProgress isPublished uploader createdAt updatedAt height width associatedMaterials courses modules requiredPlans tags streamProvider localStorageId')
            .lean()
    ]);

    if (!module) {
        res.status(404);
        throw new Error('Module not found.');
    }

    const user = userId ? await User.findById(userId).select('subscriptions').lean() : null;

    let learningConfig = null;
    if (userId) {
        learningConfig = await getLearningConfig(userId);
        const moduleUnlock = await isModuleUnlockedForUser(userId, moduleId);
        if (!moduleUnlock.unlocked) {
            const moduleDataLocked = module.toObject ? module.toObject() : module;
            return res.status(403).json({
                status: 'fail',
                message: moduleUnlock.reason,
                data: {
                    module: moduleDataLocked,
                    videos: [],
                    isModuleLocked: true,
                    moduleLockReason: moduleUnlock.reason,
                    previousModuleId: moduleUnlock.previousModuleId || null,
                    completionCycle: 0,
                    unlockedSetIndex: 0,
                    maxWatchesPerCycle: learningConfig.maxWatchesPerVideoPerCycle,
                    maxModuleCycles: learningConfig.maxModuleCompletionCycles,
                },
            });
        }
    }

    // Get watch progress for all videos in this module
    let watchProgressMap = new Map();
    let completionCycle = 0;
    let unlockedSetIndex = 0;

    if (userId) {
        // Get completion cycle
        completionCycle = await getModuleCompletionCycle(userId, moduleId);
        
        // Get unlocked set index
        unlockedSetIndex = await getCurrentUnlockedSetIndex(userId, moduleId, completionCycle);

        // Get all watch progress for this module and user
        const allProgress = await VideoWatchProgress.find({
            user: userId,
            module: moduleId,
        }).lean();

        allProgress.forEach(progress => {
            const key = `${progress.video.toString()}_${progress.moduleCompletionCycle}`;
            watchProgressMap.set(key, progress);
        });
    }

    // Helper function to convert array of ObjectIds/objects to array of strings
    const convertToStringArray = (arr) => {
        if (!arr) return [];
        if (!Array.isArray(arr)) {
            // If it's a single value, convert to array
            if (typeof arr === 'string') return [arr];
            if (arr && typeof arr === 'object' && arr._id) return [arr._id.toString()];
            if (arr && typeof arr.toString === 'function') return [arr.toString()];
            return [];
        }
        return arr.map(item => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && item._id) return item._id.toString();
            if (item && typeof item.toString === 'function') return item.toString();
            return item;
        });
    };

    const videosWithAccess = await Promise.all(videos.map(async (video) => {
        // Convert array fields to string arrays for Android compatibility
        // IMPORTANT: Always ensure these are arrays, never strings or null
        const coursesArray = convertToStringArray(video.courses);
        const modulesArray = convertToStringArray(video.modules);
        const requiredPlansArray = convertToStringArray(video.requiredPlans);
        const tagsArray = convertToStringArray(video.tags);
        
        // Create a clean video object with explicit array fields
        const thumbUrl = getStreamProvider(video) === 'local' && video.videoStatus === 'AVAILABLE' && video.localStorageId
            ? `/api/videos/thumbnail/${video._id}`
            : null;
        const videoObject = {
            _id: video._id?.toString(),
            title: video.title,
            description: video.description,
            thumbnailUrl: thumbUrl,
            durationSeconds: video.durationSeconds,
            order: video.order,
            videoStatus: video.videoStatus,
            processingProgress: video.processingProgress,
            isPublished: video.isPublished,
            uploader: video.uploader?.toString(),
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
            __v: video.__v,
            height: video.height,
            width: video.width,
            associatedMaterials: video.associatedMaterials || [],
            // Explicitly set as arrays - never strings
            courses: Array.isArray(coursesArray) ? coursesArray : [],
            modules: Array.isArray(modulesArray) ? modulesArray : [],
            requiredPlans: Array.isArray(requiredPlansArray) ? requiredPlansArray : [],
            tags: Array.isArray(tagsArray) ? tagsArray : [],
        };
        
        // First check subscription access
        const hasSubscriptionAccess = checkSubscriptionAccess(user, video);
        
        if (!hasSubscriptionAccess) {
            return {
                ...videoObject,
                ...buildVideoLockFlags(false, {
                    canAccess: false,
                    reason: 'Subscription required',
                    watchCount: 0,
                    remainingWatches: 0,
                }),
                completionCycle: completionCycle,
            };
        }

        // If no user, only subscription check matters
        if (!userId) {
            return {
                ...videoObject,
                canAccess: true, // Explicit boolean
                accessReason: 'Free video or subscription access',
                watchCount: 0,
                remainingWatches: 0,
                isLocked: false, // Explicit boolean
            };
        }

        // Skip security feature for free videos (no requiredPlans)
        const isFreeVideo = !video.requiredPlans || video.requiredPlans.length === 0;
        
        if (isFreeVideo) {
            return {
                ...videoObject,
                canAccess: !!hasSubscriptionAccess,
                accessReason: 'Free video - unlimited access',
                watchCount: 0,
                remainingWatches: 0,
                isLocked: false,
                lockReason: null,
                completionCycle: 0,
            };
        }

        const sequentialAccess = await checkSequentialVideoAccess(
            userId,
            video,
            moduleId,
            unlockedSetIndex,
            completionCycle
        );
        const lockFlags = buildVideoLockFlags(true, sequentialAccess);

        return {
            ...videoObject,
            ...lockFlags,
            completionCycle: sequentialAccess.completionCycle ?? completionCycle,
            maxWatchesPerCycle: sequentialAccess.maxWatchesPerCycle,
            maxModuleCycles: sequentialAccess.maxModuleCycles,
        };
    }));

    // Convert module to plain object and ensure subscriptionPlans are strings
    const moduleData = module.toObject ? module.toObject() : module;
    
    // Ensure subscriptionPlans are returned as string IDs, not objects
    if (moduleData.subscriptionPlans && Array.isArray(moduleData.subscriptionPlans)) {
        moduleData.subscriptionPlans = moduleData.subscriptionPlans.map(plan => {
            // If it's already a string, return it
            if (typeof plan === 'string') {
                return plan;
            }
            // If it's an ObjectId object, convert to string
            if (plan && typeof plan === 'object' && plan._id) {
                return plan._id.toString();
            }
            // If it's an ObjectId instance, use toString()
            if (plan && typeof plan.toString === 'function') {
                return plan.toString();
            }
            return plan;
        });
    }

    // Final validation: Ensure all videos have arrays, not strings, and explicit boolean values
    const validatedVideos = videosWithAccess.map(video => {
        // Double-check that array fields are actually arrays
        if (!Array.isArray(video.courses)) {
            console.warn(`[Module Controller] Video ${video._id} has non-array courses:`, typeof video.courses, video.courses);
            video.courses = [];
        }
        if (!Array.isArray(video.modules)) {
            console.warn(`[Module Controller] Video ${video._id} has non-array modules:`, typeof video.modules, video.modules);
            video.modules = [];
        }
        if (!Array.isArray(video.requiredPlans)) {
            console.warn(`[Module Controller] Video ${video._id} has non-array requiredPlans:`, typeof video.requiredPlans, video.requiredPlans);
            video.requiredPlans = [];
        }
        if (!Array.isArray(video.tags)) {
            console.warn(`[Module Controller] Video ${video._id} has non-array tags:`, typeof video.tags, video.tags);
            video.tags = [];
        }
        
        // Ensure canAccess and isLocked are explicit booleans (not undefined/null)
        if (video.canAccess === undefined || video.canAccess === null) {
            console.warn(`[Module Controller] Video ${video._id} has undefined/null canAccess, defaulting to false`);
            video.canAccess = false;
        } else {
            video.canAccess = !!video.canAccess; // Convert to explicit boolean
        }
        
        if (video.isLocked === undefined || video.isLocked === null) {
            // Default isLocked based on canAccess if not set
            video.isLocked = !video.canAccess;
        } else {
            video.isLocked = !!video.isLocked; // Convert to explicit boolean
        }
        
        // Final video access validation completed
        
        return video;
    });

    const response = {
        status: 'success',
        data: {
            module: {
                ...moduleData,
                isModuleLocked: false,
                moduleLockReason: null,
            },
            videos: validatedVideos,
            completionCycle: completionCycle,
            unlockedSetIndex: unlockedSetIndex,
            maxWatchesPerCycle: learningConfig?.maxWatchesPerVideoPerCycle ?? 4,
            maxModuleCycles: learningConfig?.maxModuleCompletionCycles ?? 4,
        }
    };

    // Cache response only for anonymous users (user-specific data changes frequently)
    if (!userId) {
        await setCache(cacheKey, response, CACHE_TTL.MEDIUM);
    }

    res.status(200).json(response);
});


/**
 * @desc    Get public module and video preview for guest users (read-only, non-sensitive data)
 * @route   GET /api/public/modules/:moduleId/preview
 * @access  Public
 */
export const getPublicModulePreview = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        res.status(400);
        throw new Error('Invalid Module ID format.');
    }

    // Fetch module with only public fields
    const module = await Module.findById(moduleId)
        .select('title description image subscriptionPlans order createdAt')
        .populate('course', 'title')
        .populate('subscriptionPlans', 'name price currency')
        .lean();

    if (!module) {
        res.status(404);
        throw new Error('Module not found.');
    }

    // Fetch videos with only public, non-sensitive fields
    const videos = await Video.find({ 
        modules: moduleId, 
        isPublished: true 
    })
        .select('title description durationSeconds associatedMaterials order canAccess streamProvider localStorageId videoStatus')
        .sort({ order: 'asc' })
        .lean();

    // Sanitize videos to show only preview data
    const publicVideos = videos.map(video => {
        const thumb = getStreamProvider(video) === 'local' && video.videoStatus === 'AVAILABLE' && video.localStorageId
            ? `/api/videos/thumbnail/${video._id}`
            : null;
        return {
        _id: video._id,
        title: video.title,
        description: video.description || '',
        thumbnailUrl: thumb,
        duration: video.durationSeconds,
        order: video.order,
        canAccess: video.canAccess || false,
        materials: video.associatedMaterials?.map(material => ({
            _id: material._id,
            label: material.label,
            fileName: material.fileName,
            fileSize: material.fileSize,
            fileType: material.fileType
        })) || []
    };
    });

    // Convert subscriptionPlans to string IDs if they're objects
    let subscriptionPlansIds = module.subscriptionPlans;
    if (subscriptionPlansIds && Array.isArray(subscriptionPlansIds)) {
        subscriptionPlansIds = subscriptionPlansIds.map(plan => {
            // If it's already a string, return it
            if (typeof plan === 'string') {
                return plan;
            }
            // If it's an object with _id (populated), return the _id as string
            if (plan && typeof plan === 'object' && plan._id) {
                return plan._id.toString();
            }
            // If it's an ObjectId instance, use toString()
            if (plan && typeof plan.toString === 'function') {
                return plan.toString();
            }
            return plan;
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            module: {
                _id: module._id,
                title: module.title,
                description: module.description,
                image: module.image,
                subscriptionPlans: subscriptionPlansIds,
                course: module.course,
                order: module.order
            },
            videos: publicVideos,
            message: 'Login to access full content'
        }
    });
});

