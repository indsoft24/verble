import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface FinalAssessmentEligibility {
    courseId: string;
    courseTitle: string;
    eligible: boolean;
    reasons: string[];
    instructions: string[];
    status: 'not_started' | 'in_progress' | 'submitted' | 'passed' | 'failed' | 'locked';
    attemptsUsed: number;
    attemptsAllowed: number;
    nextAttemptAt?: string | null;
    timeLimitMinutes: number;
    questionCount: number;
    passingScore: number;
    activeAttemptId?: string | null;
}

export interface FinalAssessmentQuestion {
    id: string;
    question: string;
    options: string[];
    points?: number;
}

export interface FinalAssessmentAttempt {
    attemptId: string;
    courseId: string;
    startedAt: string;
    expiresAt: string;
    serverNow: string;
    questions: FinalAssessmentQuestion[];
    answers: Record<string, number | null>;
}

export interface FinalAssessmentResult {
    attemptId: string;
    score: number;
    passed: boolean;
    submittedAt: string;
    correctCount?: number;
    questionCount: number;
    certificateEligible?: boolean;
    review?: Array<{
        questionId: string;
        selectedOption: number | null;
        correct?: boolean;
        explanation?: string;
    }>;
}

export const getFinalAssessmentEligibility = async (courseId: string): Promise<FinalAssessmentEligibility> => {
    const response = await apiClient.get<ApiResponse<{
        course: { _id: string; title: string };
        settings?: {
            questionCount: number;
            passingScore: number;
            timeLimitMinutes: number;
            maxAttempts: number;
        } | null;
        attemptsUsed: number;
        attemptsRemaining: number;
        cooldownUntil?: string | null;
        resumableAttemptId?: string | null;
        available: boolean;
        reasons: string[];
    }>>(
        `/final-assessments/courses/${courseId}/availability`
    );
    const data = response.data.data;
    return {
        courseId: data.course._id,
        courseTitle: data.course.title,
        eligible: data.available,
        reasons: data.reasons || [],
        instructions: [],
        status: data.resumableAttemptId ? 'in_progress' : data.available ? 'not_started' : 'locked',
        attemptsUsed: data.attemptsUsed,
        attemptsAllowed: data.attemptsUsed + data.attemptsRemaining,
        nextAttemptAt: data.cooldownUntil,
        timeLimitMinutes: data.settings?.timeLimitMinutes || 0,
        questionCount: data.settings?.questionCount || 0,
        passingScore: data.settings?.passingScore || 0,
        activeAttemptId: data.resumableAttemptId,
    };
};

export const startFinalAssessment = async (courseId: string): Promise<FinalAssessmentAttempt> => {
    const response = await apiClient.post<ApiResponse<{ attempt: {
        attemptId?: string;
        _id?: string;
        courseId?: string;
        startedAt: string;
        expiresAt: string;
        serverTime: string;
        questions: Array<{ sourceQuestion?: string; _id?: string; prompt: string; options: string[]; points?: number }>;
        answers: number[];
    } }>>(
        `/final-assessments/courses/${courseId}/start`
    );
    const item = response.data.data.attempt;
    return {
        attemptId: item.attemptId || item._id || '',
        courseId: item.courseId || courseId,
        startedAt: item.startedAt,
        expiresAt: item.expiresAt,
        serverNow: item.serverTime,
        questions: item.questions.map((question, index) => ({
            id: question.sourceQuestion || question._id || String(index),
            question: question.prompt,
            options: question.options,
            points: question.points,
        })),
        answers: Object.fromEntries(item.answers.map((answer, index) => [
            item.questions[index]?.sourceQuestion || item.questions[index]?._id || String(index),
            answer >= 0 ? answer : null,
        ])),
    };
};

export const saveFinalAssessmentAnswers = async (
    attemptId: string,
    answers: number[]
): Promise<{ savedAt: string; expiresAt?: string }> => {
    const response = await apiClient.patch<ApiResponse<{ savedAt: string; expiresAt?: string }>>(
        `/final-assessments/attempts/${attemptId}/answers`,
        { answers }
    );
    return response.data.data;
};

export const submitFinalAssessment = async (attemptId: string, answers: number[]): Promise<FinalAssessmentResult> => {
    const response = await apiClient.post<ApiResponse<{ result: FinalAssessmentResult }>>(
        `/final-assessments/attempts/${attemptId}/submit`,
        { answers }
    );
    return response.data.data.result;
};
