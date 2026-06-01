import apiClient from './apiClient';

export interface LearningSettings {
    maxModuleCompletionCycles: number;
    maxWatchesPerVideoPerCycle: number;
    requireQuizToUnlockNextModule: boolean;
}

export interface UserLearningOverride {
    user: string;
    maxModuleCompletionCycles?: number;
    maxWatchesPerVideoPerCycle?: number;
    notes?: string;
}

export const getAdminLearningSettings = async (): Promise<LearningSettings> => {
    const response = await apiClient.get<{ status: string; data: { settings: LearningSettings } }>(
        '/admin/learning-settings'
    );
    if (response.data?.status === 'success' && response.data.data?.settings) {
        return response.data.data.settings;
    }
    throw new Error('Failed to load learning settings');
};

export const updateAdminLearningSettings = async (updates: Partial<LearningSettings>): Promise<LearningSettings> => {
    const response = await apiClient.patch<{ status: string; data: { settings: LearningSettings } }>(
        '/admin/learning-settings',
        updates
    );
    if (response.data?.status === 'success' && response.data.data?.settings) {
        return response.data.data.settings;
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
