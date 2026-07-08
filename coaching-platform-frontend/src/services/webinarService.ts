import apiClient from './apiClient';

export type WebinarMode = 'FREE' | 'PAID';
export type WebinarAudience = 'ALL' | 'FREE_ONLY' | 'PAID_SUBSCRIBERS';

export interface Webinar {
    _id: string;
    title: string;
    slug: string;
    descriptionHtml: string;
    imageUrl?: string;
    mode: WebinarMode;
    price: number;
    audience: WebinarAudience;
    topics: string[];
    startsAt: string;
    endsAt: string;
    joinWindowBeforeMinutes: number;
    joinWindowAfterMinutes: number;
    isPublished: boolean;
    isArchived: boolean;
    sortPriority: number;
    canJoinNow?: boolean;
    joinWindowOpenAt?: string;
    joinWindowCloseAt?: string;
    registration?: {
        status: 'REGISTERED' | 'PAYMENT_PENDING' | 'PAYMENT_DONE' | 'CANCELLED';
        accessGrantedBySubscription: boolean;
    } | null;
}

export interface WebinarDraft {
    title: string;
    slug?: string;
    descriptionHtml: string;
    imageUrl?: string;
    meetingLink: string;
    mode: WebinarMode;
    price: number;
    audience: WebinarAudience;
    topics: string[];
    startsAt: string;
    endsAt: string;
    joinWindowBeforeMinutes: number;
    joinWindowAfterMinutes: number;
    isPublished: boolean;
    isArchived: boolean;
    sortPriority: number;
}

interface ListResponse {
    status: string;
    data: {
        webinars: Webinar[];
    };
}

interface WebinarResponse {
    status: string;
    data: {
        webinar: Webinar;
    };
}

export const listWebinars = async (): Promise<Webinar[]> => {
    const response = await apiClient.get<ListResponse>('/webinars');
    return response.data.data.webinars || [];
};

export const getWebinarBySlug = async (slug: string): Promise<Webinar> => {
    const response = await apiClient.get<WebinarResponse>(`/webinars/slug/${encodeURIComponent(slug)}`);
    return response.data.data.webinar;
};

export const registerForWebinar = async (webinarId: string) => {
    const response = await apiClient.post(`/webinars/${webinarId}/register`);
    return response.data.data;
};

export const createWebinarPaymentOrder = async (webinarId: string) => {
    const response = await apiClient.post(`/webinars/${webinarId}/payment-order`);
    return response.data.data;
};

export const verifyWebinarPayment = async (webinarId: string, payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}) => {
    const response = await apiClient.post(`/webinars/${webinarId}/verify-payment`, payload);
    return response.data.data;
};

export const getWebinarJoinAccess = async (webinarId: string) => {
    const response = await apiClient.get(`/webinars/${webinarId}/join-access`);
    return response.data.data as {
        canJoin: boolean;
        joinAvailableAt: string;
        joinClosesAt: string;
        joinRedirectUrl: string | null;
    };
};

export const listWebinarsAdmin = async (): Promise<Webinar[]> => {
    const response = await apiClient.get<ListResponse>('/admin/webinars');
    return response.data.data.webinars || [];
};

export const getWebinarAdminById = async (webinarId: string): Promise<Webinar> => {
    const response = await apiClient.get<WebinarResponse>(`/admin/webinars/${webinarId}`);
    return response.data.data.webinar;
};

export const createWebinarAdmin = async (payload: WebinarDraft): Promise<Webinar> => {
    const response = await apiClient.post<WebinarResponse>('/admin/webinars', payload);
    return response.data.data.webinar;
};

export const updateWebinarAdmin = async (webinarId: string, payload: Partial<WebinarDraft>): Promise<Webinar> => {
    const response = await apiClient.put<WebinarResponse>(`/admin/webinars/${webinarId}`, payload);
    return response.data.data.webinar;
};

