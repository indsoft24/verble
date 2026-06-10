import apiClient from './apiClient';

export interface LearningSettings {
    maxWatchesPerVideo: number;
    maxQuizAttempts: number;
    requireQuizToUnlockNextModule: boolean;
    /** @deprecated Always 1; kept for API compatibility */
    maxModuleCompletionCycles?: number;
    /** @deprecated Alias of maxWatchesPerVideo */
    maxWatchesPerVideoPerCycle?: number;
}

export interface UserLearningOverride {
    user: string;
    maxWatchesPerVideo?: number;
    maxQuizAttempts?: number;
    notes?: string;
    /** @deprecated */
    maxModuleCompletionCycles?: number;
    /** @deprecated */
    maxWatchesPerVideoPerCycle?: number;
}

export const getAdminLearningSettings = async (): Promise<LearningSettings> => {
    const response = await apiClient.get<{ status: string; data: { settings: LearningSettings } }>(
        '/admin/learning-settings'
    );
    if (response.data?.status === 'success' && response.data.data?.settings) {
        const s = response.data.data.settings;
        return {
            ...s,
            maxWatchesPerVideo: s.maxWatchesPerVideo ?? s.maxWatchesPerVideoPerCycle ?? 4,
            maxQuizAttempts: s.maxQuizAttempts ?? 3,
        };
    }
    throw new Error('Failed to load learning settings');
};

export const updateAdminLearningSettings = async (updates: Partial<LearningSettings>): Promise<LearningSettings> => {
    const response = await apiClient.patch<{ status: string; data: { settings: LearningSettings } }>(
        '/admin/learning-settings',
        updates
    );
    if (response.data?.status === 'success' && response.data.data?.settings) {
        const s = response.data.data.settings;
        return {
            ...s,
            maxWatchesPerVideo: s.maxWatchesPerVideo ?? s.maxWatchesPerVideoPerCycle ?? 4,
            maxQuizAttempts: s.maxQuizAttempts ?? 3,
        };
    }
    throw new Error('Failed to update learning settings');
};

export const getUserLearningOverride = async (userId: string): Promise<UserLearningOverride | null> => {
    const response = await apiClient.get<{ status: string; data: { override: UserLearningOverride | null } }>(
        `/admin/users/${userId}/learning-override`
    );
    if (response.data?.status === 'success') {
        return response.data.data.override;
    }
    throw new Error('Failed to load user learning override');
};

export const putUserLearningOverride = async (
    userId: string,
    updates: Partial<UserLearningOverride>
): Promise<UserLearningOverride> => {
    const response = await apiClient.put<{ status: string; data: { override: UserLearningOverride } }>(
        `/admin/users/${userId}/learning-override`,
        updates
    );
    if (response.data?.status === 'success' && response.data.data?.override) {
        return response.data.data.override;
    }
    throw new Error('Failed to save user learning override');
};

export const postUserLearningReset = async (
    userId: string,
    body: { scope: 'module' | 'course'; moduleId?: string; courseId?: string }
): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/learning-reset`, body);
};
