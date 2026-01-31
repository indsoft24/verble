import apiClient from './apiClient';
import type { Course } from './courseAdminService'; // Assuming Course type is needed

// --- INTERFACES ---

export interface ExamCategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    isPublished: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExamCategoryInput extends Omit<Partial<ExamCategory>, '_id' | 'slug' | 'createdAt' | 'updatedAt'> {
    name: string;
}

// --- API RESPONSE TYPES ---

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

// --- SERVICE FUNCTIONS ---

// =================================================================
// PUBLIC-FACING FUNCTIONS
// =================================================================

/**
 * Fetches all published exam categories for the homepage or public listings.
 */
export const getAllPublishedExamCategories = async (): Promise<ExamCategory[]> => {
    try {
        const response = await apiClient.get<ApiResponse<{ categories: ExamCategory[] }>>('/exam-categories');
        if (response.data.status === 'success' && response.data.data?.categories) {
            return response.data.data.categories;
        }
        throw new Error('Failed to fetch exam categories.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Fetches a single category's details and all its published courses.
 */
export const getCoursesForCategory = async (slug: string): Promise<{ category: ExamCategory; courses: Course[] }> => {
    try {
        const response = await apiClient.get<ApiResponse<{ category: ExamCategory; courses: Course[] }>>(`/exam-categories/${slug}/courses`);
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to fetch courses for this category.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

// =================================================================
// ADMIN-ONLY FUNCTIONS
// =================================================================

/**
 * Fetches all exam categories for the admin panel.
 */
export const getAllExamCategoriesAdmin = async (): Promise<ExamCategory[]> => {
    try {
        // Assuming your admin route for this might be different or have different populated data
        // For now, let's assume it's the same as the admin course list endpoint structure
        const response = await apiClient.get<ApiResponse<{ categories: ExamCategory[] }>>('/exam-categories');
        if (response.data.status === 'success' && response.data.data?.categories) {
            return response.data.data.categories;
        }
        throw new Error('Failed to fetch exam categories for admin.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Creates a new exam category.
 */
export const createExamCategoryAdmin = async (categoryData: ExamCategoryInput): Promise<ExamCategory> => {
    try {
        const response = await apiClient.post<ApiResponse<{ category: ExamCategory }>>('/admin/exam-categories', categoryData);
        if (response.data.status === 'success' && response.data.data?.category) {
            return response.data.data.category;
        }
        throw new Error(response.data?.message || 'Failed to create exam category.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Updates an existing exam category.
 */
export const updateExamCategoryAdmin = async (categoryId: string, categoryData: Partial<ExamCategoryInput>): Promise<ExamCategory> => {
    try {
        const response = await apiClient.patch<ApiResponse<{ category: ExamCategory }>>(`/admin/exam-categories/${categoryId}`, categoryData);
        if (response.data.status === 'success' && response.data.data?.category) {
            return response.data.data.category;
        }
        throw new Error(response.data?.message || 'Failed to update exam category.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Deletes an exam category.
 */
export const deleteExamCategoryAdmin = async (categoryId: string): Promise<void> => {
    try {
        await apiClient.delete(`/admin/exam-categories/${categoryId}`);
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
