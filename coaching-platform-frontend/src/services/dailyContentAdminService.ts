// src/services/dailyContentAdminService.ts
import apiClient from './apiClient';
import type { DailyContent } from './dailyContentService';

export interface CreateDailyContentPayload {
    type: string;
    date: string;
    level: string;
    title: string;
    metadata: any;
    isActive?: boolean;
}

export interface UpdateDailyContentPayload extends Partial<CreateDailyContentPayload> {}

export interface DailyContentPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DailyContentAdminListParams {
    date?: string;
    /** Filter by scheduled publish date (DailyContent.date), not createdAt */
    scheduleStartDate?: string;
    scheduleEndDate?: string;
    /** @deprecated Use scheduleStartDate — kept for backward compatibility */
    startDate?: string;
    /** @deprecated Use scheduleEndDate */
    endDate?: string;
    level?: string;
    type?: string;
    search?: string;
    isActive?: 'true' | 'false' | '';
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
}

export interface DailyContentAdminListResult {
    content: DailyContent[];
    pagination?: DailyContentPagination;
}

export interface DailyContentAdminResponse {
    status: string;
    data: {
        content: DailyContent | DailyContent[];
        pagination?: DailyContentPagination;
    };
}

export interface DailyContentSequencePreview {
    sequenceNumber: number;
    displayTag: string;
    displayTitle: string;
    level: string;
}

export const getDailyContentSequencePreviewAdmin = async (
    type: string,
    level: string,
    puzzleType?: string
): Promise<DailyContentSequencePreview> => {
    const params: Record<string, string> = { type, level };
    if (puzzleType) params.puzzleType = puzzleType;

    const response = await apiClient.get<{
        status: string;
        data: DailyContentSequencePreview;
    }>('/admin/daily-content/sequence-preview', { params });

    if (response.data.status === 'success' && response.data.data?.sequenceNumber) {
        return response.data.data;
    }
    throw new Error('Could not load display number preview.');
};

/**
 * Get daily content (admin) — optional pagination and filters.
 */
export const getAllDailyContentAdmin = async (
    params?: DailyContentAdminListParams
): Promise<DailyContentAdminListResult> => {
    const response = await apiClient.get<DailyContentAdminResponse>('/admin/daily-content', { params });
    const raw = response.data.data.content;
    const content = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return {
        content,
        pagination: response.data.data.pagination,
    };
};

/**
 * Create daily content
 */
export class DailyContentDuplicateError extends Error {
    existing: DailyContent;

    constructor(message: string, existing: DailyContent) {
        super(message);
        this.name = 'DailyContentDuplicateError';
        this.existing = existing;
    }
}

export const createDailyContentAdmin = async (payload: CreateDailyContentPayload): Promise<DailyContent> => {
    try {
        const response = await apiClient.post<DailyContentAdminResponse>('/admin/daily-content', payload);
        return response.data.data.content as DailyContent;
    } catch (error: unknown) {
        const axiosErr = error as {
            response?: { status?: number; data?: { message?: string; data?: { content?: DailyContent } } };
        };
        if (axiosErr.response?.status === 409 && axiosErr.response.data?.data?.content) {
            throw new DailyContentDuplicateError(
                axiosErr.response.data.message ||
                    'Content for this type is already scheduled on this date.',
                axiosErr.response.data.data.content
            );
        }
        throw error;
    }
};

export interface BulkCreateDailyContentResult {
    createdCount: number;
    failedCount: number;
    failures: { index: number; message: string }[];
    content?: DailyContent[];
}

export const BULK_IMPORT_BATCH_SIZE = 25;

export function splitIntoBatches<T>(items: T[], batchSize = BULK_IMPORT_BATCH_SIZE): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
    }
    return batches;
}

export interface BulkImportProgress {
    batchIndex: number;
    totalBatches: number;
    processedCount: number;
    totalCount: number;
}

/**
 * Bulk create daily content in batches to avoid request body size limits.
 */
