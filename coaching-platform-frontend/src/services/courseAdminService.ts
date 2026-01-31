// File: src/services/courseAdminService.ts
import apiClient from './apiClient'; 
import type { Module } from './moduleAdminService';
import type { ExamCategory } from './examCategoryService';

// Interface for Course data
export interface Course {
    _id: string;
    title: string;
    description?: string;
    image?: string;
    isPublished: boolean;
    examCategory: string | ExamCategory; 
    createdAt?: string;
    updatedAt?: string;
    modules?: Module[];
}

// Interface for creating or updating a course (omitting _id, createdAt, updatedAt for create)
export interface CourseInput extends Omit<Partial<Course>, '_id' | 'createdAt' | 'updatedAt' | 'modules' | 'examCategory'> {
    title: string;
    examCategory: string; 
}

// API Response Interfaces
interface GetAllCoursesAdminResponse {
    status: string;
    results?: number;
    data: {
        courses: Course[];
    };
}

interface SingleCourseAdminResponse {
    status: string;
    data: {
        course: Course;
    };
    message?: string;
}

interface DeleteCourseAdminResponse {
    status: string;
    data: null;
    message?: string;
}

export const getAllCoursesAdmin = async (): Promise<Course[]> => {
    try {
        const response = await apiClient.get<GetAllCoursesAdminResponse>('/admin/courses');
        if (response.data.status === 'success' && response.data.data?.courses) {
            return response.data.data.courses;
        }
        throw new Error('Failed to fetch courses');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const createCourseAdmin = async (courseData: CourseInput | FormData): Promise<Course> => {
    try {
        const response = await apiClient.post<SingleCourseAdminResponse>('/admin/courses', courseData, {
            headers: {
                'Content-Type': courseData instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        if (response.data && response.data.status === 'success' && response.data.data.course) {
            return response.data.data.course;
        }
        throw new Error(response.data?.message || 'Failed to create course');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const updateCourseAdmin = async (courseId: string, courseData: Partial<CourseInput> | FormData): Promise<Course> => {
    try {
        const response = await apiClient.patch<SingleCourseAdminResponse>(`/admin/courses/${courseId}`, courseData, {
            headers: {
                'Content-Type': courseData instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        if (response.data && response.data.status === 'success' && response.data.data.course) {
            return response.data.data.course;
        }
        throw new Error(response.data?.message || 'Failed to update course');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const deleteCourseAdmin = async (courseId: string): Promise<void> => {
    try {
        const response = await apiClient.delete<DeleteCourseAdminResponse | ''>(`/admin/courses/${courseId}`);
        if (response.status === 204) return;
        if (response.data && (response.data as DeleteCourseAdminResponse).status === 'success') return;
        
        if (response.status < 200 || response.status >= 300) {
             throw new Error((response.data as any)?.message || `Failed to delete course with status ${response.status}`);
        }

    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const getCourseByIdAdmin = async (courseId: string): Promise<Course> => {
    try {
        const response = await apiClient.get<SingleCourseAdminResponse>(`/admin/courses/${courseId}`);
        if (response.data && response.data.status === 'success' && response.data.data.course) {
            return response.data.data.course;
        }
        throw new Error(response.data?.message || 'Failed to fetch course details');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};