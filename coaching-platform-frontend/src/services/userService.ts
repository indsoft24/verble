// File: src/services/userService.ts
import apiClient from './apiClient'; 
import type { User as AuthUserType } from './authService'; 
import type { CourseListItemUser } from './courseUserService';

export interface UserProfile extends AuthUserType {
}

interface UserProfileResponse {
    status: string;
    data: {
        user: UserProfile;
    };
    message?: string;
}

export interface UpdateProfileData {
    name?: string;
    phoneNumber?: string;
}

interface UpdateProfileResponse {
    status: string;
    message: string;
    data: {
        user: UserProfile; 
    };
}
export interface UpdatePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface UpdatePasswordResponse {
    status: string;
    message: string;
} 
interface GetAccessibleCoursesResponse {
    status: string;
    results?: number;
    data: {
        courses: CourseListItemUser[]; 
    };
    message?: string;
}

const API_URL_USERS = `/users`; 

// Get current user's profile
export const getCurrentUserProfile = async (): Promise<UserProfile> => {
    try {
        const response = await apiClient.get<UserProfileResponse>(`${API_URL_USERS}/me`);
        if (response.data && response.data.status === 'success' && response.data.data.user) {
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to fetch user profile: Unexpected response structure');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to fetch user profile' };
    }
};

// Update current user's profile
export const updateCurrentUserProfile = async (profileData: UpdateProfileData): Promise<UserProfile> => {
    try {
        const response = await apiClient.patch<UpdateProfileResponse>(`${API_URL_USERS}/me/update-profile`, profileData);
        if (response.data && response.data.status === 'success' && response.data.data.user) {
            return response.data.data.user;
        }
        throw new Error(response.data?.message || 'Failed to update profile: Unexpected response structure');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to update user profile' };
    }
};

// Update current user's password   
export const updateCurrentUserPassword = async (passwordData: UpdatePasswordData): Promise<UpdatePasswordResponse> => {
    try {
        const response = await apiClient.patch<UpdatePasswordResponse>(`${API_URL_USERS}/me/update-password`, passwordData);
        if (response.data && response.data.status === 'success') {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to update password: Unexpected response structure');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to update password' };
    }
};

/**
 * Fetches courses accessible by the currently logged-in user.
 */
export const getMyAccessibleCoursesService = async (): Promise<CourseListItemUser[]> => {
    try {
        const response = await apiClient.get<GetAccessibleCoursesResponse>(`${API_URL_USERS}/me/accessible-courses`);
        if (response.data && response.data.status === 'success' && response.data.data?.courses) {
            return response.data.data.courses;
        }
        throw new Error(response.data?.message || 'Failed to fetch accessible courses');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Failed to fetch accessible courses' };
    }
};