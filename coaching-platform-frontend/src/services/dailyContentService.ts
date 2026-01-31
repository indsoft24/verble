// src/services/dailyContentService.ts
import apiClient from './apiClient';

export interface DailyContent {
    _id: string;
    type: 'WORD' | 'PHRASE' | 'STORY' | 'VOCAB_SET' | 'CONVERSATION' | 'PUZZLE' | 'SCENE' | 'SPEECH' | 'LYRICS' | 'FEED';
    date: string;
    level: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
    title: string;
    metadata: any;
    isActive: boolean;
    sequenceNumber?: number; // Sequence number for this content type and level
    createdAt: string;
    updatedAt: string;
}

export interface DailyContentResponse {
    status: string;
    data: {
        content: DailyContent[];
    };
}

/**
 * Get daily content for a specific date and level
 */
export const getDailyContent = async (date?: Date, level?: string): Promise<DailyContent[]> => {
    const params: any = {};
    if (date) {
        params.date = date.toISOString().split('T')[0];
    }
    if (level) {
        params.level = level;
    }

    const response = await apiClient.get<DailyContentResponse>('/daily-content', { params });
    return response.data.data.content || [];
};

/**
 * Get today's daily content for all levels
 */
export const getTodaysDailyContent = async (): Promise<DailyContent[]> => {
    const today = new Date();
    const response = await apiClient.get<DailyContentResponse>('/daily-content/today');
    return response.data.data.content || [];
};

/**
 * Get previous or next content of a specific type
 */
export const getAdjacentContent = async (
    currentDate: string,
    type: string,
    level: string,
    direction: 'prev' | 'next'
): Promise<DailyContent | null> => {
    try {
        const currentDateObj = new Date(currentDate);
        const targetDate = new Date(currentDateObj);
        
        if (direction === 'prev') {
            targetDate.setDate(targetDate.getDate() - 1);
        } else {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const response = await apiClient.get<DailyContentResponse>('/daily-content', {
            params: {
                date: targetDate.toISOString().split('T')[0],
                type: type,
                level: level
            }
        });

        const content = response.data.data.content || [];
        return content.length > 0 ? content[0] : null;
    } catch (error) {
        return null;
    }
};
