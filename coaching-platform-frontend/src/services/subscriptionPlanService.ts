import apiClient from './apiClient';

// --- INTERFACES ---

export interface SubscriptionPlanPublic {
    _id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    duration: {
        value: number;
        unit: 'day' | 'week' | 'month' | 'year';
    };
    features?: string[];
    isActive: boolean;
    topic?: string;
    subTopic?: string;
    marketValue?: number;
    displayOrder?: number;
    badge?: string;
}

export interface GetActivePlansResponse {
    status: string;
    results?: number;
    data: {
        plans: SubscriptionPlanPublic[];
    };
    message?: string;
}

export interface FilterOptionsResponse {
    status: string;
    data: {
        topics: string[];
        subTopicsByTopic: Record<string, string[]>;
    };
    message?: string;
}

export interface UserSubscriptionInstance {
    _id?: string; 
    planId: SubscriptionPlanPublic | string; 
    planName: string; 
    status: 'none' | 'active' | 'pending_cancellation' | 'cancelled' | 'expired' | 'trial' | 'future_active';
    startDate: string | Date;
    endDate: string | Date;
    stripeSubscriptionId?: string;
}

export interface GetMySubscriptionResponse {
    status: string;
    data: {
        activeSubscriptions: UserSubscriptionInstance[];
        allSubscriptions?: UserSubscriptionInstance[];
    };
    message?: string;
}

export interface SubscribeToPlanResponse {
    status: string;
    message: string;
    data?: {
        user?: any; // Should match User type in AuthContext
        subscription?: UserSubscriptionInstance;
    };
}

interface VerifyPaymentData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planId: string;
}


// --- SERVICE FUNCTIONS ---

/**
 * Fetches all active subscription plans across the entire platform.
 * @param filters Optional filters for topic and subTopic
 */
export const getActiveSubscriptionPlans = async (filters?: { topic?: string; subTopic?: string; courseId?: string }): Promise<SubscriptionPlanPublic[]> => {
    try {
        const params = new URLSearchParams();
        if (filters?.topic) params.append('topic', filters.topic);
        if (filters?.subTopic) params.append('subTopic', filters.subTopic);
        if (filters?.courseId) params.append('courseId', filters.courseId);
        
        const queryString = params.toString();
        const url = queryString ? `/subscription-plans?${queryString}` : '/subscription-plans';
        
        const response = await apiClient.get<GetActivePlansResponse>(url);
        const responseData = response.data; 
        if (responseData?.status === 'success' && responseData.data?.plans) {
            return responseData.data.plans;
        }
        throw new Error((responseData as any)?.message || 'Failed to fetch subscription plans');
    } catch (error) {
        throw error;
    }
};

/**
 * Fetches available filter options (topics and subTopics) for subscription plans.
 */
export const getFilterOptions = async (): Promise<{ topics: string[]; subTopicsByTopic: Record<string, string[]> }> => {
    try {
        const response = await apiClient.get<FilterOptionsResponse>('/subscription-plans/filter-options');
        const responseData = response.data;
        if (responseData?.status === 'success' && responseData.data) {
            return responseData.data;
        }
        throw new Error(responseData?.message || 'Failed to fetch filter options');
    } catch (error) {
        throw error;
    }
};

/**
 * Fetches all active subscription plans for a specific course.
 * @param courseId The ID of the course for which to fetch plans.
 */
export const getSubscriptionPlansForCourse = async (courseId: string): Promise<SubscriptionPlanPublic[]> => {
    try {
        const response = await apiClient.get<GetActivePlansResponse>(`/courses/${courseId}/subscription-plans`);
        const responseData = response.data; 
        if (responseData?.status === 'success' && responseData.data?.plans) {
            return responseData.data.plans;
        }
        throw new Error(responseData?.message || 'Failed to fetch subscription plans for the course.');
    } catch (error: any) {
        throw error;
    }
};

/**
 * Subscribes the current user to a specific plan.
 * @param planId The ID of the plan to subscribe to.
 */
export const subscribeToPlanUser = async (planId: string): Promise<SubscribeToPlanResponse> => {
    try {
        const response = await apiClient.post<SubscribeToPlanResponse>(`/subscriptions/subscribe/${planId}`);
        if (response.data?.status === 'success') {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to subscribe to plan.');
    } catch (error) {
        throw error;
    }
};

/**
 * Fetches the current logged-in user's active subscription details.
 */
export const getMySubscriptionDetailsUser = async (): Promise<UserSubscriptionInstance[] | null> => {
    try {
        const response = await apiClient.get<GetMySubscriptionResponse>('/subscriptions/my-subscription');
        if (response.data?.status === 'success' && response.data?.data?.activeSubscriptions) {
            return response.data.data.activeSubscriptions;
        }
        // Response not successful, return null
        return null;
    } catch (error) {
        throw error;
    }
};

/**
 * Creates a new Razorpay order for a subscription plan.
 * @param planId The ID of the plan for which to create an order.
 */
export const createRazorpayOrder = async (planId: string): Promise<{ order: any }> => {
    try {
        const response = await apiClient.post('/payments/create-order', { planId });
        return response.data.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Verifies a Razorpay payment on the backend.
 * @param data The payment verification data from Razorpay.
 */
export const verifyRazorpayPayment = async (data: VerifyPaymentData): Promise<{ status: string; message: string; }> => {
    try {
        const response = await apiClient.post('/payments/verify-payment', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
