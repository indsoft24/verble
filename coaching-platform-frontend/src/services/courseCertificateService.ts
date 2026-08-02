import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface CertificationPillars {
    modules: { percent: number; met: boolean };
    moduleQuizzes: { averageBestScore: number; allRequiredPassed: boolean; met: boolean };
    dailySubmissions: { reviewedCount: number; successPercent: number; met: boolean };
    overallSubmissions: { successPercent: number; met: boolean };
    assessment: { score: number | null; met: boolean };
}

export interface CourseCertificateEligibility {
    totalModules: number;
    completedModules: number;
    completionPercent: number;
    assessmentScore: number | null;
    isEligible: boolean;
    passed?: boolean;
    reportCardAvailable?: boolean;
    pillars?: CertificationPillars;
    reasons: string[];
    finalAssessment?: {
        enabled: boolean;
        ready: boolean;
        passed: boolean;
        status?: string;
        attemptsUsed?: number;
        attemptsAllowed?: number;
    };
    rule: {
        isEnabled: boolean;
        requireAssessment: boolean;
        passingScore: number;
        minimumCompletionPercent: number;
        readOnlyMode: boolean;
        requireModuleQuizzes?: boolean;
        minimumModuleQuizScore?: number;
        requireDailySubmissions?: boolean;
        minimumDailySubmissionPercent?: number;
        dailySubmissionLookbackDays?: number;
        minimumOverallSubmissionPercent?: number;
    };
}

export interface MyCourseCertificate {
    _id: string;
    course: string;
    courseTitle: string;
    certificateNumber: string;
    verificationCode: string;
    pdfUrl: string;
    issuedAt: string;
    type?: 'module' | 'course';
    module?: string | null;
    moduleTitle?: string | null;
    status?: 'active' | 'revoked';
    revokedAt?: string | null;
}

export interface MyCertificateCredential extends MyCourseCertificate {
    type: 'module' | 'course';
    status: 'active' | 'revoked';
}

export interface PublicCertificateVerification {
    valid: boolean;
    status: 'active' | 'revoked' | 'invalid';
    certificate?: {
        certificateNumber: string;
        type: 'module' | 'course';
        learnerName: string;
        courseTitle: string;
        moduleTitle?: string | null;
        issuedAt: string;
        revokedAt?: string | null;
        issuerName?: string;
    };
}

export const getCourseCertificateEligibility = async (courseId: string): Promise<CourseCertificateEligibility> => {
    const response = await apiClient.get<ApiResponse<CourseCertificateEligibility>>(
        `/course-certificates/courses/${courseId}/eligibility`
    );
    return response.data.data;
};

export const generateCourseCertificateForMe = async (courseId: string): Promise<MyCourseCertificate> => {
    const response = await apiClient.post<ApiResponse<{ certificate: MyCourseCertificate }>>(
        `/course-certificates/courses/${courseId}/generate`
    );
    return response.data.data.certificate;
};

export const getCourseReportCard = async (courseId: string) => {
    const response = await apiClient.get<
        ApiResponse<{
            available: boolean;
            reportCard?: Record<string, unknown>;
            pillars?: CertificationPillars;
            reasons?: string[];
            finalAssessment?: CourseCertificateEligibility['finalAssessment'];
        }>
    >(`/course-certificates/courses/${courseId}/report-card`);
    return response.data.data;
};

export const getMyCourseCertificates = async (): Promise<MyCourseCertificate[]> => {
    const response = await apiClient.get<ApiResponse<{ certificates: MyCourseCertificate[] }>>(
        `/course-certificates/my-course-certificates`
    );
    return response.data.data.certificates || [];
};

export const getMyCertificates = async (): Promise<MyCertificateCredential[]> => {
    const response = await apiClient.get<ApiResponse<{ certificates: Array<{
        _id: string;
        type: string;
        course?: { _id: string; title: string } | string | null;
        module?: { _id: string; title: string } | string | null;
        certificateNumber: string;
        verificationCode: string;
        subjectSnapshot?: { courseTitle?: string; moduleTitle?: string };
        issuedAt: string;
        revokedAt?: string | null;
    }> }>>(
        '/learning-certificates/mine'
    );
    return (response.data.data.certificates || []).map((item) => ({
        _id: item._id,
        type: item.type.toLowerCase() === 'module' ? 'module' : 'course',
        course: typeof item.course === 'object' && item.course ? item.course._id : item.course || '',
        module: typeof item.module === 'object' && item.module ? item.module._id : item.module || null,
        courseTitle: item.subjectSnapshot?.courseTitle || (typeof item.course === 'object' ? item.course?.title : '') || '',
        moduleTitle: item.subjectSnapshot?.moduleTitle || (typeof item.module === 'object' ? item.module?.title : null) || null,
        certificateNumber: item.certificateNumber,
        verificationCode: item.verificationCode,
        pdfUrl: '',
        issuedAt: item.issuedAt,
        status: item.revokedAt ? 'revoked' : 'active',
        revokedAt: item.revokedAt,
    }));
};

export const getCertificatePdfForMe = async (certificateId: string, download = false): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`/learning-certificates/${certificateId}/download`, {
        params: download ? { download: '1' } : undefined,
        responseType: 'blob',
    });
    return response.data;
};

export const verifyCertificatePublic = async (verificationCode: string): Promise<PublicCertificateVerification> => {
    const response = await apiClient.get<ApiResponse<{ certificate: {
        type: string;
        certificateNumber: string;
        recipientName: string;
        subject?: { courseTitle?: string; moduleTitle?: string };
        issuedAt: string;
        valid: boolean;
        revokedAt?: string | null;
    } }>>(
        `/learning-certificates/verify/${encodeURIComponent(verificationCode)}`
    );
    const item = response.data.data.certificate;
    return {
        valid: item.valid,
        status: item.valid ? 'active' : 'revoked',
        certificate: {
            certificateNumber: item.certificateNumber,
            type: item.type.toLowerCase() === 'module' ? 'module' : 'course',
            learnerName: item.recipientName,
            courseTitle: item.subject?.courseTitle || '',
            moduleTitle: item.subject?.moduleTitle,
            issuedAt: item.issuedAt,
            revokedAt: item.revokedAt,
            issuerName: 'Verble',
        },
    };
};
