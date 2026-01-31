// Splash/placeholder image path - used as fallback when images are not available
export const SPLASH_IMAGE_URL = '/verble-logo.svg';

/**
 * Get the splash image URL to use as fallback
 * @returns {string} Path to splash image
 */
export const getSplashImageUrl = (): string => {
    return SPLASH_IMAGE_URL;
};

/**
 * Converts Bunny CDN URLs to secure API endpoints
 * Extracts filename from Bunny CDN URL and maps to appropriate API endpoint
 * Returns splash image if path is not available
 */
export const getImageUrl = (
    path?: string,
    type: 'course' | 'module' | 'subscription' | 'blog' | 'blog-content' | 'video' | 'exam-category' = 'course'
): string => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    
    if (!path || path.trim() === '') {
        return getSplashImageUrl();
    }
    
    // Handle blob URLs (for preview images)
    if (path.startsWith('blob:')) {
        return path;
    }
    
    // If it's already an API URL from our backend, return as-is
    if (path.startsWith(apiBaseUrl)) {
        return path;
    }
    
    // If it's already a full URL (Bunny CDN or other), extract filename and convert to API endpoint
    if (path.startsWith('http')) {
        try {
            const url = new URL(path);
            const pathSegments = url.pathname.split('/');
            const fileName = pathSegments[pathSegments.length - 1];
            
            if (!fileName) {
                return getSplashImageUrl();
            }
            
            // Auto-detect type from URL path if not provided
            let imageType = type;
            if (!imageType || imageType === 'course') {
                if (url.pathname.includes('/blog_content_images/') || url.pathname.includes('/blog-content/')) {
                    imageType = 'blog-content';
                } else if (url.pathname.includes('/blog_images/') || url.pathname.includes('/blogs/')) {
                    imageType = 'blog';
                } else if (url.pathname.includes('/course_images/') || url.pathname.includes('/courses/')) {
                    imageType = 'course';
                } else if (url.pathname.includes('/module_images/') || url.pathname.includes('/modules/')) {
                    imageType = 'module';
                } else if (url.pathname.includes('/subscription_images/') || url.pathname.includes('/subscription-plans/') || url.pathname.includes('/subscriptions/')) {
                    imageType = 'subscription';
                } else if (url.pathname.includes('/video_thumbnails/') || url.pathname.includes('/videos/')) {
                    imageType = 'video';
                } else if (url.pathname.includes('/exam_category_images/') || url.pathname.includes('/exam-categories/')) {
                    imageType = 'exam-category';
                }
            }
            
            // Map image types to their respective API endpoints
            switch (imageType) {
                case 'course':
                    return `${apiBaseUrl}/courses/image/${fileName}`;
                case 'module':
                    return `${apiBaseUrl}/modules/image/${fileName}`;
                case 'subscription':
                    return `${apiBaseUrl}/subscription-plans/image/${fileName}`;
                case 'blog':
                    return `${apiBaseUrl}/blog/image/${fileName}`;
                case 'blog-content':
                    return `${apiBaseUrl}/blog/content-image/${fileName}`;
                case 'video':
                    return `${apiBaseUrl}/images/videos/${fileName}`;
                case 'exam-category':
                    return `${apiBaseUrl}/images/exam-categories/${fileName}`;
                default:
                    return `${apiBaseUrl}/images/general/${fileName}`;
            }
        } catch (e) {
            console.error('Error parsing image URL:', e);
            return getSplashImageUrl();
        }
    }
    
    // For relative paths, construct the API image URL
    const relativePathUrl = `${apiBaseUrl}/images/${path.replace(/^\//, '')}`;
    // Return the constructed URL, but if it's invalid, return splash
    return relativePathUrl || getSplashImageUrl();
};
