import apiClient from './apiClient';

// --- INTERFACES ---

export interface KnowledgeBaseArticle {
    _id: string;
    title: string;
    content: string;
    keywords: string[];
    category?: string;
    isEnabled: boolean;
    lastUpdatedBy?: {
        _id: string;
        name: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

// For creating or updating an article
export interface KnowledgeBaseArticleInput {
    title: string;
    content: string;
    keywords: string[];
    category?: string;
    isEnabled: boolean;
}

// --- API RESPONSE TYPES ---

interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

// --- SERVICE FUNCTIONS ---

/**
 * Fetches all knowledge base articles for the admin panel.
 */
export const getAllArticlesAdmin = async (): Promise<KnowledgeBaseArticle[]> => {
    try {
        const response = await apiClient.get<ApiResponse<{ articles: KnowledgeBaseArticle[] }>>('/admin/knowledge-base');
        if (response.data.status === 'success' && response.data.data?.articles) {
            return response.data.data.articles;
        }
        throw new Error('Failed to fetch knowledge base articles.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Creates a new knowledge base article.
 */
export const createArticleAdmin = async (articleData: KnowledgeBaseArticleInput): Promise<KnowledgeBaseArticle> => {
    try {
        const response = await apiClient.post<ApiResponse<{ article: KnowledgeBaseArticle }>>('/admin/knowledge-base', articleData);
        if (response.data.status === 'success' && response.data.data?.article) {
            return response.data.data.article;
        }
        throw new Error(response.data?.message || 'Failed to create article.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Updates an existing knowledge base article.
 */
export const updateArticleAdmin = async (articleId: string, articleData: Partial<KnowledgeBaseArticleInput>): Promise<KnowledgeBaseArticle> => {
    try {
        const response = await apiClient.patch<ApiResponse<{ article: KnowledgeBaseArticle }>>(`/admin/knowledge-base/${articleId}`, articleData);
        if (response.data.status === 'success' && response.data.data?.article) {
            return response.data.data.article;
        }
        throw new Error(response.data?.message || 'Failed to update article.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Deletes a knowledge base article.
 */
export const deleteArticleAdmin = async (articleId: string): Promise<void> => {
    try {
        await apiClient.delete(`/admin/knowledge-base/${articleId}`);
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
