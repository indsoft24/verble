// File: src/services/videoService.ts (Update this file)

import apiClient from './apiClient'; 
import type { VideoMetadata } from './adminService'; 

export interface BasicSubscriptionPlan {
    _id: string;
    name: string;
}

// Interface for a single video item in the list 
export interface VideoListItem {
    _id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    bunnyThumbnailUrl?: string;
    durationSeconds?: number;
    tags?: string[];
    createdAt: string;
    requiredPlans?: Array<string | BasicSubscriptionPlan> | null;
    canAccess?: boolean; 
    videoStatus?: string;
    courses?: Array<{ _id: string; title: string; }>; 
    modules?: Array<{ _id: string; title: string; }>;
}

// Interface for the API response for fetching all videos
export interface GetAllVideosResponse {
    status: string;
    results: number;
    data: {
        videos: VideoListItem[];
    };
     message?: string;
}

export interface GetAllVideosUserApiResponse {
    status: string;
    results?: number;
    totalResults?: number;    
    currentPage?: number;     
    totalPages?: number;      
    data: {
        videos: VideoListItem[];
    };
    message?: string;
}

export interface GetSingleVideoUserApiResponse {
    status: string;
    data: {
        video: VideoDetail; 
    };
    message?: string; 
}


// This is the detailed object we expect for the watch page
export interface VideoDetail extends VideoMetadata {
    canAccess?: boolean; // Add canAccess to the type
    watchCount?: number; // Number of times video has been watched in current cycle
    remainingWatches?: number; // Remaining watches allowed (0-2)
}

interface GetVideoResponse {
    status: string;
    data: {
        video: VideoDetail;
    };
    message?: string;
    code?: string;
}

/**
 * Fetches a single video's details for a logged-in user.
 * The backend will perform access checks.
 */
export const getVideoByIdForUser = async (videoId: string): Promise<VideoDetail> => {
    try {
        const response = await apiClient.get<GetVideoResponse>(`/videos/${videoId}`);
        if (response.data?.status === 'success' && response.data.data?.video) {
            return response.data.data.video;
        }
        // This allows us to throw an error but still access the partial data for the UI
        throw response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};


interface PlayTokenResponse {
    status: string;
    data: {
        token: string;
        expires: number;
    };
}

export const getVideoPlayToken = async (videoId: string): Promise<PlayTokenResponse['data']> => {
    try {
        const response = await apiClient.get<PlayTokenResponse>(`/videos/${videoId}/get-play-token`);
        return response.data.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};


// Interface for the API response for fetching a single video
export interface GetSingleVideoResponse {
    status: string;
    data: {
        video: VideoDetail;
    };
    message?: string; 
}


/**
 * Fetches all published videos for users.
 */
export const getAllPublishedVideosUser = async (
    page = 1, 
    limit = 12, 
    searchTerm?: string | null
): Promise<{
    videos: VideoListItem[],
    totalResults: number,
    totalPages: number,
    currentPage: number
}> => {
    try {
        const params: { page: number; limit: number; search?: string } = { page, limit };
        if (searchTerm && searchTerm.trim() !== '') {
            params.search = searchTerm.trim();
        }
        // LAW-only endpoint
        const response = await apiClient.get<GetAllVideosUserApiResponse>('/kn/videos', { params });
        
        if (response.data && response.data.status === 'success' && response.data.data?.videos) {
            return {
                videos: response.data.data.videos,
                totalResults: response.data.totalResults || 0,
                totalPages: response.data.totalPages || 1,
                currentPage: response.data.currentPage || 1,
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch published videos');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Could not load videos.' };
    }
};

/**
 * Fetches a single published video by its ID for users.
 * Assumes the API endpoint is protected and requires authentication.
 */
export const getPublishedVideoByIdUser = async (videoId: string): Promise<VideoDetail> => {
    try {
        const response = await apiClient.get<GetSingleVideoUserApiResponse>(`/videos/${videoId}`);
        if (response.data && response.data.status === 'success' && response.data.data?.video) {
            const video = response.data.data.video;
            return video;
        }
        throw new Error(response.data?.message || 'Failed to fetch video details');
    } catch (error: any) {
        if (error.response?.status === 403 && error.response?.data?.data?.video) {
            return error.response.data.data.video as VideoDetail;
        }
        throw error.response?.data || { status: 'error', message: 'Could not load video details.' };
    }
};

/**
 * Downloads a material file securely for a logged-in user.
 * This should be added to your existing videoService.ts file.
 * @returns An object containing the raw file data (blob) and the filename.
 */
export const downloadMaterialForUser = async ({ videoId, materialId, fileName }: { videoId: string, materialId: string, fileName: string }): Promise<{ fileData: Blob, fileName: string }> => {
    try {
        const response = await apiClient.get(`/materials/${videoId}/${materialId}/download`, {
            responseType: 'blob',
        });
        return { fileData: response.data, fileName: fileName };
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Mark a video as completed and update watch progress
 * @param videoId - The video ID
 * @returns Updated progress information
 */
interface MarkVideoCompletedResponse {
    status: string;
    data: {
        message: string;
        watchCount: number;
        remainingWatches: number;
        setComplete: boolean;
        moduleComplete: boolean;
        nextCycleStarted: boolean;
    };
}

export const markVideoCompleted = async (videoId: string): Promise<MarkVideoCompletedResponse['data']> => {
    try {
        const response = await apiClient.post<MarkVideoCompletedResponse>(`/videos/${videoId}/complete`);
        if (response.data?.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data?.data?.message || 'Failed to mark video as completed');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};