import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface CourseCertificateEligibility {
    totalModules: number;
    completedModules: number;
    completionPercent: number;
    assessmentScore: number | null;
    isEligible: boolean;
    reasons: string[];
    rule: {
        isEnabled: boolean;
        requireAssessment: boolean;
        passingScore: number;
        minimumCompletionPercent: number;
        readOnlyMode: boolean;
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

export const getMyCourseCertificates = async (): Promise<MyCourseCertificate[]> => {
    const response = await apiClient.get<ApiResponse<{ certificates: MyCourseCertificate[] }>>(
        `/course-certificates/my-course-certificates`
    );
    return response.data.data.certificates || [];
};
