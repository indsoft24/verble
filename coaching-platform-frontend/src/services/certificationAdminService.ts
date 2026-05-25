import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface CertificateRuleRow {
    course: { _id: string; title: string; isPublished: boolean };
    rule: {
        _id: string;
        isEnabled: boolean;
        requireAssessment: boolean;
        passingScore: number;
        minimumCompletionPercent: number;
        readOnlyMode: boolean;
    };
}

export interface IssuedCertificateRow {
    _id: string;
    certificateNumber: string;
    userName: string;
    userEmail: string;
    courseTitle: string;
    completionPercent: number;
    assessmentScore: number | null;
    issuedAt: string;
    pdfUrl: string;
}

export const getCertificateRulesAdmin = async (): Promise<CertificateRuleRow[]> => {
    const response = await apiClient.get<ApiResponse<{ rules: CertificateRuleRow[] }>>('/admin/certificates/rules');
    return response.data.data.rules || [];
};

export const updateCertificateRuleAdmin = async (
    courseId: string,
    payload: Partial<CertificateRuleRow['rule']>
) => {
    const response = await apiClient.patch<ApiResponse<{ rule: CertificateRuleRow['rule'] }>>(
        `/admin/certificates/rules/${courseId}`,
        payload
    );
    return response.data.data.rule;
};

export const getIssuedCertificatesAdmin = async (params: { page: number; limit: number; courseId?: string }) => {
    const response = await apiClient.get<ApiResponse<{
        certificates: IssuedCertificateRow[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
    }>>('/admin/certificates/issued', { params });
    return response.data.data;
};
