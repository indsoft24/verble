// src/services/dailyContentService.ts
import apiClient from './apiClient';

export interface DailyContent {
    _id: string;
    type: 'WORD' | 'PHRASE' | 'STORY' | 'VOCAB_SET' | 'CONVERSATION' | 'PUZZLE' | 'SCENE' | 'SPEECH' | 'LYRICS' | 'FEED';
    date: string;
    level: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE' | 'BONUS';
    title: string;
    metadata: any;
    isActive: boolean;
    sequenceNumber?: number;
    createdAt: string;
    updatedAt: string;
}

export interface DailyContentResponse {
    status: string;
    data: {
        content: DailyContent[];
    };
}

export interface SingleDailyContentResponse {
    status: string;
    data: {
        content: DailyContent | null;
    };
}

export const WORD_DISPLAY_NUMBER_BASE = 1111;

export const getWordDisplayNumber = (sequenceNumber?: number, base = WORD_DISPLAY_NUMBER_BASE): string => {
    if (!sequenceNumber || sequenceNumber < 1) return `#${base}`;
    return `#${base + sequenceNumber - 1}`;
};

export const getDailyContent = async (date?: Date, level?: string): Promise<DailyContent[]> => {
    const params: Record<string, string> = {};
    if (date) {
        params.date = date.toISOString().split('T')[0];
    }
    if (level) {
        params.level = level;
    }

    const response = await apiClient.get<DailyContentResponse>('/daily-content', { params });
    return response.data.data.content || [];
};

export const getTodaysDailyContent = async (): Promise<DailyContent[]> => {
    const response = await apiClient.get<DailyContentResponse>('/daily-content/today');
    return response.data.data.content || [];
};

/** Sequence-based prev/next (same type + level). */
export const getAdjacentContent = async (
    contentId: string,
    direction: 'prev' | 'next'
): Promise<DailyContent | null> => {
    try {
        const response = await apiClient.get<SingleDailyContentResponse>('/daily-content/adjacent', {
            params: { id: contentId, direction },
        });
        return response.data.data.content ?? null;
    } catch {
        return null;
    }
};

/** @deprecated Use getAdjacentContent(contentId, direction) */
export const getAdjacentContentByDate = async (
    currentDate: string,
    type: string,
    level: string,
    direction: 'prev' | 'next'
): Promise<DailyContent | null> => {
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
            type,
            level,
        },
    });

    const content = response.data.data.content || [];
    return content.length > 0 ? content[0] : null;
};
