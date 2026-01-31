// File: src/services/subscriptionPlanAdminService.ts
import apiClient from './apiClient';
import type { Course } from './courseAdminService';

export interface SubscriptionPlanDuration {
    value: number;
    unit: 'day' | 'week' | 'month' | 'year';
}

export interface SubscriptionPlan {
    _id: string;
    name: string;
    description?: string;
    image?: string;
    price: number; // Store in cents
    currency: string; // e.g., 'USD', 'INR'
    duration: SubscriptionPlanDuration;
    features?: string[];
    stripePriceId?: string;
    isActive: boolean;
    course: string | Course;
    topic?: string;
    subTopic?: string;
    createdAt?: string;
    updatedAt?: string;
}

// For creating or updating, _id is not needed for create
export interface SubscriptionPlanInput extends Omit<SubscriptionPlan, '_id' | 'createdAt' | 'updatedAt' | 'course'> { 
    _id?: string; 
    course: string | Course;
}


// Response for getting all plans
interface GetAllPlansAdminResponse {
    status: string;
    results?: number;
    data: {
        plans: SubscriptionPlan[];
    };
}

// Response for single plan operations (create, getById, update)
interface SinglePlanAdminResponse {
    status: string;
    data: {
        plan: SubscriptionPlan;
    };
    message?: string;
}

// Response for delete operation
interface DeletePlanAdminResponse {
    status: string;
    data: null;
    message?: string;
}

export const getAllSubscriptionPlansAdmin = async (courseId?: string): Promise<SubscriptionPlan[]> => {
    try {
        const params = courseId ? { courseId } : {};
        const response = await apiClient.get<GetAllPlansAdminResponse>('/admin/subscription-plans', { params });
        if (response.data?.status === 'success' && response.data.data?.plans) {
            return response.data.data.plans;
        }
        throw new Error('Failed to fetch subscription plans');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const createSubscriptionPlanAdmin = async (planData: Omit<SubscriptionPlanInput, '_id'> | FormData): Promise<SubscriptionPlan> => {
    try {
        const response = await apiClient.post<SinglePlanAdminResponse>('/admin/subscription-plans', planData, {
            headers: {
                'Content-Type': planData instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        if (response.data && response.data.status === 'success' && response.data.data.plan) {
            return response.data.data.plan;
        }
        throw new Error(response.data?.message || 'Failed to create subscription plan');
    } catch (error) {
        throw error;
    }
};

export const updateSubscriptionPlanAdmin = async (planId: string, planData: Partial<SubscriptionPlanInput> | FormData): Promise<SubscriptionPlan> => {
    try {
        const response = await apiClient.patch<SinglePlanAdminResponse>(`/admin/subscription-plans/${planId}`, planData, {
            headers: {
                'Content-Type': planData instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        if (response.data && response.data.status === 'success' && response.data.data.plan) {
            return response.data.data.plan;
        }
        throw new Error(response.data?.message || 'Failed to update subscription plan');
    } catch (error) {
        throw error;
    }
};

export const deleteSubscriptionPlanAdmin = async (planId: string): Promise<void> => {
    try {
        // Backend returns 204 No Content, so response.data might be empty or null
        await apiClient.delete<DeletePlanAdminResponse>(`/admin/subscription-plans/${planId}`);
        // No specific data to return on successful delete, void is fine.
    } catch (error) {
        throw error;
    }
};