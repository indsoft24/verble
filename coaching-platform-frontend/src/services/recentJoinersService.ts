// src/services/recentJoinersService.ts
import apiClient from './apiClient';

export interface RecentJoiner {
    name: string;
    city: string;
    joinedAt: string;
}

export interface RecentJoinersResponse {
    status: string;
    data: {
        joiners: RecentJoiner[];
    };
}

export const getRecentJoiners = async (limit = 10): Promise<RecentJoiner[]> => {
    const response = await apiClient.get<RecentJoinersResponse>('/recent-joiners', {
        params: { limit },
    });
    return response.data.data.joiners;
};