export const bulkCreateDailyContentAdminChunked = async (
    items: CreateDailyContentPayload[],
    options?: {
        batchSize?: number;
        onProgress?: (progress: BulkImportProgress) => void;
    }
): Promise<BulkCreateDailyContentResult> => {
    const batchSize = options?.batchSize ?? BULK_IMPORT_BATCH_SIZE;
    const batches = splitIntoBatches(items, batchSize);
    let createdCount = 0;
    let failedCount = 0;
    const failures: { index: number; message: string }[] = [];
    const content: DailyContent[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const baseIndex = batchIndex * batchSize;

        options?.onProgress?.({
            batchIndex: batchIndex + 1,
            totalBatches: batches.length,
            processedCount: baseIndex,
            totalCount: items.length,
        });

        try {
            const result = await bulkCreateDailyContentAdmin(batch);
            createdCount += result.createdCount;
            failedCount += result.failedCount;
            for (const failure of result.failures) {
                failures.push({ index: baseIndex + failure.index, message: failure.message });
            }
            if (result.content?.length) {
                content.push(...result.content);
            }
        } catch (error: unknown) {
            const msg =
                error && typeof error === 'object' && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            const batchMessage = msg || (error instanceof Error ? error.message : 'Batch import failed.');
            for (let i = 0; i < batch.length; i++) {
                failures.push({ index: baseIndex + i, message: batchMessage });
            }
            failedCount += batch.length;
        }

        options?.onProgress?.({
            batchIndex: batchIndex + 1,
            totalBatches: batches.length,
            processedCount: Math.min(baseIndex + batch.length, items.length),
            totalCount: items.length,
        });
    }

    return { createdCount, failedCount, failures, content };
};

/**
 * Bulk create daily content (validated CSV on the client first).
 */
export const bulkCreateDailyContentAdmin = async (
    items: CreateDailyContentPayload[]
): Promise<BulkCreateDailyContentResult> => {
    const response = await apiClient.post<{
        status: string;
        data: BulkCreateDailyContentResult & { content?: DailyContent[] };
    }>('/admin/daily-content/bulk', { items });
    const data = response.data.data;
    return {
        createdCount: data.createdCount ?? data.content?.length ?? 0,
        failedCount: data.failedCount ?? 0,
        failures: data.failures ?? [],
        content: data.content,
    };
};

/**
 * Update daily content
 */
export const updateDailyContentAdmin = async (
    id: string,
    payload: UpdateDailyContentPayload
): Promise<DailyContent> => {
    try {
        const response = await apiClient.patch<DailyContentAdminResponse>(
            `/admin/daily-content/${id}`,
            payload
        );
        return response.data.data.content as DailyContent;
    } catch (error: unknown) {
        const axiosErr = error as {
            response?: { status?: number; data?: { message?: string; data?: { content?: DailyContent } } };
        };
        if (axiosErr.response?.status === 409 && axiosErr.response.data?.data?.content) {
            throw new DailyContentDuplicateError(
                axiosErr.response.data.message ||
                    'Content for this type is already scheduled on this date.',
                axiosErr.response.data.data.content
            );
        }
        throw error;
    }
};

/**
 * Delete daily content
 */
export const deleteDailyContentAdmin = async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/daily-content/${id}`);
};

/**
 * Bulk delete daily content by id
 */
export const bulkDeleteDailyContentAdmin = async (
    ids: string[]
): Promise<{ deletedCount: number }> => {
    const response = await apiClient.delete<{
        status: string;
        data: { deletedCount: number };
    }>('/admin/daily-content/bulk', { data: { ids } });
    return response.data.data;
};

/** Upload image for daily content (feed posts, scenes, etc.) */
export const uploadDailyContentImage = async (imageFile: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await apiClient.post<{ status: string; data: { imageUrl: string } }>(
        '/admin/daily-content/upload-image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    if (response.data.status === 'success' && response.data.data?.imageUrl) {
        return response.data.data;
    }
    throw new Error('Image upload did not return a URL.');
};
