import apiClient from './apiClient'; 
import type { User as AuthContextUserType } from './authService'; 
import type { SubscriptionPlan } from './subscriptionPlanAdminService'; 
import type { Course } from './courseAdminService';
import type { Module } from './moduleAdminService';


export interface PlatformStats {
    totalUsers: number;
    activeUserSubscriptions: number;
    totalVideos: number;
    publishedVideos: number;
    totalCourses: number;
    publishedCourses: number;
}

export interface UserSubscriptionInstance {
    _id?: string; 
    planId: string | Partial<SubscriptionPlan> | { _id: string; name: string; isActive?: boolean; price?: number; currency?: string; duration?: {value: number; unit: string}, features?: string[] };
    planName: string; 
    status?: 'none' | 'active' | 'pending_cancellation' | 'cancelled' | 'expired' | 'trial' | 'future_active';
    startDate?: string | Date;
    endDate?: string | Date;
    stripeSubscriptionId?: string;
}

export interface AdminUserView {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    phoneNumber?: string;
    createdAt?: string;
    updatedAt?: string; 
    subscriptions: UserSubscriptionInstance[]; 
}

// For detailed user view/edit by admin
export interface AdminDetailedUser extends Omit<AuthContextUserType, 'subscription' | 'subscriptions'> { 
    _id: string; 
    name: string; 
    email: string;
    role: 'user' | 'admin';
    phoneNumber?: string;
    authProvider?: 'local' | 'google' | 'phone_pin';
    hasLoginPin?: boolean;
    loginPinIssuedAt?: string | null;
    subscriptions: UserSubscriptionInstance[]; 
    createdAt?: string;
    updatedAt?: string;
}

// --- NEW: Interface for Associated Materials ---
export interface Material {
    _id: string;
    label: string;
    fileName: string;
    storageUrl: string;
    fileSize?: number;
    fileType?: string;
    createdAt?: string;
}

export interface FinalizeVideoPayload {
    title: string;
    description?: string;
    courseIds?: string[] | null;
    moduleIds?: string[] | null;
    order?: number;
    requiredPlans?: string[] | null;
    isPublished?: boolean;
    tags?: string[];
    bunnyVideoId: string; 
    bunnyVideoLibraryId: string; 
    durationSeconds?: number; 
}

export interface VideoMetadata { 
    _id: string;
    title: string;
    description?: string;
    isPublished: boolean;
    order?: number;
    streamProvider?: 'local' | 'bunny';
    localStorageId?: string;
    streamUrl?: string;
    thumbnailUrl?: string;
    bunnyVideoLibraryId?: string; 
    bunnyVideoId?: string;      
    bunnyStreamUrl?: string;
    bunnyThumbnailUrl?: string;
    durationSeconds?: number;
    width?: number;
    height?: number;
    videoStatus?: 'METADATA_CREATED' | 'PENDING_UPLOAD' | 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'AVAILABLE' | 'FAILED';
    processingProgress?: number;
    transcodeStep?: string;
    processingError?: string;
    bunnyProcessingProgress?: number;
    courses?: Array<string | Course>;
    modules?: Array<string | Module>;
    requiredPlans?: Array<string | SubscriptionPlan> | null;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    uploader?: string | { _id: string; name: string };
    // --- UPDATED: Added materials to the video metadata ---
    associatedMaterials?: Material[];
}


// Payload sent FROM frontend TO backend when creating new video metadata
export interface CreateVideoAdminData {
    title: string;
    description?: string;
    courseIds?: string[] | null; 
    moduleIds?: string[] | null; 
    order?: number;
    requiredPlans?: string[] | null; 
    isPublished?: boolean;
    tags?: string[];
}

export interface UpdateVideoAdminData extends Partial<CreateVideoAdminData> {
}

export interface CreateVideoServiceResponse {
    video: VideoMetadata; 
    uploadInfo: {          
        bunnyVideoId: string;    
        libraryId: string;       
        apiKey: string;          
    };
}

