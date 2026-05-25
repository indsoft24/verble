import apiClient from './apiClient';

export interface UserWordSubmission {
    _id: string;
    sentence: string;
    isCorrect?: boolean;
    feedback?: string;
    correction?: string;
    createdAt: string;
}

export const getUserWordSubmissions = async (wordId: string): Promise<UserWordSubmission[]> => {
    const response = await apiClient.get<{ status: string; data: { submissions: UserWordSubmission[] } }>(
        `/submit-sentence/${wordId}`
    );
    return response.data.data.submissions || [];
};

export const submitWordSentences = async (payload: {
    wordId: string;
    word: string;
    sentences: string[];
}): Promise<void> => {
    await apiClient.post('/submit-sentence', payload);
};
