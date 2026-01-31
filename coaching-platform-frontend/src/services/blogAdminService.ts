// File: src/services/blogAdminService.ts 

import apiClient from './apiClient'; 

// Interface for BlogPost 
export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    description?: string; 
    content: string; 
    featureImage?: string; 
    author: string | { _id: string; name: string; email?: string }; 
    category: string;
    tags?: string[];
    isPublished: boolean;
    publishedAt?: string | Date | null;
    views?: number;
    createdAt?: string;
    updatedAt?: string;
}

// Interface for creating a blog post.
export interface BlogPostCreateInput {
    title: string;
    description: string;
    content: string;
    category?: string;
    tags?: string[]; 
    isPublished?: boolean;
    publishedAt?: string | Date | null;
    slug?: string; 
    featureImage?: File | null; 
}

// Interface for updating a blog post.
export interface BlogPostUpdateInput extends Omit<Partial<BlogPostCreateInput>, 'featureImage'> {
    featureImage?: File | null | string; 
    removeFeatureImage?: boolean; 
}



// --- API Response Interfaces (standardized) ---
interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
    results?: number; 
    total?: number; 
    currentPage?: number; 
    totalPages?: number; 
}

interface DeleteApiResponse {
    status: string;
    data: null;
    message?: string;
}

/**
 * Creates a new blog post. Uses FormData for potential file upload.
 */
export const createBlogPostAdmin = async (postData: BlogPostCreateInput): Promise<BlogPost> => {
    const formData = new FormData();
    
    formData.append('title', postData.title);
    formData.append('description', postData.description);
    formData.append('content', postData.content);
    if (postData.category) formData.append('category', postData.category);
    if (postData.tags && postData.tags.length > 0) {
        postData.tags.forEach(tag => formData.append('tags[]', tag)); // Send as array
    }
    formData.append('isPublished', String(postData.isPublished || false));
    if (postData.publishedAt) {
        formData.append('publishedAt', new Date(postData.publishedAt).toISOString());
    }
    if (postData.slug) formData.append('slug', postData.slug);
    if (postData.featureImage instanceof File) {
        formData.append('featureImage', postData.featureImage);
    }

    try {
        const response = await apiClient.post<ApiResponse<{ post: BlogPost }>>('/admin/blog', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data.status === 'success' && response.data.data?.post) {
            return response.data.data.post;
        }
        throw new Error(response.data?.message || 'Failed to create blog post');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Updates an existing blog post. Uses FormData for potential file upload.
 */
export const updateBlogPostAdmin = async (postId: string, postData: BlogPostUpdateInput): Promise<BlogPost> => {
    const formData = new FormData();

    // Only append fields that are explicitly being updated
    if (postData.title !== undefined) formData.append('title', postData.title);
    if (postData.description !== undefined) formData.append('description', postData.description);
    if (postData.content !== undefined) formData.append('content', postData.content);
    if (postData.category !== undefined) formData.append('category', postData.category);
    if (postData.tags !== undefined) { 
        formData.delete('tags[]'); 
        if (postData.tags.length > 0) {
            postData.tags.forEach(tag => formData.append('tags[]', tag));
        } else {
             formData.append('tags[]', ''); 
        }
    }
    if (postData.isPublished !== undefined) formData.append('isPublished', String(postData.isPublished));
    if (postData.publishedAt !== undefined) { 
        formData.append('publishedAt', postData.publishedAt ? new Date(postData.publishedAt).toISOString() : '');
    }
    if (postData.slug !== undefined) formData.append('slug', postData.slug);
    
    if (postData.featureImage instanceof File) {
        formData.append('featureImage', postData.featureImage);
    } else if (postData.removeFeatureImage === true) {
        formData.append('removeFeatureImage', 'true');
    }

    try {
        const response = await apiClient.patch<ApiResponse<{ post: BlogPost }>>(`/admin/blog/${postId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data.status === 'success' && response.data.data?.post) {
            return response.data.data.post;
        }
        throw new Error(response.data?.message || 'Failed to update blog post');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};


export const getAllBlogPostsAdmin = async (page = 1, limit = 10): Promise<{posts: BlogPost[], total: number, totalPages: number, currentPage: number}> => {
    try {
        const response = await apiClient.get<ApiResponse<{ posts: BlogPost[] }>>('/admin/blog', {
            params: { page, limit }
        });
        if (response.data.status === 'success' && response.data.data?.posts) {
            return {
                posts: response.data.data.posts,
                total: response.data.total || 0,
                totalPages: response.data.totalPages || 1,
                currentPage: response.data.currentPage || 1,
            };
        }
        throw new Error(response.data?.message || 'Failed to fetch blog posts');
    } catch (error: any) {
        throw error.response?.data || error;
     }
};

export const getBlogPostByIdAdmin = async (postId: string): Promise<BlogPost> => {
    try {
        const response = await apiClient.get<ApiResponse<{ post: BlogPost }>>(`/admin/blog/${postId}`);
        if (response.data.status === 'success' && response.data.data?.post) {
            return response.data.data.post;
        }
        throw new Error(response.data?.message || 'Failed to fetch blog post');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

export const deleteBlogPostAdmin = async (postId: string): Promise<void> => {
    try {
        const response = await apiClient.delete<DeleteApiResponse | ''>(`/admin/blog/${postId}`);
        if (response.status === 204) return;
        if (response.data && (response.data as DeleteApiResponse).status === 'success') return;
        if (response.status < 200 || response.status >= 300) {
             throw new Error((response.data as any)?.message || `Failed to delete post`);
        }
    } catch (error: any) {
        throw error.response?.data || error;
    }
};


/**
 * Uploads an image file for use within the Tiptap editor content.
 * @param imageFile The image file to upload.
 */
export const uploadBlogContentImage = async (imageFile: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('contentImage', imageFile); 

    try {
        const response = await apiClient.post<{ status: string; data: { imageUrl: string } }>(
            '/admin/blog/content-image-upload', 
            formData, 
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        if (response.data.status === 'success' && response.data.data?.imageUrl) {
            return response.data.data;
        }
        throw new Error('Image upload failed to return a URL.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Uploads a gated material file (PDF, etc.) for a specific blog post.
 * @param postId The ID of the blog post to attach the file to.
 * @param formData The FormData object containing the file and its label.
 */
export const uploadGatedAttachmentAdmin = async (postId: string, formData: FormData): Promise<any> => {
    try {
        const response = await apiClient.post(`/admin/gated-content/${postId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        if (response.data?.status === 'success' && response.data.data?.attachment) {
            return response.data.data.attachment;
        }
        throw new Error(response.data?.message || 'Failed to upload gated file.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};