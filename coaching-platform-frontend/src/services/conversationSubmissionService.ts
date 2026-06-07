import apiClient from './apiClient';
import type { UserProgressSnapshot } from './authService';

export interface ConversationExchange {
    participant1Line: string;
    participant2Line: string;
}

export interface UserConversationSubmission {
    _id: string;
    conversationId?: string;
    participant1: string;
    participant2: string;
    exchanges: ConversationExchange[];
    pointsEarned?: number;
    evaluationPoints?: number;
    exchangesCorrect?: number;
    isCorrect?: boolean | null;
    feedback?: string;
    reviewedAt?: string;
    exchangeValidations?: Array<{ exchangeIndex: number; isCorrect: boolean }>;
    createdAt: string;
}

export const getUserConversationSubmission = async (
    conversationId: string
): Promise<UserConversationSubmission | null> => {
    try {
        const response = await apiClient.get<{
            status: string;
            data: { submission: UserConversationSubmission };
        }>(`/submit-conversation-practice/${conversationId}`);
        return response.data.data.submission ?? null;
    } catch {
        return null;
    }
};

export const submitConversationPractice = async (
    conversationId: string,
    exchanges: ConversationExchange[]
): Promise<{
    submission: UserConversationSubmission;
    participationPointsAwarded?: number;
    progress?: UserProgressSnapshot;
}> => {
    const response = await apiClient.post<{
        status: string;
        data: {
            submission: UserConversationSubmission;
            participationPointsAwarded?: number;
            progress?: UserProgressSnapshot;
        };
    }>('/submit-conversation-practice', { conversationId, exchanges });
    return response.data.data;
};
