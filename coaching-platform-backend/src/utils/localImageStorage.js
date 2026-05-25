import sharp from 'sharp';
import path from 'path';
import fsPromises from 'fs/promises';
import { createReadStream, constants as fsConstants } from 'fs';
import { getVideoStorageRoot } from '../config/videoStorageConfig.js';

/** URL segment (GET /api/images/:type/...) → disk folder — matches imageServingController. */
const URL_TYPE_TO_STORAGE_FOLDER = {
    courses: 'course_images',
    modules: 'module_images',
    'subscription-plans': 'subscription_images',
    subscription_plans: 'subscription_images',
    blogs: 'blog_images',
    'blog-content': 'blog_content_images',
    blog_content: 'blog_content_images',
    videos: 'video_thumbnails',
    'video-thumbnails': 'video_thumbnails',
    users: 'user_avatars',
    'user-avatars': 'user_avatars',
    'exam-categories': 'exam_category_images',
    exam_categories: 'exam_category_images',
    materials: 'material_files',
    'gated-content': 'gated_content_files',
    gated_content: 'gated_content_files',
};

const STORAGE_FOLDER_TO_URL_TYPE = {
    course_images: 'courses',
    module_images: 'modules',
    subscription_images: 'subscription-plans',
    blog_images: 'blogs',
    blog_content_images: 'blog-content',
    video_thumbnails: 'videos',
    user_avatars: 'users',
    exam_category_images: 'exam-categories',
    material_files: 'materials',
    gated_content_files: 'gated-content',
};

export function getImageStorageRoot() {
    return path.join(path.dirname(getVideoStorageRoot()), 'images');
}

function getPublicApiOrigin() {
    const raw = process.env.API_PUBLIC_ORIGIN || process.env.BASE_URL || 'http://localhost:5000';
    return String(raw).replace(/\/$/, '');
}

function safeFilenameBase(originalName) {
    const base = (originalName || 'image').replace(/\.[^/.]+$/, '');
    const cleaned = base.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
    return cleaned || 'image';
}

/**
 * Process image to WebP and save under uploads/images/{pathPrefix}/...
 * @returns {Promise<string>} Public URL for GET /api/images/:type/:filename
 */
export const processAndUploadImage = async (fileBuffer, options) => {
    const { width, quality, pathPrefix, originalName } = options;

    const processedImageBuffer = await sharp(fileBuffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

    const outputFilename = `${safeFilenameBase(originalName)}-${Date.now()}.webp`;

    const dir = path.join(getImageStorageRoot(), pathPrefix);
    await fsPromises.mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, outputFilename);
    await fsPromises.writeFile(fullPath, processedImageBuffer);

    const urlType = STORAGE_FOLDER_TO_URL_TYPE[pathPrefix] || pathPrefix;
    return `${getPublicApiOrigin()}/api/images/${urlType}/${outputFilename}`;
};

/** Delete file given stored public URL (local /api/images/... only). */
export const deleteStoredImage = async (fileUrl) => {
    try {
        if (!fileUrl || typeof fileUrl !== 'string') return;

        const localMatch = fileUrl.match(/\/api\/images\/([^/]+)\/([^/?#]+)$/);
        if (!localMatch) return;

        const [, urlType, imageName] = localMatch;
        const storageFolder = URL_TYPE_TO_STORAGE_FOLDER[urlType];
        if (!storageFolder || imageName.includes('..') || imageName.includes('/') || imageName.includes('\\')) {
            return;
        }
        const fullPath = path.join(getImageStorageRoot(), storageFolder, imageName);
        await fsPromises.unlink(fullPath).catch(() => {});
    } catch (error) {
        console.error('Error deleting stored image:', error.message);
    }
};

/** Stream WebP from disk. */
export const serveImageFile = async (imageName, pathPrefix, res) => {
    try {
        if (!imageName || imageName.includes('..') || imageName.includes('/') || imageName.includes('\\')) {
            return res.status(400).json({ message: 'Invalid image name.' });
        }

        const localPath = path.join(getImageStorageRoot(), pathPrefix, imageName);
        try {
            await fsPromises.access(localPath, fsConstants.R_OK);
        } catch {
            return res.status(404).json({ message: 'Image not found.' });
        }

        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        res.setHeader('Content-Type', 'image/webp');
        createReadStream(localPath).pipe(res);
    } catch (error) {
        console.error(`IMAGE SERVING ERROR for ${pathPrefix}:`, error.message);
        res.status(500).json({ message: 'Failed to serve image.' });
    }
};
