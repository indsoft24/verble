import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface ModuleQuizQuestion {
    _id: string;
    question: string;
    options: string[];
    points: number;
}

export interface ModuleQuizForStudent {
    _id: string;
    title: string;
    description?: string;
    questions: ModuleQuizQuestion[];
    passingScore: number;
    timeLimit: number;
    module?: { _id: string; title: string; order?: number };
}

export interface ModuleCompletionStatus {
    videosCompleted: number;
    totalVideos: number;
    quizPassed: boolean;
    quizScore?: number;
    isCompleted: boolean;
    completedAt?: string;
    hasQuiz: boolean;
    videosComplete: boolean;
}

export type ModuleQuizState = 'locked' | 'ready' | 'passed' | 'exhausted';

export interface ModuleQuizAvailability {
    hasQuiz: boolean;
    videosComplete: boolean;
    videosCompleted?: number;
    totalVideos?: number;
    canTakeQuiz: boolean;
    isModuleComplete: boolean;
    quizState: ModuleQuizState;
    currentCycle: number;
    maxCycles: number;
    cyclesCompleted: number;
    quizFailedAttempts: number;
    maxQuizAttempts: number;
    needsAdminReset: boolean;
    quizUnlocked?: boolean;
    quizPassed?: boolean;
    message: string;
}

export const getModuleQuizAvailability = async (moduleId: string): Promise<ModuleQuizAvailability> => {
    const response = await apiClient.get<ApiResponse<ModuleQuizAvailability>>(
        `/module-quizzes/${moduleId}/availability`
    );
    return response.data.data;
};

export const getModuleCompletionStatus = async (moduleId: string): Promise<ModuleCompletionStatus> => {
    const response = await apiClient.get<ApiResponse<{ completion: ModuleCompletionStatus }>>(
        `/module-quizzes/${moduleId}/completion`
    );
    return response.data.data.completion;
};

export const getModuleQuiz = async (moduleId: string) => {
    const response = await apiClient.get<
        ApiResponse<{
            quiz: ModuleQuizForStudent;
            previousAttempts: number;
            bestScore: number | null;
            hasPassed: boolean;
            videosComplete: boolean;
            moduleCompleted: boolean;
        }>
    >(`/module-quizzes/${moduleId}`);
    return response.data.data;
};

export const submitModuleQuiz = async (
    moduleId: string,
    answers: { selectedAnswer: number }[],
    timeSpent = 0
) => {
    const response = await apiClient.post<
        ApiResponse<{
            submission: {
                _id: string;
                score: number;
                passed: boolean;
                correctAnswers: number;
                totalQuestions: number;
                moduleCompleted: boolean;
                retakeMessage?: string;
                answers: { questionId: string; isCorrect: boolean; pointsEarned: number }[];
            };
        }>
    >(`/module-quizzes/${moduleId}/submit`, { answers, timeSpent });
    return response.data.data.submission;
};

export const getModuleQuizSubmissionDetail = async (moduleId: string, submissionId: string) => {
    const response = await apiClient.get<ApiResponse<{ submission: Record<string, unknown> }>>(
        `/module-quizzes/${moduleId}/submission/${submissionId}`
    );
    return response.data.data.submission;
};
