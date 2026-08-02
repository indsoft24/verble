import apiClient from './apiClient';
import type {
    FinalExamImportMode,
    FinalExamQuestionInput,
} from '../utils/finalExamCsv';
import { questionsToFinalExamCsv } from '../utils/finalExamCsv';

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
        requireModuleQuizzes: boolean;
        minimumModuleQuizScore: number;
        requireDailySubmissions: boolean;
        minimumDailySubmissionPercent: number;
        dailySubmissionLookbackDays: number;
        minimumOverallSubmissionPercent: number;
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
    type?: 'module' | 'course';
    moduleTitle?: string | null;
    status?: 'active' | 'revoked';
    revokedAt?: string | null;
    revokedReason?: string | null;
    verificationCode?: string;
    eligibilitySnapshot?: Record<string, unknown>;
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

export interface IssuedCertificateFilters {
    page: number;
    limit: number;
    search?: string;
    courseId?: string;
    moduleId?: string;
    type?: '' | 'module' | 'course';
    status?: '' | 'active' | 'revoked';
    dateFrom?: string;
    dateTo?: string;
}

export const getIssuedCertificatesAdmin = async (params: IssuedCertificateFilters) => {
    const response = await apiClient.get<ApiResponse<{
        certificates: Array<{
            _id: string;
            type: string;
            certificateNumber: string;
            verificationCode: string;
            user?: { name?: string; email?: string };
            course?: { title?: string };
            module?: { title?: string };
            recipientSnapshot?: { name?: string; email?: string };
            subjectSnapshot?: { courseTitle?: string; moduleTitle?: string };
            eligibilitySnapshot?: Record<string, unknown>;
            issuedAt: string;
            revokedAt?: string | null;
            revocationReason?: string | null;
            pdf?: { status?: string };
        }>;
        pagination: { total: number; page: number; limit: number; totalPages: number };
    }>>('/admin/certificates/issued-unified', {
        params: {
            ...params,
            type: params.type?.toUpperCase() || undefined,
            revoked: params.status ? String(params.status === 'revoked') : undefined,
            from: params.dateFrom,
            to: params.dateTo,
            dateFrom: undefined,
            dateTo: undefined,
            status: undefined,
        },
    });
    return {
        ...response.data.data,
        certificates: response.data.data.certificates.map((item) => ({
            _id: item._id,
            certificateNumber: item.certificateNumber,
            verificationCode: item.verificationCode,
            userName: item.user?.name || item.recipientSnapshot?.name || 'Unknown learner',
            userEmail: item.user?.email || item.recipientSnapshot?.email || '',
            courseTitle: item.course?.title || item.subjectSnapshot?.courseTitle || '',
            moduleTitle: item.module?.title || item.subjectSnapshot?.moduleTitle || null,
            type: item.type.toLowerCase() === 'module' ? 'module' : 'course',
            completionPercent: Number(item.eligibilitySnapshot?.completionPercent || 0),
            assessmentScore: typeof item.eligibilitySnapshot?.assessmentScore === 'number' ? item.eligibilitySnapshot.assessmentScore : null,
            issuedAt: item.issuedAt,
            pdfUrl: '',
            status: item.revokedAt ? 'revoked' : 'active',
            revokedAt: item.revokedAt,
            revokedReason: item.revocationReason,
            eligibilitySnapshot: item.eligibilitySnapshot,
        } satisfies IssuedCertificateRow)),
    };
};

export interface FinalExamSettings {
    courseId: string;
    courseTitle: string;
    status: 'active' | 'draft';
    randomQuestionCount: number;
    passingScore: number;
    timeLimitMinutes: number;
    maxAttempts: number;
    cooldownHours: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    allowReview: boolean;
    unlockOnRequirementsMet: boolean;
    questionBankCount?: number;
}

