// src/services/leaderboardService.ts
import apiClient from './apiClient';

export interface LeaderboardEntry {
    rank: number;
    userId?: string;
    name: string;
    /** Participation points; null for other users (privacy). */
    points: number | null;
    membershipLevel: string;
}

export interface LeaderboardResponse {
    status: string;
    data: {
        leaderboard: LeaderboardEntry[];
        type: 'free' | 'paid';
    };
}

export interface MyRankResponse {
    status: string;
    data: {
        rank: number | null;
        points: number;
        evaluationScore?: number;
        membershipLevel: string;
        leaderboardType: 'free' | 'paid';
    };
}

export const getFreeLeaderboard = async (limit = 100): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/free', {
        params: { limit },
    });
    return response.data.data.leaderboard;
};

export const getPaidLeaderboard = async (limit = 100): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/paid', {
        params: { limit },
    });
    return response.data.data.leaderboard;
};

export const getMyRank = async (): Promise<MyRankResponse['data']> => {
    const response = await apiClient.get<MyRankResponse>('/leaderboard/my-rank');
    return response.data.data;
};
