import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export type ScoringCategory = 'participation' | 'evaluation' | 'puzzle' | 'module_quiz';
export type ScoringEventStatus = 'pending' | 'approved' | 'info';

export interface ScoringSummary {
    userId: string;
    name?: string;
    email?: string;
    leaderboardPoints: number;
    evaluationScore: number;
    coins: number;
    pendingReviewCount: number;
    lastActivityAt: string | null;
}

export interface ScoringHistoryEvent {
    id: string;
    category: ScoringCategory;
    title: string;
    points: number;
    delta: number;
    status: ScoringEventStatus;
    occurredAt: string;
    sourceType: string;
    sourceId: string;
    meta?: Record<string, unknown>;
}

export interface ScoringHistoryPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface AdminScoringUserRow {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    leaderboardPoints: number;
    evaluationScore: number;
    coins: number;
    pendingReviewCount: number;
    lastActivityAt: string | null;
}

export const getMyScoringSummary = async (): Promise<ScoringSummary> => {
    const res = await apiClient.get<ApiResponse<ScoringSummary>>('/users/me/scoring-summary');
    return res.data.data;
};

export const getMyScoringHistory = async (params?: {
    page?: number;
    limit?: number;
    category?: string;
}): Promise<{ events: ScoringHistoryEvent[]; pagination: ScoringHistoryPagination }> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    const res = await apiClient.get<
        ApiResponse<{ events: ScoringHistoryEvent[]; pagination: ScoringHistoryPagination }>
    >(`/users/me/scoring-history${qs.toString() ? `?${qs}` : ''}`);
    return res.data.data;
};

export const getAdminScoringUsers = async (params?: {
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ users: AdminScoringUserRow[]; pagination: ScoringHistoryPagination }> => {
    const qs = new URLSearchParams();
    if (params?.search?.trim()) qs.set('search', params.search.trim());
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const res = await apiClient.get<
        ApiResponse<{ users: AdminScoringUserRow[]; pagination: ScoringHistoryPagination }>
    >(`/admin/scoring/users${qs.toString() ? `?${qs}` : ''}`);
    return res.data.data;
};

export const getAdminUserScoringSummary = async (userId: string): Promise<ScoringSummary> => {
    const res = await apiClient.get<ApiResponse<ScoringSummary>>(`/admin/users/${userId}/scoring-summary`);
    return res.data.data;
};

export const getAdminUserScoringHistory = async (
    userId: string,
    params?: { page?: number; limit?: number; category?: string }
): Promise<{ events: ScoringHistoryEvent[]; pagination: ScoringHistoryPagination }> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    const res = await apiClient.get<
        ApiResponse<{ events: ScoringHistoryEvent[]; pagination: ScoringHistoryPagination }>
    >(`/admin/users/${userId}/scoring-history${qs.toString() ? `?${qs}` : ''}`);
    return res.data.data;
};

export const categoryLabel = (c: ScoringCategory): string => {
    switch (c) {
        case 'participation':
            return 'Participation';
        case 'evaluation':
            return 'Evaluation';
        case 'puzzle':
            return 'Puzzle';
        case 'module_quiz':
            return 'Module quiz';
        default:
            return c;
    }
};

/** Strip redundant category prefix; category chip already conveys the type. */
export const formatActivityTitle = (title: string, category: ScoringCategory): string => {
    const trimmed = title.trim();
    const prefixes: Record<ScoringCategory, RegExp> = {
        participation: /^Participation:\s*/i,
        evaluation: /^Review:\s*/i,
        puzzle: /^Puzzle:\s*/i,
        module_quiz: /^Quiz:\s*/i,
    };
    return trimmed.replace(prefixes[category] || /^/, '').trim() || trimmed;
};

export const formatPointsDisplay = (points: number, delta: number): string => {
    const value = delta !== 0 ? delta : points;
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return '0';
};

export const statusLabel = (status: ScoringEventStatus, category: ScoringCategory): string => {
    if (status === 'info' && category === 'module_quiz') return 'Attempt';
    if (status === 'approved' && category === 'module_quiz') return 'Passed';
    return status;
};
