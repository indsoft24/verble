import apiClient from './apiClient';
import { type ExamCategory } from './examCategoryService'; 

export type VideoLockReason = 'subscription' | 'sequence' | 'watch_limit' | null;

export interface ModuleListItemUser {
    _id: string;
    title: string;
    description?: string;
    timeline?: string;
    chapters?: string[];
    image?: string;
    order: number;
    videoCount?: number;
    createdAt?: string;
    isModuleLocked?: boolean;
    moduleLockReason?: string | null;
    previousModuleId?: string | null;
}

// Interface for a Course item in the list (user-facing)
export interface CourseListItemUser {
    _id: string;
    title: string;
    description?: string;
    image?: string;
    isPublished: boolean; 
    createdAt?: string;
    updatedAt?: string;
    moduleCount?: number; 
    examCategory?: string | ExamCategory; 
}

export interface ModuleDetailUser {
    _id: string;
    title: string;
    description?: string;
    image?: string;
    order: number;
    course: { 
        _id: string;
        title: string;
        isPublished?: boolean; 
    };
    subscriptionPlans?: {
        _id: string;
        name: string;
        price: number;
        currency: string;
    }[];
    createdAt?: string;
}

export interface VideoListItemForModulePage {
    _id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    /** Sort order within the module (from API). */
    order?: number;
    durationSeconds?: number;
    tags?: string[];
    requiredPlans?: Array<string | { _id: string; name: string; }> | null;
    canAccess?: boolean;
    videoStatus?: string;
    watchCount?: number;
    remainingWatches?: number;
    isLocked?: boolean;
    lockReason?: VideoLockReason;
    accessReason?: string;
    completionCycle?: number;
    maxWatchesPerCycle?: number;
    maxModuleCycles?: number;
}

interface GetModuleWithVideosUserResponse {
    status: string;
    data: {
        module: ModuleDetailUser & {
            isModuleLocked?: boolean;
            moduleLockReason?: string | null;
        };
        videos: VideoListItemForModulePage[];
        completionCycle?: number;
        unlockedSetIndex?: number;
        maxWatchesPerCycle?: number;
        maxModuleCycles?: number;
        isModuleLocked?: boolean;
        moduleLockReason?: string | null;
        previousModuleId?: string | null;
    };
    message?: string;
}

export interface CourseDetailUser extends CourseListItemUser {
    modules: ModuleListItemUser[];
}

// API Response for fetching all published courses
interface GetAllPublishedCoursesUserResponse {
    status: string;
    results?: number;
    data: CourseListItemUser[] | {
        courses: CourseListItemUser[];
    };
    message?: string;
}

interface GetPublishedCourseByIdUserResponse {
    status: string;
    data: {
        course: CourseListItemUser; 
        modules: ModuleListItemUser[]; 
    };
    message?: string;
}


/**
 * Fetches all published courses for users.
 * Calls GET /api/courses
 */
