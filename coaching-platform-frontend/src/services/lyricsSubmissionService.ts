import apiClient from './apiClient';
import type { UserProgressSnapshot } from './authService';

export interface UserLyricsSubmission {
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

export const getUserLyricsSubmission = async (lyricsId: string): Promise<UserLyricsSubmission | null> => {
    try {
        const response = await apiClient.get<{
            status: string;
            data: { submission: UserLyricsSubmission };
        }>(`/submit-lyrics-sentences/${lyricsId}`);
        return response.data.data.submission ?? null;
    } catch {
        return null;
    }
};

export const submitLyricsSentences = async (
    lyricsId: string,
    summaries: string[]
): Promise<{
    participationPointsAwarded?: number;
    progress?: UserProgressSnapshot;
    submission: UserLyricsSubmission;
}> => {
    const response = await apiClient.post<{
        status: string;
        data: {
            participationPointsAwarded?: number;
            progress?: UserProgressSnapshot;
            submission: UserLyricsSubmission;
        };
    }>('/submit-lyrics-sentences', { lyricsId, summaries });
    return {
        participationPointsAwarded: response.data.data.participationPointsAwarded,
        progress: response.data.data.progress,
        submission: response.data.data.submission,
    };
};
