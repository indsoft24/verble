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
    registrationCount?: number;
    registeredCount?: number;
    paymentPendingCount?: number;
    canJoinNow?: boolean;
    joinWindowOpenAt?: string;
    joinWindowCloseAt?: string;
    canRegister?: boolean;
    registrationBlockedReason?: string | null;
    registrationBlockedMessage?: string | null;
    registration?: {
        status: 'REGISTERED' | 'PAYMENT_PENDING' | 'PAYMENT_DONE' | 'CANCELLED';
        accessGrantedBySubscription: boolean;
    } | null;
}

export type WebinarRegistrationStatus = 'REGISTERED' | 'PAYMENT_PENDING' | 'PAYMENT_DONE' | 'CANCELLED';

export interface WebinarRegistrationAdminRow {
    _id: string;
    status: WebinarRegistrationStatus;
    accessGrantedBySubscription: boolean;
    payment: {
        amount?: number;
        currency?: string;
        orderId?: string;
        paymentId?: string;
        paidAt?: string;
    } | null;
    notes: string;
    createdAt: string;
    updatedAt: string;
    user: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        membershipLevel: string;
        role: string;
        joinedAt: string | null;
    } | null;
    webinar: {
        _id: string;
        title: string;
        slug: string;
        mode: WebinarMode;
        price: number;
        startsAt: string;
        endsAt: string;
        isPublished: boolean;
    } | null;
}

export interface WebinarRegistrationsAdminResult {
    registrations: WebinarRegistrationAdminRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    summary: {
        total: number;
        registered: number;
        paymentPending: number;
        paymentDone: number;
        cancelled: number;
    };
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

/** Price is stored in paise (Razorpay). */
export const formatWebinarPrice = (priceInPaise: number): string =>
    (Number(priceInPaise || 0) / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

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
    };
};

export const getWebinarJoinMeetingUrl = async (webinarId: string) => {
    const response = await apiClient.get(`/webinars/${webinarId}/join-meeting`);
    return response.data.data as {
        meetingUrl: string;
        joinedAt: string;
        registrationStatus: string;
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

export const listWebinarRegistrationsAdmin = async (params: {
    webinarId?: string;
    status?: WebinarRegistrationStatus | '';
    search?: string;
    page?: number;
    limit?: number;
}): Promise<WebinarRegistrationsAdminResult> => {
    const response = await apiClient.get<{ status: string; data: WebinarRegistrationsAdminResult }>(
        '/admin/webinars/registrations',
        {
            params: {
                webinarId: params.webinarId || undefined,
                status: params.status || undefined,
                search: params.search || undefined,
                page: params.page || 1,
                limit: params.limit || 50,
            },
        }
    );
    return response.data.data;
};