export const getAllPublishedCoursesForUser = async (): Promise<CourseListItemUser[]> => {
    try {
        const response = await apiClient.get<GetAllPublishedCoursesUserResponse>('/courses');
        if (response.data && response.data.status === 'success' && response.data.data) {
            // Handle different response structures
            if (Array.isArray(response.data.data)) {
                return response.data.data;
            }
            if (typeof response.data.data === 'object' && 'courses' in response.data.data) {
                return response.data.data.courses;
            }
        }
        throw new Error(response.data?.message || 'Failed to fetch published courses');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Fetches all published courses for users (without topic filter).
 * Calls GET /api/courses - this endpoint returns courses with images
 */
export const getAllLawCoursesForUser = async (): Promise<CourseListItemUser[]> => {
    try {
        // Use the correct API endpoint that returns images - without topic filter as requested
        const response = await apiClient.get<any>('/courses', {
            params: {
                page: 1,
                search: ''
            }
        });
        
        // Handle different response structures
        if (response.data) {
            // If response.data is an array directly
            if (Array.isArray(response.data)) {
                return response.data;
            }
            // If response has status and data property
            if (response.data.status === 'success') {
                // Check if data is an array (paginated response)
                if (Array.isArray(response.data.data)) {
                    return response.data.data;
                }
                // Check if data has courses property
                if (response.data.data && typeof response.data.data === 'object' && 'courses' in response.data.data) {
                    return response.data.data.courses;
                }
            }
        }
        return [];
    } catch (error: any) {
        console.error('Error fetching courses:', error);
        throw error.response?.data || error;
    }
};

/**
 * Fetches a single published course by its ID, including its published modules (for users).
 * Calls GET /api/courses/:courseId
 */
export const getPublishedCourseWithModulesForUser = async (courseId: string): Promise<{ course: CourseListItemUser, modules: ModuleListItemUser[] }> => {
    try {
        const response = await apiClient.get<GetPublishedCourseByIdUserResponse>(`/courses/${courseId}`);
        if (response.data && response.data.status === 'success' && response.data.data) {
            return {
                course: response.data.data.course,
                modules: Array.isArray(response.data.data.modules) ? response.data.data.modules : []
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch course details');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Fetches a single published module by its ID, including its published videos (for users).
 * Calls GET /api/modules/:moduleId/videos (or /api/modules/:moduleId if it returns videos too)
 */
export interface ModuleVideosPageData {
    module: ModuleDetailUser;
    videos: VideoListItemForModulePage[];
    completionCycle?: number;
    maxWatchesPerCycle?: number;
    maxModuleCycles?: number;
    isModuleLocked?: boolean;
    moduleLockReason?: string | null;
    previousModuleId?: string | null;
}

export const getPublishedModuleWithVideosForUser = async (moduleId: string): Promise<ModuleVideosPageData> => {
    try {
        const response = await apiClient.get<GetModuleWithVideosUserResponse>(`/modules/${moduleId}/videos`);
        if (response.data?.status === 'success' && response.data.data) {
            const d = response.data.data;
            return {
                module: d.module,
                videos: Array.isArray(d.videos) ? d.videos : [],
                completionCycle: d.completionCycle,
                maxWatchesPerCycle: d.maxWatchesPerCycle,
                maxModuleCycles: d.maxModuleCycles,
                isModuleLocked: d.isModuleLocked ?? d.module?.isModuleLocked,
                moduleLockReason: d.moduleLockReason ?? d.module?.moduleLockReason,
                previousModuleId: d.previousModuleId ?? null,
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch module and video details');
    } catch (error: any) {
        const payload = error.response?.data || error;
        if (payload?.data?.isModuleLocked) {
            const d = payload.data;
            return {
                module: d.module,
                videos: [],
                isModuleLocked: true,
                moduleLockReason: d.moduleLockReason || payload.message,
                previousModuleId: d.previousModuleId || null,
                maxWatchesPerCycle: d.maxWatchesPerCycle,
                maxModuleCycles: d.maxModuleCycles,
            };
        }
        throw payload;
    }
};

interface GetMyCoursesUserResponse {
    status: string;
    results?: number;
    data: {
        courses: CourseListItemUser[];
        context: 'subscribed' | 'all_courses' | 'no_subscription';
    };
}

/**
 * Fetches courses relevant to the currently logged-in user.
 * The backend handles the logic of returning subscribed courses or all courses.
 */
export const getMyCoursesForUser = async (): Promise<{ courses: CourseListItemUser[], context: 'subscribed' | 'all_courses' }> => {
    try {
        const response = await apiClient.get<GetMyCoursesUserResponse>('/courses/my-courses');
        
        if (response.data && response.data.status === 'success' && response.data.data) {
            return {
                courses: response.data.data.courses || [],
                context:
                    response.data.data.context === 'subscribed'
                        ? 'subscribed'
                        : 'all_courses',
            };
        }
        throw new Error('Failed to fetch courses');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};