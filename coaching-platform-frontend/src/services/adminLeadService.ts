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
    const response = await apiClient.get<AdminLeadsResponse>(`/admin/leads?limit=${limit}`);
    return response.data?.data?.leads || [];
};