// Payload for ADMIN to ADD a new subscription instance to a user
export interface AdminAddUserSubscriptionPayload {
    planId: string; 
    status?: UserSubscriptionInstance['status'];
    startDate?: string; 
    endDate?: string;   
}

// Payload for updating video status by admin (or system post-TUS upload)
export interface UpdateVideoStatusPayload {
    videoStatus: VideoMetadata['videoStatus'];
    processingError?: string; 
    durationSeconds?: number; 
    bunnyStreamUrl?: string;
    bunnyThumbnailUrl?: string;
    width?: number;
    height?: number;
    bunnyProcessingProgress?: number;
}

// --- Standardized API Response Wrapper ---
interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
    results?: number;
}

interface DeleteApiResponse {
    status: string;
    data: null;
    message?: string;
}

interface LinkVideosToModuleResponse { 
    status: string;
    message: string;
}

export interface InitiateUploadPayload {
    title: string;
    description?: string;
    courseIds?: string[];
    moduleIds?: string[];
    order?: number;
    requiredPlans?: string[];
    isPublished?: boolean;
    tags?: string[];
}
export interface LocalVideoUploadInstructions {
    method: 'POST';
    fieldName: string;
    path: string;
}

export interface InitiateUploadResponse {
    video: VideoMetadata;
    upload: LocalVideoUploadInstructions;
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (error && typeof error === 'object') {
        const err = error as { message?: string; response?: { data?: { message?: string } } };
        return err.response?.data?.message || err.message || fallback;
    }
    return fallback;
};

export const initiateVideoUpload = async (payload: InitiateUploadPayload): Promise<InitiateUploadResponse> => {
    try {
        const response = await apiClient.post<ApiResponse<InitiateUploadResponse>>(`/admin/videos/initiate-upload`, payload);
        if (response.data.status === 'success' && response.data.data?.video && response.data.data?.upload) {
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Failed to initiate video upload.');
    } catch (error: unknown) {
        throw new Error(getApiErrorMessage(error, 'Failed to initiate video upload.'));
    }
};

/** Upload video file to server storage; FFmpeg transcoding starts after upload completes. */
export const uploadVideoFileAdmin = async (
    videoId: string,
    file: File,
    onProgress?: (percent: number) => void
): Promise<VideoMetadata> => {
    const formData = new FormData();
    formData.append('video', file);

    try {
        const response = await apiClient.post<ApiResponse<{ video: VideoMetadata }>>(
            `/admin/videos/${videoId}/upload-file`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 0,
                onUploadProgress: (event) => {
                    if (event.total && onProgress) {
                        onProgress(Math.round((event.loaded * 100) / event.total));
                    }
                },
            }
        );
        if (response.data.status === 'success' && response.data.data?.video) {
            return response.data.data.video;
        }
        throw new Error(response.data?.message || 'Failed to upload video file.');
    } catch (error: unknown) {
        throw new Error(getApiErrorMessage(error, 'Failed to upload video file.'));
    }
};

