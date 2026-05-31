import apiClient from './apiClient';

export interface UserSceneSubmission {
    _id: string;
    summaries?: string[];
    sentences?: string[];
    description?: string;
    pointsEarned?: number;
    evaluationPoints?: number;
    sentencesCorrect?: number;
    isCorrect?: boolean | null;
    feedback?: string;
    reviewedAt?: string;
    createdAt: string;
}

export const getUserSceneSubmission = async (sceneId: string): Promise<UserSceneSubmission | null> => {
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

export const submitSceneSummaries = async (
    sceneId: string,
    summaries: string[]
): Promise<{
    participationPointsAwarded?: number;
    submission: UserSceneSubmission;
}> => {
    const response = await apiClient.post<{
        status: string;
        data: {
            participationPointsAwarded?: number;
            submission: UserSceneSubmission;
        };
    }>('/submit-scene-description', { sceneId, summaries });
    return {
        participationPointsAwarded: response.data.data.participationPointsAwarded,
        submission: response.data.data.submission,
    };
};
