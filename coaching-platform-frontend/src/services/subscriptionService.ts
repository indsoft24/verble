import axios from 'axios';

// This should be your central, configured Axios instance.
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', // Your backend API base URL
    headers: {
        'Content-Type': 'application/json',
    }
});

// An interceptor to automatically add the auth token to every request.
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken'); // Adjust if you store your token differently
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


// --- TYPE DEFINITIONS ---
// Standardized types for your application

export interface PlanDuration {
    value: number;
    unit: 'day' | 'week' | 'month' | 'year';
}

export interface SubscriptionPlanPublic {
    _id: string;
    name: string;
    description?: string;
    image?: string;
    price: number;
    currency: string;
    duration: PlanDuration;
    features: string[];
    isActive: boolean;
}

export interface UserSubscriptionInstance {
    _id: string;
    planId: SubscriptionPlanPublic | string; // Can be populated or just an ID
    planName: string;
    status: 'active' | 'expired' | 'cancelled';
    startDate?: string | Date;
    endDate?: string | Date;
}

// --- API FUNCTIONS ---

/**
 * Fetches all active subscription plans.
 */
export const getActiveSubscriptionPlans = async (): Promise<SubscriptionPlanPublic[]> => {
    try {
        const response = await apiClient.get('/subscription-plans');
        return response.data.data.plans;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch subscription plans.');
    }
};

/**
 * Fetches all active subscription plans for a specific course.
 * @param courseId The ID of the course for which to fetch plans.
 */
export const getSubscriptionPlansForCourse = async (courseId: string): Promise<SubscriptionPlanPublic[]> => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/subscription-plans`);
        return response.data.data.plans;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch plans for the course.');
    }
};

/**
 * Fetches the current user's active subscriptions.
 */
export const getMySubscriptionDetailsUser = async (): Promise<UserSubscriptionInstance[]> => {
    try {
        const response = await apiClient.get('/subscriptions/my-subscription');
        return response.data.data.activeSubscriptions;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch user's subscriptions.");
    }
};

/**
 * Creates a Razorpay order on the backend.
 * @param planId The ID of the plan the user wants to purchase.
 */
export const createRazorpayOrder = async (planId: string): Promise<{ order: any }> => {
    try {
        const response = await apiClient.post('/payments/create-order', { planId });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Could not initiate payment.');
    }
};

/**
 * Sends payment details to the backend for verification.
 * @param verificationData The payment details from Razorpay.
 */
export const verifyRazorpayPayment = async (verificationData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    planId: string;
}): Promise<{ message: string }> => {
    try {
        const response = await apiClient.post('/payments/verify-payment', verificationData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Payment verification failed.');
    }
};