export const finalizeVideoCreationAdmin = async (payload: FinalizeVideoPayload): Promise<VideoMetadata> => {
    try {
        const response = await apiClient.post<ApiResponse<{video: VideoMetadata}>>(`/admin/videos/finalize-bunny-upload`, payload);
        if (response.data.status === 'success' && response.data.data?.video) {
            return response.data.data.video;
        }
        throw new Error(response.data?.message || 'Failed to finalize video creation.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

// --- USER MANAGEMENT FUNCTIONS (Admin) ---

export type AdminUsersQuery = {
    search?: string;
    segment?: 'all' | 'free' | 'premium';
    limit?: number;
};

export const getAllUsers = async (query: AdminUsersQuery = {}): Promise<AdminUserView[]> => {
    try {
        const params = new URLSearchParams();
        if (query.search?.trim()) params.set('search', query.search.trim());
        if (query.segment && query.segment !== 'all') params.set('segment', query.segment);
        if (query.limit) params.set('limit', String(query.limit));
        const qs = params.toString();
        const response = await apiClient.get<ApiResponse<{ users: AdminUserView[] }>>(
            `/admin/users${qs ? `?${qs}` : ''}`
        );
        if (response.data.status === 'success' && response.data.data?.users) {
            return response.data.data.users.map(user => ({
                ...user,
                subscriptions: Array.isArray(user.subscriptions) ? user.subscriptions : []
            }));
        }
        throw new Error(response.data?.message || 'Failed to fetch users');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to fetch users for admin' };
    }
};

export interface ResendLoginPinResult {
    message: string;
    loginPin: string;
    loginPinIssuedAt?: string;
}

export const resendLoginPinForUser = async (userId: string): Promise<ResendLoginPinResult> => {
    try {
        const response = await apiClient.post<
            ApiResponse<{ loginPin: string; loginPinIssuedAt?: string }>
        >(`/admin/users/${userId}/resend-login-pin`);
        if (response.data.status === 'success' && response.data.data?.loginPin) {
            return {
                message: response.data.message || 'Login PIN sent.',
                loginPin: response.data.data.loginPin,
                loginPinIssuedAt: response.data.data.loginPinIssuedAt,
            };
        }
        throw new Error(response.data?.message || 'Failed to resend login PIN');
    } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || 'Failed to resend login PIN';
        throw new Error(msg);
    }
};

export const updateUserRole = async (userId: string, newRole: 'user' | 'admin'): Promise<AdminDetailedUser> => {
    try {
        const payload = { role: newRole };
        const response = await apiClient.patch<ApiResponse<{user: AdminDetailedUser }>>(`/admin/users/${userId}/update-role`, payload);
        if (response.data.status === 'success' && response.data.data?.user) {
             if (!Array.isArray(response.data.data.user.subscriptions)) response.data.data.user.subscriptions = [];
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to update user role');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to update user role' };
    }
};

export interface CreateUserPayload {
    name: string;
    email: string;
    phoneNumber: string;
    role?: 'user' | 'admin';
}

export interface UpdateUserPasswordPayload {
    password: string;
}

export interface UpdateUserInfoPayload {
    name?: string;
    phoneNumber?: string | null;
}

export const createUser = async (payload: CreateUserPayload): Promise<AdminDetailedUser> => {
    try {
        const response = await apiClient.post<ApiResponse<{user: AdminDetailedUser}>>(`/admin/users`, payload);
        if (response.data.status === 'success' && response.data.data?.user) {
            if (!Array.isArray(response.data.data.user.subscriptions)) {
                response.data.data.user.subscriptions = [];
            }
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to create user');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to create user' };
    }
};

export const updateUserPassword = async (userId: string, payload: UpdateUserPasswordPayload): Promise<void> => {
    try {
        const response = await apiClient.patch<ApiResponse<null>>(`/admin/users/${userId}/password`, payload);
        if (response.data.status === 'success') {
            return;
        }
        throw new Error(response.data?.message || 'Failed to update user password');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to update user password' };
    }
};

export const updateUserInfo = async (userId: string, payload: UpdateUserInfoPayload): Promise<AdminDetailedUser> => {
    try {
        const response = await apiClient.patch<ApiResponse<{user: AdminDetailedUser}>>(`/admin/users/${userId}`, payload);
        if (response.data.status === 'success' && response.data.data?.user) {
            if (!Array.isArray(response.data.data.user.subscriptions)) {
                response.data.data.user.subscriptions = [];
            }
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to update user information');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to update user information' };
    }
};

export interface DeleteUserResponse {
    status: string;
    message: string;
    data: {
        deletedUser: {
            _id: string;
            email: string;
            name: string;
        };
        deletedRecords: {
            videoWatchProgress: string;
            notifications: string;
            blogPosts: number;
            videos: number;
            knowledgeBaseArticles: number;
        };
    };
}

export const deleteUser = async (userId: string): Promise<DeleteUserResponse> => {
    try {
        const response = await apiClient.delete<ApiResponse<DeleteUserResponse['data']>>(`/admin/users/${userId}`);
        if (response.data.status === 'success' && response.data.data) {
            return {
                status: 'success',
                message: response.data.message || 'User deleted successfully',
                data: response.data.data
            };
        }
        throw new Error(response.data?.message || 'Failed to delete user');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to delete user' };
    }
};

export const getUserByIdAdmin = async (userId: string): Promise<AdminDetailedUser> => {
    try {
        const response = await apiClient.get<ApiResponse<{user: AdminDetailedUser}>>(`/admin/users/${userId}`);
        if (response.data.status === 'success' && response.data.data?.user) {
            if (!Array.isArray(response.data.data.user.subscriptions)) {
                response.data.data.user.subscriptions = [];
            }
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to fetch user details');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const adminAddSubscriptionToUserService = async (userId: string, payload: AdminAddUserSubscriptionPayload): Promise<AdminDetailedUser> => {
    try {
        const response = await apiClient.post<ApiResponse<{user: AdminDetailedUser}>>(`/admin/users/${userId}/subscriptions`, payload);
        if (response.data.status === 'success' && response.data.data?.user) {
            if (!Array.isArray(response.data.data.user.subscriptions)) response.data.data.user.subscriptions = [];
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to add subscription to user');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const adminRemoveSubscriptionFromUserService = async (userId: string, subscriptionInstanceId: string): Promise<AdminDetailedUser> => {
    try {
        const response = await apiClient.delete<ApiResponse<{user: AdminDetailedUser}>>(`/admin/users/${userId}/subscriptions/${subscriptionInstanceId}`);
        if (response.data.status === 'success' && response.data.data?.user) {
            if (!Array.isArray(response.data.data.user.subscriptions)) response.data.data.user.subscriptions = [];
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to remove subscription instance');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};


// --- VIDEO & MATERIAL MANAGEMENT FUNCTIONS (Admin) ---

export interface VideoFilters {
    courseIds?: string[];
    moduleIds?: string[];
    planIds?: string[];
    isPublished?: boolean;
    videoStatus?: string;
    search?: string;
    sortBy?: 'title' | 'createdAt' | 'order';
    sortOrder?: 'asc' | 'desc';
}

export const getAllVideosAdmin = async (
    page: number = 1, 
    limit: number = 10,
    filters?: VideoFilters
): Promise<{
    videos: VideoMetadata[];
    total: number;
    page: number;
    totalPages: number;
}> => {
    try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        if (filters) {
            if (filters.courseIds && filters.courseIds.length > 0) {
                params.append('courseIds', filters.courseIds.join(','));
            }
            if (filters.moduleIds && filters.moduleIds.length > 0) {
                params.append('moduleIds', filters.moduleIds.join(','));
            }
            if (filters.planIds && filters.planIds.length > 0) {
                params.append('planIds', filters.planIds.join(','));
            }
            if (filters.isPublished !== undefined) {
                params.append('isPublished', filters.isPublished.toString());
            }
            if (filters.videoStatus) {
                params.append('videoStatus', filters.videoStatus);
            }
            if (filters.search && filters.search.trim()) {
                params.append('search', filters.search.trim());
            }
            if (filters.sortBy) {
                params.append('sortBy', filters.sortBy);
            }
            if (filters.sortOrder) {
                params.append('sortOrder', filters.sortOrder);
            }
        }

        const response = await apiClient.get<ApiResponse<{
            videos: VideoMetadata[];
            total: number;
            page: number;
            totalPages: number;
        }>>(`/admin/videos?${params.toString()}`);
        
        if (response.data.status === 'success' && response.data.data?.videos) {
            return {
                videos: response.data.data.videos.map(v => ({
                    ...v,
                    courses: Array.isArray(v.courses) ? v.courses : [],
                    modules: Array.isArray(v.modules) ? v.modules : [],
                    requiredPlans: Array.isArray(v.requiredPlans) ? v.requiredPlans : null, 
                    tags: Array.isArray(v.tags) ? v.tags : [],
                })),
                total: response.data.data.total || 0,
                page: response.data.data.page || page,
                totalPages: response.data.data.totalPages || 1,
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch videos');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const getVideoByIdAdmin = async (videoId: string): Promise<VideoMetadata> => {
    try {
        const response = await apiClient.get<ApiResponse<{video: VideoMetadata}>>(`/admin/videos/${videoId}`);
        if (response.data.status === 'success' && response.data.data?.video) {
            const video = response.data.data.video;
            return {
                ...video,
                courses: Array.isArray(video.courses) ? video.courses : [],
                modules: Array.isArray(video.modules) ? video.modules : [],
                requiredPlans: Array.isArray(video.requiredPlans) ? video.requiredPlans : null,
                tags: Array.isArray(video.tags) ? video.tags : [],
                // UPDATED: Ensure associatedMaterials is always an array
                associatedMaterials: Array.isArray(video.associatedMaterials) ? video.associatedMaterials : [],
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch video details');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const createVideoAdmin = async (videoData: CreateVideoAdminData): Promise<CreateVideoServiceResponse> => {
    try {
        const response = await apiClient.post<ApiResponse<CreateVideoServiceResponse>>(`/admin/videos`, videoData);
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data; 
        }
        throw new Error(response.data?.message || 'Failed to create video metadata entry.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const updateVideoAdmin = async (videoId: string, videoData: UpdateVideoAdminData): Promise<VideoMetadata> => {
    try {
        const response = await apiClient.patch<ApiResponse<{video: VideoMetadata}>>(`/admin/videos/${videoId}`, videoData);
        if (response.data.status === 'success' && response.data.data?.video) {
            return response.data.data.video;
        }
        throw new Error(response.data?.message || 'Failed to update video');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const deleteVideoAdmin = async (videoId: string): Promise<DeleteApiResponse> => {
    try {
        const response = await apiClient.delete<DeleteApiResponse | ''>(`/admin/videos/${videoId}`);
        if (response.status === 204) { 
            return { status: 'success', data: null, message: 'Video deleted successfully' };
        }
        if (typeof response.data === 'object' && response.data !== null && response.data.status === 'success') {
             return response.data;
        }
        if (response.status >= 200 && response.status < 300) {
            return { status: 'success', data: null, message: 'Video deleted (status implies success)' };
        }
        throw new Error((response.data as any)?.message || 'Failed to delete video');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const adminUpdateVideoStatusService = async (videoId: string, payload: UpdateVideoStatusPayload): Promise<VideoMetadata> => {
    try {
        const response = await apiClient.patch<ApiResponse<{video: VideoMetadata}>>(`/admin/videos/${videoId}/status`, payload);
        if (response.data && response.data.status === 'success' && response.data.data.video) {
            return response.data.data.video;
        }
        throw new Error(response.data?.message || 'Failed to update video status');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

// Bulk link videos to courses, modules, and/or subscription plans
export interface BulkLinkVideosPayload {
    videoIds: string[];
    courseIds?: string[];
    moduleIds?: string[];
    planIds?: string[];
}

export interface BulkLinkVideosResponse {
    status: 'success' | 'fail' | 'error';
    message: string;
    data?: {
        linkedCount: number;
        notFoundCount: number;
        totalVideos: number;
    };
}

export const bulkLinkVideosAdmin = async (payload: BulkLinkVideosPayload): Promise<BulkLinkVideosResponse> => {
    try {
        const response = await apiClient.post<ApiResponse<BulkLinkVideosResponse['data']>>('/admin/videos/bulk-link', payload);
        if (response.data && response.data.status === 'success') {
            return {
                status: 'success',
                message: response.data.message || 'Videos linked successfully',
                data: response.data.data,
            };
        }
        throw new Error(response.data?.message || 'Failed to bulk link videos');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

// --- NEW: Function to upload a material for a video ---
export const uploadMaterialForVideo = async ({ videoId, formData }: { videoId: string, formData: FormData }): Promise<Material> => {
    try {
        const response = await apiClient.post<ApiResponse<{ material: Material }>>(`/admin/materials/${videoId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        if (response.data.status === 'success' && response.data.data?.material) {
            return response.data.data.material;
        }
        throw new Error(response.data?.message || 'Failed to upload material.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

// --- NEW: Function to delete a material from a video ---
export const deleteMaterialForVideo = async ({ videoId, materialId }: { videoId: string, materialId: string }): Promise<DeleteApiResponse> => {
    try {
        const response = await apiClient.delete<DeleteApiResponse>(`/admin/materials/${videoId}/${materialId}`);
        if (response.data.status === 'success') {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to delete material.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Downloads a material file securely.
 * @returns An object containing the raw file data (blob) and the filename.
 */
export const downloadMaterialForVideo = async ({ videoId, materialId, fileName }: { videoId: string, materialId: string, fileName: string }): Promise<{ fileData: Blob, fileName: string }> => {
    try {
        const response = await apiClient.get(`/admin/materials/${videoId}/${materialId}/download`, {
            responseType: 'blob', 
        });
        return { fileData: response.data, fileName: fileName };
    } catch (error: any) {
        throw error.response?.data || error;
    }
};


// --- OTHER ADMIN FUNCTIONS (Module-Video linking, Stats) ---

export const getVideosForModuleAdminService = async (moduleId: string): Promise<{ module: Module, videos: VideoMetadata[] }> => {
    try {
        const response = await apiClient.get<ApiResponse<{ module: Module, videos: VideoMetadata[] }>>(`/admin/videos/by-module/${moduleId}`);
        if (response.data.status === 'success' && response.data.data) {
            return {
                module: response.data.data.module,
                videos: Array.isArray(response.data.data.videos) ? response.data.data.videos.map(v => ({
                    ...v, 
                    courses: Array.isArray(v.courses) ? v.courses : [], 
                    modules: Array.isArray(v.modules) ? v.modules : [],
                    requiredPlans: Array.isArray(v.requiredPlans) ? v.requiredPlans : null,
                    tags: Array.isArray(v.tags) ? v.tags : [],
                })) : []
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch videos for module');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const adminRemoveVideoFromModuleService = async (videoId: string, moduleIdToRemove: string): Promise<VideoMetadata> => {
    try {
        const response = await apiClient.patch<ApiResponse<{video: VideoMetadata}>>(
            `/admin/videos/${videoId}/modules/remove`, 
            { moduleId: moduleIdToRemove }
        );
        if (response.data.status === 'success' && response.data.data.video) {
            return response.data.data.video;
        }
        throw new Error(response.data?.message || 'Failed to remove video from module');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const adminLinkVideosToModuleService = async (moduleId: string, videoIds: string[]): Promise<LinkVideosToModuleResponse> => {
    try {
        const response = await apiClient.post<LinkVideosToModuleResponse>(
            `/admin/modules/${moduleId}/link-videos`, 
            { videoIds }
        );
        if (response.data && response.data.status === 'success') {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to link videos to module');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const getPlatformStatsAdmin = async (): Promise<PlatformStats> => {
    try {
        const response = await apiClient.get<ApiResponse<{stats: PlatformStats}>>('/admin/stats');
        if (response.data.status === 'success' && response.data.data?.stats) {
            return response.data.data.stats;
        }
        throw new Error(response.data?.message || 'Failed to fetch platform statistics');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to fetch platform statistics' };
    }
};
