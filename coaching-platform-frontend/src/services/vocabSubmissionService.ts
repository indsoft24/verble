import apiClient from './apiClient';

export interface VocabSentenceSubmission {
    sentence: string;
    vocabWordsUsed: string[];
}

export interface UserVocabSubmission {
    _id: string;
    sentences: VocabSentenceSubmission[];
    totalVocabWordsUsed?: number;
    pointsEarned?: number;
    evaluationPoints?: number;
    sentencesCorrect?: number;
    isCorrect?: boolean | null;
    feedback?: string;
    reviewedAt?: string;
    sentenceValidations?: Array<{ sentenceIndex: number; isCorrect: boolean }>;
    createdAt: string;
}

export const getUserVocabSubmission = async (
    vocabSetId: string
): Promise<UserVocabSubmission | null> => {
    try {
        const response = await apiClient.get<{
            status: string;
            data: { submission: UserVocabSubmission };
        }>(`/submit-vocab-sentences/${vocabSetId}`);
        return response.data.data.submission ?? null;
    } catch {
        return null;
    }
};
