// src/services/aiPromptService.ts
import apiClient from './apiClient';

export interface AIPrompt {
    _id: string;
    topic: string;
    title: string;
    excerpt?: string;
    prompt: string;
    content?: string;
    description?: string;
    tags: string[];
    category?: string;
    level: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
    usageCount: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AIPromptsResponse {
    status: string;
    data: {
        topics: string[];
        promptsByTopic: Record<string, AIPrompt[]>;
        prompts: AIPrompt[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export interface TopicsResponse {
    status: string;
    data: {
        topics: Array<{ value: string; count: number }>;
        tags: Array<{ value: string; count: number }>;
        categories: string[];
    };
}

export interface PromptFilters {
    topic?: string;
    tag?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'recent' | 'oldest' | 'title' | 'usage';
}

export interface SinglePromptResponse {
    status: string;
    data: {
        prompt: AIPrompt;
    };
}

export interface AIPromptInput {
    topic: string;
    title: string;
    prompt: string;
    excerpt?: string;
    content?: string;
    description?: string;
    tags?: string[];
    category?: string;
    level?: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
    isActive?: boolean;
}

export interface AdminPromptListResponse {
    prompts: AIPrompt[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Get all AI prompts with filters and grouped topics.
 */
export const getAllAIPrompts = async (filters: PromptFilters = {}): Promise<AIPromptsResponse['data']> => {
    const params: Record<string, string | number> = {};
    if (filters.topic) params.topic = filters.topic;
    if (filters.tag) params.tag = filters.tag;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.sort) params.sort = filters.sort;
    const response = await apiClient.get<AIPromptsResponse>('/ai-prompts', { params });
    return response.data.data;
};

/**
 * Get all unique topics and categories
 */
export const getAIPromptTopics = async (): Promise<TopicsResponse['data']> => {
    const response = await apiClient.get<TopicsResponse>('/ai-prompts/topics');
    return response.data.data;
};

/**
 * Get one AI prompt by id.
 */
export const getAIPromptById = async (id: string): Promise<AIPrompt> => {
    const response = await apiClient.get<SinglePromptResponse>(`/ai-prompts/${id}`);
    return response.data.data.prompt;
};

/**
 * Increment usage count when a prompt is copied
 */
export const incrementPromptUsage = async (promptId: string): Promise<void> => {
    await apiClient.post(`/ai-prompts/${promptId}/increment-usage`);
};

/**
 * Admin: create AI prompt.
 */
export const createAIPrompt = async (payload: AIPromptInput): Promise<AIPrompt> => {
    const response = await apiClient.post<SinglePromptResponse>('/ai-prompts', payload);
    return response.data.data.prompt;
};

/**
 * Admin: update AI prompt.
 */
export const updateAIPrompt = async (id: string, payload: Partial<AIPromptInput>): Promise<AIPrompt> => {
    const response = await apiClient.put<SinglePromptResponse>(`/ai-prompts/${id}`, payload);
    return response.data.data.prompt;
};

/**
 * Admin: delete AI prompt.
 */
export const deleteAIPrompt = async (id: string): Promise<void> => {
    await apiClient.delete(`/ai-prompts/${id}`);
};

/**
 * Admin: list prompts.
 */
export const getAllAIPromptsAdmin = async (filters: PromptFilters = {}): Promise<AdminPromptListResponse> => {
    const params: Record<string, string | number | boolean> = {
        includeInactive: true,
    };
    if (filters.topic) params.topic = filters.topic;
    if (filters.tag) params.tag = filters.tag;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const response = await apiClient.get<{ status: string; data: AdminPromptListResponse }>(
        '/ai-prompts/admin/list',
        { params }
    );
    return response.data.data;
};
