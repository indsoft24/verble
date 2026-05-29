import apiClient from './apiClient';

export interface AdminLead {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    sourceUrl: string;
    sourceType?: string;
    webinarUrl?: string;
    createdAt: string;
}

interface AdminLeadsResponse {
    status: string;
    data: {
        leads: AdminLead[];
    };
}

export const getRecentLeadsAdmin = async (limit = 20): Promise<AdminLead[]> => {
    try {
        const response = await apiClient.get<AdminLeadsResponse>(`/admin/leads?limit=${limit}`);
        if (response.data?.status === 'success' && Array.isArray(response.data.data?.leads)) {
            return response.data.data.leads;
        }
        return [];
    } catch (error: unknown) {
        const axiosErr = error as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(
            axiosErr.response?.data?.message || axiosErr.message || 'Failed to load leads.'
        );
    }
};

