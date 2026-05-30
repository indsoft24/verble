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

export interface CertificateBranding {
    signatoryName: string;
    signatoryTitle: string;
    issuerTagline: string;
    hasSignature: boolean;
    hasLogo: boolean;
    signatureUrl: string | null;
    logoUrl: string | null;
    updatedAt?: string;
}

export const getCertificateBrandingAdmin = async (): Promise<CertificateBranding> => {
    const response = await apiClient.get<ApiResponse<{ branding: CertificateBranding }>>(
        '/admin/certificates/branding'
    );
    return response.data.data.branding;
};

export const updateCertificateBrandingAdmin = async (payload: {
    signatoryName?: string;
    signatoryTitle?: string;
    issuerTagline?: string;
}): Promise<CertificateBranding> => {
    const response = await apiClient.patch<ApiResponse<{ branding: CertificateBranding }>>(
        '/admin/certificates/branding',
        payload
    );
    return response.data.data.branding;
};

export const uploadCertificateSignatureAdmin = async (file: File): Promise<CertificateBranding> => {
    const formData = new FormData();
    formData.append('signature', file);
    const response = await apiClient.post<ApiResponse<{ branding: CertificateBranding }>>(
        '/admin/certificates/branding/signature',
        formData
    );
    return response.data.data.branding;
};

export const uploadCertificateLogoAdmin = async (file: File): Promise<CertificateBranding> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiClient.post<ApiResponse<{ branding: CertificateBranding }>>(
        '/admin/certificates/branding/logo',
        formData
    );
    return response.data.data.branding;
};

export const fetchBrandingImageBlob = async (relativeUrl: string): Promise<Blob> => {
    const path = relativeUrl.startsWith('/api') ? relativeUrl.replace(/^\/api/, '') : relativeUrl;
    const response = await apiClient.get<Blob>(path, { responseType: 'blob' });
    return response.data;
};

export const fetchDemoCertificatePdf = async (download = false): Promise<Blob> => {
    const response = await apiClient.get<Blob>('/admin/certificates/demo-preview', {
        params: download ? { download: '1' } : undefined,
        responseType: 'blob',
    });
    return response.data;
};
