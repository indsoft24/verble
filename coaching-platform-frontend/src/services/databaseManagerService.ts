import apiClient from './apiClient';

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

export interface DbCollectionItem {
    name: string;
    count: number;
    restricted: boolean;
}

export interface DbPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CollectionDocumentsResponse {
    collectionName: string;
    documents: Record<string, any>[];
    fields: string[];
    pagination: DbPagination;
}

export interface AuditLogRecord {
    _id: string;
    userId: string;
    userEmail?: string;
    action: 'create' | 'update' | 'delete';
    collectionName: string;
    documentId: string;
    beforeData: Record<string, any> | null;
    afterData: Record<string, any> | null;
    createdAt: string;
}

export const getDbCollections = async (search = ''): Promise<DbCollectionItem[]> => {
    const response = await apiClient.get<ApiResponse<{ collections: DbCollectionItem[] }>>(
        `/admin/database-manager/collections`,
        { params: { search } }
    );
    return response.data.data.collections || [];
};

export const getCollectionDocuments = async (
    collectionName: string,
    params: {
        page: number;
        limit: number;
        search?: string;
        filterJson?: string;
        dateField?: string;
        dateFrom?: string;
        dateTo?: string;
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
    }
): Promise<CollectionDocumentsResponse> => {
    const response = await apiClient.get<ApiResponse<CollectionDocumentsResponse>>(
        `/admin/database-manager/collections/${encodeURIComponent(collectionName)}/documents`,
        { params }
    );
    return response.data.data;
};

export const createCollectionDocument = async (collectionName: string, document: Record<string, any>) => {
    const response = await apiClient.post<ApiResponse<{ document: Record<string, any> }>>(
        `/admin/database-manager/collections/${encodeURIComponent(collectionName)}/documents`,
        { document }
    );
    return response.data.data.document;
};

export const updateCollectionDocument = async (
    collectionName: string,
    documentId: string,
    document: Record<string, any>
) => {
    const response = await apiClient.put<ApiResponse<{ document: Record<string, any> }>>(
        `/admin/database-manager/collections/${encodeURIComponent(collectionName)}/documents/${documentId}`,
        { document }
    );
    return response.data.data.document;
};

export const deleteCollectionDocument = async (collectionName: string, documentId: string, softDelete = false) => {
    await apiClient.delete(
        `/admin/database-manager/collections/${encodeURIComponent(collectionName)}/documents/${documentId}`,
        { params: { softDelete } }
    );
};

export const getDbAuditLogs = async (params: {
    page: number;
    limit: number;
    collectionName?: string;
}): Promise<{ logs: AuditLogRecord[]; pagination: DbPagination }> => {
    const response = await apiClient.get<ApiResponse<{ logs: AuditLogRecord[]; pagination: DbPagination }>>(
        `/admin/database-manager/audit-logs`,
        { params }
    );
    return response.data.data;
};
