// src/services/aiPromptService.ts
import apiClient from './apiClient';

export interface AIPrompt {
    _id: string;
    title: string;
    prompt: string;
    description?: string;
    tags: string[];
    category?: string;
    level: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
    usageCount: number;
}

export interface AIPromptsResponse {
    status: string;
    data: {
        topics: string[];
        promptsByTopic: Record<string, AIPrompt[]>;
    };
}

export interface TopicsResponse {
    status: string;
    data: {
        topics: string[];
        categories: string[];
    };
}

/**
 * Get all AI prompts grouped by topic
 */
export const getAllAIPrompts = async (level?: string): Promise<AIPromptsResponse['data']> => {
    const params: any = {};
    if (level) {
        params.level = level;
    }

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
 * Increment usage count when a prompt is copied
 */
export const incrementPromptUsage = async (promptId: string): Promise<void> => {
    await apiClient.post(`/ai-prompts/${promptId}/increment-usage`);
};
