import { serveImageFile } from '../utils/localImageStorage.js';

/**
 * @desc    General image serving — files under uploads/images/ on disk
 * @route   GET /api/images/:type/:imageName
 * @access  Public
 * @param   {string} type - Image type (courses, modules, subscription-plans, blogs, blog-content, videos, etc.)
 * @param   {string} imageName - Image filename
 */
export const serveGeneralImage = async (req, res) => {
    try {
        const { type, imageName } = req.params;

        // Validate image type and map to storage path
        const imageTypeMap = {
            'courses': 'course_images',
            'modules': 'module_images',
            'subscription-plans': 'subscription_images',
            'subscription_plans': 'subscription_images', // Alternative naming
            'blogs': 'blog_images',
            'blog-content': 'blog_content_images',
            'blog_content': 'blog_content_images', // Alternative naming
            'videos': 'video_thumbnails',
            'video-thumbnails': 'video_thumbnails', // Alternative naming
            'users': 'user_avatars',
            'user-avatars': 'user_avatars', // Alternative naming
            'exam-categories': 'exam_category_images',
            'exam_categories': 'exam_category_images', // Alternative naming
            'materials': 'material_files',
            'gated-content': 'gated_content_files',
            'gated_content': 'gated_content_files' // Alternative naming
        };

        const storagePath = imageTypeMap[type];

        if (!storagePath) {
            return res.status(400).json({
                message: 'Invalid image type. Supported types: courses, modules, subscription-plans, blogs, blog-content, videos, users, exam-categories, materials, gated-content',
                supportedTypes: Object.keys(imageTypeMap)
            });
        }

        // Validate image name format
        if (!imageName || imageName.includes('..') || imageName.includes('/') || imageName.includes('\\')) {
            return res.status(400).json({ message: 'Invalid image name format.' });
        }

        await serveImageFile(imageName, storagePath, res);

    } catch (error) {
        console.error("GENERAL IMAGE SERVING ERROR:", error.message);
        res.status(500).json({ message: 'Failed to serve image.' });
    }
};

/**
 * @desc    Get list of supported image types for Android app
 * @route   GET /api/images/types
 * @access  Public
 */
export const getSupportedImageTypes = async (req, res) => {
    try {
        const supportedTypes = {
            'courses': 'Course images',
            'modules': 'Module images',
            'subscription-plans': 'Subscription plan images',
            'blogs': 'Blog feature images',
            'blog-content': 'Blog content images (from editor)',
            'videos': 'Video thumbnail images',
            'users': 'User avatar images',
            'exam-categories': 'Exam category images',
            'materials': 'Material file images',
            'gated-content': 'Gated content file images'
        };

        res.status(200).json({
            status: 'success',
            data: {
                supportedTypes,
                usage: 'Use GET /api/images/{type}/{imageName} to serve images',
                example: '/api/images/courses/course-image-123.webp'
            }
        });
    } catch (error) {
        console.error("GET SUPPORTED IMAGE TYPES ERROR:", error.message);
        res.status(500).json({ message: 'Failed to get supported image types.' });
    }
};

/**
 * @desc    Serves a course image (legacy path).
 * @route   GET /api/courses/image/:imageName
 */
export const serveCourseImage = async (req, res) => {
    try {
        const { imageName } = req.params;
        await serveImageFile(imageName, 'course_images', res);
    } catch (error) {
        console.error("COURSE IMAGE SERVING ERROR:", error.message);
        res.status(500).json({ message: 'Failed to serve course image.' });
    }
};

/**
 * @desc    Serves a module image (legacy path).
 * @route   GET /api/modules/image/:imageName
 */
export const serveModuleImage = async (req, res) => {
    try {
        const { imageName } = req.params;
        await serveImageFile(imageName, 'module_images', res);
    } catch (error) {
        console.error("MODULE IMAGE SERVING ERROR:", error.message);
        res.status(500).json({ message: 'Failed to serve module image.' });
    }
};

/**
 * @desc    Serves a subscription plan image (legacy path).
 * @route   GET /api/subscription-plans/image/:imageName
 */
export const serveSubscriptionImage = async (req, res) => {
    try {
        const { imageName } = req.params;
        await serveImageFile(imageName, 'subscription_images', res);
    } catch (error) {
        console.error("SUBSCRIPTION IMAGE SERVING ERROR:", error.message);
        res.status(500).json({ message: 'Failed to serve subscription plan image.' });
    }
};
