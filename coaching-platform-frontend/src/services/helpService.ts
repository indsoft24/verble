// src/services/helpService.ts
import apiClient from './apiClient';

export interface HelpArticle {
    _id: string;
    title: string;
    content: string;
    keywords: string[];
    category?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HelpArticlesResponse {
    status: string;
    results: number;
    data: {
        articles: HelpArticle[];
    };
}

export interface HelpArticleResponse {
    status: string;
    data: {
        article: HelpArticle;
    };
}

export interface HelpCategoriesResponse {
    status: string;
    data: {
        categories: string[];
    };
}

/**
 * Get all enabled help articles
 */
export const getHelpArticles = async (category?: string, search?: string): Promise<HelpArticle[]> => {
    const params: any = {};
    if (category) {
        params.category = category;
    }
    if (search) {
        params.search = search;
    }
    
    const response = await apiClient.get<HelpArticlesResponse>('/help', { params });
    return response.data.data.articles || [];
};

/**
 * Get a single help article by ID
 */
export const getHelpArticleById = async (id: string): Promise<HelpArticle> => {
    const response = await apiClient.get<HelpArticleResponse>(`/help/${id}`);
    return response.data.data.article;
};

/**
 * Get all unique categories from enabled articles
 */
export const getHelpCategories = async (): Promise<string[]> => {
    const response = await apiClient.get<HelpCategoriesResponse>('/help/categories');
    return response.data.data.categories || [];
};