export interface FinalExamQuestion extends FinalExamQuestionInput {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface FinalExamAttemptRow {
    _id: string;
    learnerName: string;
    learnerEmail: string;
    courseTitle: string;
    attemptNumber: number;
    status: 'in_progress' | 'submitted' | 'passed' | 'failed' | 'expired';
    score: number | null;
    startedAt: string;
    submittedAt?: string | null;
}

export interface CertificateNumberingTemplate {
    type: 'module' | 'course';
    prefix: string;
    includeYear: boolean;
    separator: string;
    padding: number;
    nextSequence: number;
    reset: 'never' | 'yearly';
}

export const getFinalExamSettingsAdmin = async (): Promise<FinalExamSettings[]> => {
    const courses = await getCertificateRulesAdmin();
    return Promise.all(courses.map(async ({ course }) => {
        const [settingsResponse, questionsResponse] = await Promise.all([
            apiClient.get<ApiResponse<{ settings: {
                status?: string;
                questionCount?: number;
                passingScore?: number;
                timeLimitMinutes?: number;
                maxAttempts?: number;
                cooldownMinutes?: number;
                shuffleQuestions?: boolean;
                shuffleOptions?: boolean;
                reviewPolicy?: string;
                unlockAtCompletionPercent?: number;
            } | null }>>(`/admin/final-assessments/courses/${course._id}/settings`),
            apiClient.get<ApiResponse<{ pagination: { total: number } }>>(
                `/admin/final-assessments/courses/${course._id}/questions`,
                { params: { page: 1, limit: 1 } }
            ),
        ]);
        const settings = settingsResponse.data.data.settings;
        return {
            courseId: course._id,
            courseTitle: course.title,
            status: settings?.status === 'ACTIVE' ? 'active' : 'draft',
            randomQuestionCount: settings?.questionCount ?? 80,
            passingScore: settings?.passingScore ?? 70,
            timeLimitMinutes: settings?.timeLimitMinutes ?? 90,
            maxAttempts: settings?.maxAttempts ?? 3,
            cooldownHours: (settings?.cooldownMinutes ?? 0) / 60,
            shuffleQuestions: settings?.shuffleQuestions ?? true,
            shuffleOptions: settings?.shuffleOptions ?? true,
            allowReview: settings?.reviewPolicy === 'FULL_AFTER_SUBMIT',
            unlockOnRequirementsMet: (settings?.unlockAtCompletionPercent ?? 100) <= 100,
            questionBankCount: questionsResponse.data.data.pagination.total,
        } satisfies FinalExamSettings;
    }));
};

export const updateFinalExamSettingsAdmin = async (
    courseId: string,
    payload: Partial<Omit<FinalExamSettings, 'courseId' | 'courseTitle'>>
): Promise<FinalExamSettings> => {
    const response = await apiClient.put<ApiResponse<{ settings: {
        status: string;
        questionCount: number;
        passingScore: number;
        timeLimitMinutes: number;
        maxAttempts: number;
        cooldownMinutes: number;
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
        reviewPolicy: string;
        unlockAtCompletionPercent: number;
    } }>>(
        `/admin/final-assessments/courses/${courseId}/settings`,
        {
            status: payload.status === 'active' ? 'ACTIVE' : 'DRAFT',
            questionCount: payload.randomQuestionCount,
            passingScore: payload.passingScore,
            timeLimitMinutes: payload.timeLimitMinutes,
            maxAttempts: payload.maxAttempts,
            cooldownMinutes: payload.cooldownHours == null ? undefined : payload.cooldownHours * 60,
            shuffleQuestions: payload.shuffleQuestions,
            shuffleOptions: payload.shuffleOptions,
            reviewPolicy: payload.allowReview ? 'FULL_AFTER_SUBMIT' : 'SCORE_ONLY',
            unlockAtCompletionPercent: payload.unlockOnRequirementsMet ? 100 : 0,
        }
    );
    const settings = response.data.data.settings;
    return {
        courseId,
        courseTitle: '',
        status: settings.status === 'ACTIVE' ? 'active' : 'draft',
        randomQuestionCount: settings.questionCount,
        passingScore: settings.passingScore,
        timeLimitMinutes: settings.timeLimitMinutes,
        maxAttempts: settings.maxAttempts,
        cooldownHours: settings.cooldownMinutes / 60,
        shuffleQuestions: settings.shuffleQuestions,
        shuffleOptions: settings.shuffleOptions,
        allowReview: settings.reviewPolicy === 'FULL_AFTER_SUBMIT',
        unlockOnRequirementsMet: settings.unlockAtCompletionPercent <= 100,
    };
};

export const getFinalExamQuestionsAdmin = async (params: {
    page: number;
    limit: number;
    search?: string;
    courseId?: string;
    category?: string;
    difficulty?: string;
    active?: string;
}) => {
    if (!params.courseId) {
        return { questions: [], pagination: { total: 0, page: params.page, limit: params.limit, totalPages: 0 } };
    }
    const response = await apiClient.get<ApiResponse<{
        questions: Array<{
            _id: string;
            externalId?: string;
            prompt: string;
            options: string[];
            correctOption: number;
            explanation?: string;
            points: number;
            active: boolean;
            createdAt?: string;
            updatedAt?: string;
        }>;
        pagination: { total: number; page: number; limit: number; totalPages: number };
    }>>(`/admin/final-assessments/courses/${params.courseId}/questions`, {
        params: { page: params.page, limit: params.limit, active: params.active },
    });
    const questions = response.data.data.questions
        .map((item) => ({
            _id: item._id,
            stableKey: item.externalId || item._id,
            question: item.prompt,
            options: item.options,
            correctOption: item.correctOption,
            explanation: item.explanation,
            category: '',
            difficulty: 'medium' as const,
            points: item.points,
            active: item.active,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }))
        .filter((item) => !params.search || `${item.stableKey} ${item.question}`.toLowerCase().includes(params.search.toLowerCase()))
        .filter((item) => !params.difficulty || item.difficulty === params.difficulty)
        .filter((item) => !params.category || item.category.toLowerCase().includes(params.category.toLowerCase()));
    return { ...response.data.data, questions };
};

export const createFinalExamQuestionAdmin = async (
    payload: FinalExamQuestionInput & { courseId: string }
): Promise<FinalExamQuestion> => {
    const response = await apiClient.post<ApiResponse<{ question: FinalExamQuestion }>>(
        `/admin/final-assessments/courses/${payload.courseId}/questions`,
        {
            externalId: payload.stableKey,
            prompt: payload.question,
            options: payload.options.filter(Boolean),
            correctOption: payload.correctOption,
            explanation: payload.explanation,
            points: payload.points,
            active: payload.active,
        }
    );
    return response.data.data.question;
};

export const updateFinalExamQuestionAdmin = async (
    courseId: string,
    questionId: string,
    payload: Partial<FinalExamQuestionInput>
): Promise<FinalExamQuestion> => {
    const response = await apiClient.patch<ApiResponse<{ question: FinalExamQuestion }>>(
        `/admin/final-assessments/courses/${courseId}/questions/${questionId}`,
        {
            externalId: payload.stableKey,
            prompt: payload.question,
            options: payload.options?.filter(Boolean),
            correctOption: payload.correctOption,
            explanation: payload.explanation,
            points: payload.points,
            active: payload.active,
        }
    );
    return response.data.data.question;
};

export const deleteFinalExamQuestionAdmin = async (courseId: string, questionId: string): Promise<void> => {
    await apiClient.delete(`/admin/final-assessments/courses/${courseId}/questions/${questionId}`);
};

export const importFinalExamQuestionsAdmin = async (
    courseId: string,
    mode: FinalExamImportMode,
    questions: FinalExamQuestionInput[]
) => {
    const response = await apiClient.post<ApiResponse<{ created: number; updated: number; deleted: number }>>(
        `/admin/final-assessments/courses/${courseId}/questions/import`,
        {
            mode,
            questions: questions.map((item) => ({
                externalId: item.stableKey,
                prompt: item.question,
                options: item.options,
                correctOption: item.correctOption,
                explanation: item.explanation,
                points: item.points,
                active: item.active,
            })),
        }
    );
    return response.data.data;
};

export const exportFinalExamQuestionsAdmin = async (params: {
    courseId?: string;
    search?: string;
    category?: string;
    difficulty?: string;
    active?: string;
}): Promise<Blob> => {
    if (!params.courseId) throw new Error('Select a course before exporting.');
    const data = await getFinalExamQuestionsAdmin({ page: 1, limit: 200, ...params });
    return new Blob([`\uFEFF${questionsToFinalExamCsv(data.questions)}`], { type: 'text/csv;charset=utf-8' });
};

export const getFinalExamAttemptsAdmin = async (params: {
    page: number;
    limit: number;
    search?: string;
    courseId?: string;
    status?: string;
}) => {
    if (!params.courseId) {
        return { attempts: [], pagination: { total: 0, page: params.page, limit: params.limit, totalPages: 0 } };
    }
    const response = await apiClient.get<ApiResponse<{
        attempts: Array<{
            _id: string;
            user?: { name?: string; email?: string };
            attemptNumber: number;
            status: string;
            score?: number | null;
            startedAt: string;
            submittedAt?: string | null;
        }>;
        pagination: { total: number; page: number; limit: number; totalPages: number };
    }>>(`/admin/final-assessments/courses/${params.courseId}/attempts`, {
        params: { page: params.page, limit: params.limit, status: params.status },
    });
    return {
        ...response.data.data,
        attempts: response.data.data.attempts.map((item) => ({
            _id: item._id,
            learnerName: item.user?.name || 'Unknown learner',
            learnerEmail: item.user?.email || '',
            courseTitle: '',
            attemptNumber: item.attemptNumber,
            status: item.status.toLowerCase() as FinalExamAttemptRow['status'],
            score: item.score ?? null,
            startedAt: item.startedAt,
            submittedAt: item.submittedAt,
        })),
    };
};

export const getCertificateNumberingAdmin = async (): Promise<CertificateNumberingTemplate[]> => {
    const response = await apiClient.get<ApiResponse<{ settings: Array<{
        certificateType: string;
        template: string;
        prefix: string;
        padding: number;
        reset: string;
    }> }>>(
        '/admin/certificates/numbering'
    );
    const byType = new Map(response.data.data.settings.map((item) => [item.certificateType.toLowerCase(), item]));
    return (['module', 'course'] as const).map((type) => {
        const item = byType.get(type);
        const template = item?.template || '{PREFIX}-{YEAR}-{SEQUENCE}';
        const separator = template.includes('/') ? '/' : template.includes('.') ? '.' : '-';
        return {
            type,
            prefix: item?.prefix || (type === 'module' ? 'MOD' : 'COURSE'),
            includeYear: template.includes('{YEAR}'),
            separator,
            padding: item?.padding || 6,
            nextSequence: 1,
            reset: item?.reset === 'NEVER' ? 'never' : 'yearly',
        };
    });
};

export const updateCertificateNumberingAdmin = async (
    type: CertificateNumberingTemplate['type'],
    payload: Omit<CertificateNumberingTemplate, 'type'>
): Promise<CertificateNumberingTemplate> => {
    await apiClient.put(
        '/admin/certificates/numbering',
        {
            scopeType: 'GLOBAL',
            certificateType: type.toUpperCase(),
            template: ['{PREFIX}', payload.includeYear ? '{YEAR}' : '', '{SEQUENCE}'].filter(Boolean).join(payload.separator),
            prefix: payload.prefix,
            padding: payload.padding,
            reset: payload.reset.toUpperCase(),
            active: true,
        }
    );
    return { type, ...payload };
};

export const issueCertificateAdmin = async (payload: {
    userId?: string;
    userEmail?: string;
    type: 'module' | 'course';
    courseId: string;
    moduleId?: string;
    reason: string;
}) => {
    const response = await apiClient.post<ApiResponse<{ certificate: IssuedCertificateRow }>>(
        '/admin/certificates/issued-unified/manual',
        { ...payload, type: payload.type.toUpperCase() }
    );
    return response.data.data.certificate;
};

export const revokeCertificateAdmin = async (certificateId: string, reason: string) => {
    await apiClient.post(`/admin/certificates/issued-unified/${certificateId}/revoke`, { reason });
};

export const unrevokeCertificateAdmin = async (certificateId: string, reason: string) => {
    await apiClient.post(`/admin/certificates/issued-unified/${certificateId}/unrevoke`, { reason });
};

export const regenerateCertificatePdfAdmin = async (certificateId: string) => {
    const response = await apiClient.post<ApiResponse<{ certificate: IssuedCertificateRow }>>(
        `/admin/certificates/issued-unified/${certificateId}/regenerate`
    );
    return response.data.data.certificate;
};

export const exportIssuedCertificatesAdmin = async (params: Omit<IssuedCertificateFilters, 'page' | 'limit'>) => {
    const response = await apiClient.get<Blob>('/admin/certificates/issued-unified/export', {
        params: {
            ...params,
            type: params.type?.toUpperCase() || undefined,
            revoked: params.status ? String(params.status === 'revoked') : undefined,
            from: params.dateFrom,
            to: params.dateTo,
        },
        responseType: 'blob',
    });
    return response.data;
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
