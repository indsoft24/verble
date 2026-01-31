import BlogPost from '../models/BlogPost.js';
import mongoose from 'mongoose';
import axios from 'axios';
import asyncHandler from 'express-async-handler';

/**
 * Helper function to upload a file buffer to a specified path in Bunny Storage.
 */
const uploadToBunny = async (fileBuffer, storagePath, mimeType) => {
    const uploadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;
    await axios.put(uploadUrl, fileBuffer, {
        headers: {
            'AccessKey': process.env.BUNNY_STORAGE_ACCESS_KEY,
            'Content-Type': mimeType,
        },
    });
    return storagePath; 
};

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

    const storagePath = `gated_materials/${postId}-${Date.now()}-${file.originalname}`;
    
    await uploadToBunny(file.buffer, storagePath, file.mimetype);

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