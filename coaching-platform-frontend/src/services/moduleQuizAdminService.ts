import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface QuizQuestionInput {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    points?: number;
}

export interface ModuleQuizAdmin {
    _id: string;
    module: {
        _id: string;
        title: string;
        order?: number;
        course?: { _id: string; title: string };
    };
    title: string;
    description?: string;
    questions: QuizQuestionInput[];
    passingScore: number;
    timeLimit: number;
    isActive: boolean;
}

export const listModuleQuizzesAdmin = async (params?: { courseId?: string; moduleId?: string }) => {
    const response = await apiClient.get<ApiResponse<{ quizzes: ModuleQuizAdmin[] }>>('/admin/module-quizzes', {
        params,
    });
    return response.data.data.quizzes;
};

export const getModuleQuizByModuleAdmin = async (moduleId: string) => {
    const response = await apiClient.get<ApiResponse<{ quiz: ModuleQuizAdmin | null }>>(
        `/admin/module-quizzes/module/${moduleId}`
    );
    return response.data.data.quiz;
};

export const createModuleQuizAdmin = async (payload: {
    moduleId: string;
    title: string;
    description?: string;
    questions: QuizQuestionInput[];
    passingScore?: number;
    timeLimit?: number;
    isActive?: boolean;
}) => {
    const response = await apiClient.post<ApiResponse<{ quiz: ModuleQuizAdmin }>>('/admin/module-quizzes', payload);
    return response.data.data.quiz;
};

export const updateModuleQuizAdmin = async (
    quizId: string,
    payload: Partial<{
        title: string;
        description: string;
        questions: QuizQuestionInput[];
        passingScore: number;
        timeLimit: number;
        isActive: boolean;
    }>
) => {
    const response = await apiClient.patch<ApiResponse<{ quiz: ModuleQuizAdmin }>>(
        `/admin/module-quizzes/${quizId}`,
        payload
    );
    return response.data.data.quiz;
};

export const deleteModuleQuizAdmin = async (quizId: string) => {
    await apiClient.delete(`/admin/module-quizzes/${quizId}`);
};

export const importModuleQuizAdmin = async (
    moduleId: string,
    payload: {
        title: string;
        description?: string;
        questions: QuizQuestionInput[];
        passingScore?: number;
        timeLimit?: number;
        isActive?: boolean;
    }
) => {
    const response = await apiClient.put<ApiResponse<{ quiz: ModuleQuizAdmin; created: boolean }>>(
        `/admin/module-quizzes/module/${moduleId}/import`,
        payload
    );
    return response.data.data;
};

export interface ModuleQuizSubmissionRow {
    _id: string;
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    submittedAt: string;
    adminNotes?: string;
    user?: { name: string; email: string };
    module?: { title: string; course?: { title: string } };
    quiz?: { title: string; passingScore: number };
}

export const listModuleQuizSubmissionsAdmin = async (params: {
    page?: number;
    limit?: number;
    courseId?: string;
    moduleId?: string;
    passed?: string;
}) => {
    const response = await apiClient.get<
        ApiResponse<{
            submissions: ModuleQuizSubmissionRow[];
            pagination: { total: number; page: number; limit: number; totalPages: number };
        }>
    >('/admin/module-quizzes/submissions', { params });
    return response.data.data;
};

export const getModuleQuizSubmissionAdmin = async (submissionId: string) => {
    const response = await apiClient.get<
        ApiResponse<{
            submission: ModuleQuizSubmissionRow & {
                detailedAnswers: {
                    question: string;
                    options: string[];
                    selectedAnswer: number;
                    correctAnswer: number | null;
                    isCorrect: boolean;
                    explanation: string;
                }[];
            };
        }>
    >(`/admin/module-quizzes/submissions/${submissionId}`);
    return response.data.data.submission;
};

export const updateModuleQuizSubmissionNotesAdmin = async (submissionId: string, adminNotes: string) => {
    await apiClient.patch(`/admin/module-quizzes/submissions/${submissionId}`, { adminNotes });
};
