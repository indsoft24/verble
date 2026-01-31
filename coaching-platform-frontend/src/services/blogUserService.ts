// src/services/blogUserService.ts

import apiClient from './apiClient';

// Interface for Author details (subset of User)
export interface BlogAuthor {
    _id: string;
    name: string;
}

export interface GatedAttachment {
    _id: string;
    label: string;
    originalFileName: string;
    fileType?: string;
    fileSize?: number;
}

export interface BlogPostListItem {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    featureImage?: string;
    author: BlogAuthor | string; 
    category: string;
    tags?: string[];
    publishedAt?: string | Date;
    createdAt?: string;
    views?: number;
}

export interface BlogPostDetail extends BlogPostListItem {
    content: string;
    gatedAttachments?: GatedAttachment[];
}

// For sidebar: Recent Posts
export interface RecentBlogPost {
    _id: string;
    title: string;
    slug: string;
    publishedAt?: string | Date;
}

// For sidebar: Categories with counts
export interface BlogCategoryWithCount {
    name: string;
    count: number;
}


// --- API RESPONSE INTERFACES ---

interface GetAllPublishedBlogPostsApiResponse {
    status: string;
    results?: number;
    totalResults?: number;
    currentPage?: number;
    totalPages?: number;
    data: {
        posts: BlogPostListItem[];
    };
    message?: string;
}

interface GetPublishedBlogPostBySlugApiResponse {
    status: string;
    data: {
        post: BlogPostDetail;
    };
    message?: string;
}

interface GetRecentBlogPostsApiResponse {
    status: string;
    data: {
        posts: RecentBlogPost[];
    };
    message?: string;
}

interface GetAllBlogCategoriesApiResponse {
    status: string;
    data: {
        categories: BlogCategoryWithCount[];
    };
    message?: string;
}


// --- Service Functions ---

/**
 * Fetches all published blog posts for users (paginated).
 * Calls GET /api/blog
 */
export const getAllPublishedBlogPostsUser = async (page = 1, limit = 9): Promise<{
    posts: BlogPostListItem[],
    totalResults: number,
    totalPages: number,
    currentPage: number
}> => {
    try {
        const response = await apiClient.get<GetAllPublishedBlogPostsApiResponse>('/blog', {
            params: { page, limit }
        });
        if (response.data && response.data.status === 'success' && response.data.data?.posts) {
            return {
                posts: response.data.data.posts,
                totalResults: response.data.totalResults || 0,
                totalPages: response.data.totalPages || 1,
                currentPage: response.data.currentPage || 1,
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch published blog posts');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Could not load blog posts.' };
    }
};

/**
 * Fetches all published posts for a specific category slug.
 * @route GET /api/blog/category/:slug
 */
export const getPublishedPostsByCategoryUser = async (
    categorySlug: string,
    page = 1,
    limit = 9
): Promise<{ posts: BlogPostListItem[]; totalPages: number; currentPage: number; total: number; }> => {
    try {
        const response = await apiClient.get<GetAllPublishedBlogPostsApiResponse>(`/blog/category/${categorySlug}`, {
            params: { page, limit }
        });

        if (response.data && response.data.status === 'success' && response.data.data?.posts) {
            return {
                posts: response.data.data.posts,
                totalPages: response.data.totalPages || 1,
                currentPage: response.data.currentPage || 1,
                total: response.data.totalResults || 0,
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch posts for this category');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Fetches a single published blog post by its slug.
 * Calls GET /api/blog/:slug
 */
export const getPublishedBlogPostBySlugUser = async (slug: string): Promise<BlogPostDetail> => {
    try {
        const response = await apiClient.get<GetPublishedBlogPostBySlugApiResponse>(`/blog/${slug}`);
        if (response.data && response.data.status === 'success' && response.data.data?.post) {
            return response.data.data.post;
        }
        throw new Error(response.data?.message || 'Failed to fetch blog post details');
    } catch (error: any) {
        throw error.response?.data || { status: 'error', message: 'Could not load blog post.' };
    }
};

/**
 * Fetches recent published blog posts (for sidebar).
 * Calls GET /api/blog/recent
 */
export const getRecentBlogPostsUser = async (limit = 5): Promise<RecentBlogPost[]> => {
    try {
        const response = await apiClient.get<GetRecentBlogPostsApiResponse>('/blog/recent', {
            params: { limit }
        });
        if (response.data && response.data.status === 'success' && response.data.data?.posts) {
            return response.data.data.posts;
        }
        throw new Error(response.data?.message || 'Failed to fetch recent posts');
    } catch (error: any) { throw error; }
};

/**
 * Fetches all unique categories from published blog posts with counts.
 * Calls GET /api/blog/categories
 */
export const getAllBlogCategoriesUser = async (): Promise<BlogCategoryWithCount[]> => {
    try {
        const response = await apiClient.get<GetAllBlogCategoriesApiResponse>('/blog/categories');
        if (response.data && response.data.status === 'success' && response.data.data?.categories) {
            return response.data.data.categories;
        }
        throw new Error(response.data?.message || 'Failed to fetch blog categories');
    } catch (error: any) { throw error; }
};
