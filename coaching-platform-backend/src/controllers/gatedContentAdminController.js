import BlogPost from '../models/BlogPost.js';
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import fsPromises from 'fs/promises';
import path from 'path';
import { getUploadsRoot } from '../config/videoStorageConfig.js';

/**
 * @desc    Upload a gated file and attach it to a blog post
 * @route   POST /api/admin/gated-content/:postId
 * @access  Private/Admin
 */
export const uploadGatedFile = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { label } = req.body;
    const file = req.file;

    if (!file) {
        res.status(400);
        throw new Error('No file provided.');
    }
    if (!label) {
        res.status(400);
        throw new Error('A label for the file is required.');
    }
    if (!mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400);
        throw new Error('Invalid Blog Post ID.');
    }

    const post = await BlogPost.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Blog post not found.');
    }

    const safeOriginal = (file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
    const storagePath = path.posix.join('gated_materials', `${postId}-${Date.now()}-${safeOriginal}`);
    const fullPath = path.join(getUploadsRoot(), storagePath);

    await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });
    await fsPromises.writeFile(fullPath, file.buffer);

    const newAttachment = {
        label,
        storagePath,
        originalFileName: file.originalname,
        fileType: file.mimetype,
    };

    post.gatedAttachments.push(newAttachment);
    await post.save();

    res.status(201).json({
        status: 'success',
        message: 'Gated file uploaded and attached successfully.',
        data: {
            attachment: post.gatedAttachments[post.gatedAttachments.length - 1],
        },
    });
});
