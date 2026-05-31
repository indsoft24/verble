import apiClient from './apiClient';

export interface UserStorySubmission {
    _id: string;
    summary: string[];
    pointsEarned?: number;
    evaluationPoints?: number;
    sentencesCorrect?: number;
    isCorrect?: boolean | null;
    feedback?: string;
    reviewedAt?: string;
    sentenceValidations?: Array<{ sentenceIndex: number; isCorrect: boolean }>;
    createdAt: string;
}

export const getUserStorySubmission = async (storyId: string): Promise<UserStorySubmission | null> => {
    try {
        const response = await apiClient.get<{
            status: string;
            data: { submission: UserStorySubmission };
        }>(`/submit-story-summary/${storyId}`);
        return response.data.data.submission ?? null;
    } catch {
        return null;
    }
};
