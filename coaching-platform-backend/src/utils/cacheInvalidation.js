import { deleteCache } from './cacheHelper.js';

/**
 * Invalidate cache for videos
 * @param {string} videoId - Optional video ID for specific invalidation
 */
export const invalidateVideoCache = async (videoId = null) => {
    try {
        if (videoId) {
            await deleteCache(`video:detail:${videoId}`);
        }
        // Invalidate all video list caches
        await deleteCache('videos:list:*');
    } catch (error) {
        console.error('[Cache] Error invalidating video cache:', error.message);
    }
};

/**
 * Invalidate cache for courses
 * @param {string} courseId - Optional course ID for specific invalidation
 */
export const invalidateCourseCache = async (courseId = null) => {
    try {
        if (courseId) {
            await deleteCache(`course:detail:${courseId}`);
        }
        // Invalidate all course list caches
        await deleteCache('courses:list:*');
        await deleteCache('courses:featured');
    } catch (error) {
        console.error('[Cache] Error invalidating course cache:', error.message);
    }
};

/**
 * Invalidate cache for modules
 * @param {string} moduleId - Optional module ID for specific invalidation
 * @param {string} courseId - Optional course ID (modules belong to courses)
 */
export const invalidateModuleCache = async (moduleId = null, courseId = null) => {
    try {
        if (moduleId) {
            await deleteCache(`module:videos:${moduleId}:*`);
        }
        if (courseId) {
            // Invalidate course detail cache as it includes modules
            await deleteCache(`course:detail:${courseId}`);
        }
    } catch (error) {
        console.error('[Cache] Error invalidating module cache:', error.message);
    }
};

/**
 * Invalidate cache for subscription plans
 * @param {string} planId - Optional plan ID for specific invalidation
 * @param {string} courseId - Optional course ID
 */
export const invalidateSubscriptionPlanCache = async (planId = null, courseId = null) => {
    try {
        // Invalidate all plan list caches
        await deleteCache('plans:list:*');
        await deleteCache('plans:upsc:*');
        await deleteCache('plans:law:*');
        
        if (courseId) {
            // Invalidate course-specific plan caches
            await deleteCache(`plans:list:courseId:${courseId}*`);
        }
    } catch (error) {
        console.error('[Cache] Error invalidating subscription plan cache:', error.message);
    }
};

