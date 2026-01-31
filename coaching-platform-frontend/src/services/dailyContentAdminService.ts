// src/services/dailyContentAdminService.ts
import apiClient from './apiClient';
import type { DailyContent } from './dailyContentService';

export interface CreateDailyContentPayload {
    type: string;
    date: string;
    level: string;
    title: string;
    metadata: any;
    isActive?: boolean;
}

export interface UpdateDailyContentPayload extends Partial<CreateDailyContentPayload> {}

export interface DailyContentAdminResponse {
    status: string;
    data: {
        content: DailyContent | DailyContent[];
    };
}

/**
 * Get all daily content (admin)
 */
export const getAllDailyContentAdmin = async (params?: {
    date?: string;
    level?: string;
    type?: string;
}): Promise<DailyContent[]> => {
    const response = await apiClient.get<DailyContentAdminResponse>('/admin/daily-content', { params });
    return Array.isArray(response.data.data.content)
        ? response.data.data.content
        : [response.data.data.content];
};

/**
 * Create daily content
 */
export const createDailyContentAdmin = async (payload: CreateDailyContentPayload): Promise<DailyContent> => {
    const response = await apiClient.post<DailyContentAdminResponse>('/admin/daily-content', payload);
    return response.data.data.content as DailyContent;
};

/**
 * Update daily content
 */
export const updateDailyContentAdmin = async (
    id: string,
    payload: UpdateDailyContentPayload
): Promise<DailyContent> => {
    const response = await apiClient.patch<DailyContentAdminResponse>(`/admin/daily-content/${id}`, payload);
    return response.data.data.content as DailyContent;
};

/**
 * Delete daily content
 */
export const deleteDailyContentAdmin = async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/daily-content/${id}`);
};
