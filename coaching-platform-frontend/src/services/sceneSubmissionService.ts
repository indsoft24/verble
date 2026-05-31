import apiClient from './apiClient';

export interface UserSceneSubmission {
    _id: string;
    description: string;
    sentences: string[];
    pointsEarned?: number;
    evaluationPoints?: number;
    sentencesCorrect?: number;
    isCorrect?: boolean | null;
    feedback?: string;
    reviewedAt?: string;
    createdAt: string;
}

export const getUserSceneSubmission = async (
    sceneId: string
): Promise<UserSceneSubmission | null> => {
    try {
        const response = await apiClient.get<{
            status: string;
            data: { submission: UserSceneSubmission };
        }>(`/submit-scene-description/${sceneId}`);
        return response.data.data.submission ?? null;
    } catch {
        return null;
    }
};
