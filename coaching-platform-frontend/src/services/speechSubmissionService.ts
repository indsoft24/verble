import apiClient from './apiClient';
import type { UserProgressSnapshot } from './authService';

export interface UserSpeechSubmission {
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
    sentenceValidations?: { sentenceIndex: number; isCorrect: boolean }[];
}

export const getUserSpeechSubmission = async (speechId: string): Promise<UserSpeechSubmission | null> => {
    try {
        const response = await apiClient.get<{
            status: string;
            data: { submission: UserSpeechSubmission };
        }>(`/submit-speech-description/${speechId}`);
        return response.data.data.submission ?? null;
    } catch {
        return null;
    }
};

export const submitSpeechSummaries = async (
    speechId: string,
    summaries: string[]
): Promise<{
    participationPointsAwarded?: number;
    progress?: UserProgressSnapshot;
    submission: UserSpeechSubmission;
}> => {
    const response = await apiClient.post<{
        status: string;
        data: {
            participationPointsAwarded?: number;
            progress?: UserProgressSnapshot;
            submission: UserSpeechSubmission;
        };
    }>('/submit-speech-description', { speechId, summaries });
    return {
        participationPointsAwarded: response.data.data.participationPointsAwarded,
        progress: response.data.data.progress,
        submission: response.data.data.submission,
    };
};
