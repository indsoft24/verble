// src/services/sentenceValidationService.ts
import apiClient from './apiClient';

export interface SentenceSubmission {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        phoneNumber?: string;
        mobile?: string;
    };
    wordId?: {
        _id: string;
        title: string;
        type: string;
        metadata?: Record<string, unknown>;
    };
    storyId?: {
        _id: string;
        title: string;
        type: string;
        metadata?: Record<string, unknown>;
    };
    vocabSetId?: {
        _id: string;
        title: string;
        type: string;
        metadata?: Record<string, unknown>;
    };
    sceneId?: {
        _id: string;
        title: string;
        type: string;
        metadata?: Record<string, unknown>;
    };
    speechId?: {
        _id: string;
        title: string;
        type: string;
        metadata?: Record<string, unknown>;
    };
    word?: string;
    sentence?: string;
    sentences?: string[] | Array<{ sentence: string; vocabWordsUsed?: string[] }>;
    summary?: string[];
    sentenceValidations?: Array<{ sentenceIndex: number; isCorrect: boolean }>;
    totalVocabWordsUsed?: number;
    description?: string;
    summaries?: string[];
    answers?: Array<{ questionIndex: number; selectedOptionIndex: number }>;
    questionScores?: Array<{ questionIndex: number; score: number }>;
    isCorrect: boolean | null;
    feedback?: string;
    pointsEarned?: number;
    evaluationPoints?: number;
    sentencesCorrect?: number;
    reviewedBy?: string | { _id: string; name?: string; email?: string };
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
    submissionType: 'sentence' | 'story' | 'vocab' | 'scene' | 'speech';
}

export interface PendingSubmissionsResponse {
    status: string;
    data: {
        submissions: SentenceSubmission[];
        count: number;
        stats?: {
            total: number;
            pending: number;
            correct: number;
            incorrect: number;
        };
    };
}

export interface ValidateSubmissionRequest {
    isCorrect: boolean;
    feedback?: string;
}

export interface ValidateStorySentencesRequest {
    sentenceValidations: Array<{
        sentenceIndex: number;
        isCorrect: boolean;
    }>;
    feedback?: string;
}

export interface ValidateVocabSentencesRequest {
    sentenceValidations: Array<{
        sentenceIndex: number;
        isCorrect: boolean;
    }>;
    feedback?: string;
}

export interface ValidateSubmissionResponse {
    status: string;
    message: string;
    data: {
        submission: {
            _id: string;
            isCorrect: boolean;
            pointsEarned: number;
            evaluationPoints?: number;
            sentencesCorrect?: number;
            feedback?: string;
            reviewedAt: string;
        };
    };
}

/**
 * Get all pending submissions for review
 */
export const getPendingSubmissions = async (
    type?: 'sentence' | 'story' | 'vocab' | 'scene' | 'speech',
    limit: number = 50
): Promise<SentenceSubmission[]> => {
    const params: any = { limit };
    if (type) {
        params.type = type;
    }

    const response = await apiClient.get<PendingSubmissionsResponse>('/validate-sentence/pending', { params });
    return response.data.data.submissions;
};

/**
 * Validate a sentence submission (mark as correct/incorrect)
 */
export const validateSubmission = async (
    submissionId: string,
    data: ValidateSubmissionRequest
): Promise<ValidateSubmissionResponse> => {
    const response = await apiClient.put<ValidateSubmissionResponse>(
        `/validate-sentence/${submissionId}`,
        data
    );
    return response.data;
};

/**
 * Validate individual sentences in a story summary
 */
export const validateStorySentences = async (
    submissionId: string,
    data: ValidateStorySentencesRequest
): Promise<ValidateSubmissionResponse> => {
    const response = await apiClient.put<ValidateSubmissionResponse>(
        `/validate-sentence/story/${submissionId}/sentences`,
        data
    );
    return response.data;
};

export const validateVocabSentences = async (
    submissionId: string,
    data: ValidateVocabSentencesRequest
): Promise<ValidateSubmissionResponse> => {
    const response = await apiClient.put<ValidateSubmissionResponse>(
        `/validate-sentence/vocab/${submissionId}/sentences`,
        data
    );
    return response.data;
};

export interface ValidateSceneSubmissionRequest {
    score: number;
    feedback?: string;
}

export const validateSceneSubmission = async (
    submissionId: string,
    data: ValidateSceneSubmissionRequest
): Promise<ValidateSubmissionResponse> => {
    const response = await apiClient.put<ValidateSubmissionResponse>(
        `/validate-sentence/scene/${submissionId}/score`,
        data
    );
    return response.data;
};

/**
 * Get all submissions (pending and reviewed)
 */
export const getAllSubmissions = async (
    type?: 'sentence' | 'story' | 'vocab' | 'scene' | 'speech',
    status?: 'pending' | 'reviewed' | 'all',
    limit: number = 100
): Promise<SentenceSubmission[]> => {
    const params: any = { limit, status: status || 'all' };
    if (type) {
        params.type = type;
    }

    const response = await apiClient.get<PendingSubmissionsResponse>('/validate-sentence/all', { params });
    return response.data.data.submissions;
};
