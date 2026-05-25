import BlogPost from '../models/BlogPost.js';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { processAndUploadImage, deleteStoredImage } from '../utils/localImageStorage.js';

/**
 * @desc    Upload an image for Tiptap editor content to Bunny Storage
 * @route   POST /api/admin/blog/content-image-upload
 */
export const uploadBlogContentImageAdmin = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'fail', message: 'No image file provided.' });
        }
        const imageUrl = await processAndUploadImage(req.file.buffer, {
            width: 800,
            quality: 75,
            pathPrefix: 'blog_content_images', 
            originalName: req.file.originalname,
        });
        res.status(201).json({ status: 'success', data: { imageUrl } });
    } catch (error) {
        console.error("UPLOAD CONTENT IMAGE ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to upload content image.' });
    }
};

/**
 * @desc    Create a new blog post
 * @route   POST /api/admin/blog
 */
export const createBlogPostAdmin = async (req, res) => {
    try {
        const { title, description, content, category, tags, isPublished, publishedAt, slug } = req.body;

        let featureImageUrl;
        if (req.file) {
            featureImageUrl = await processAndUploadImage(req.file.buffer, {
                width: 1200,
                quality: 80,
                pathPrefix: 'blog_images', 
                originalName: req.file.originalname,
            });
        }

        const postData = {
            title, description, content, category,
            tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : []),
            isPublished: isPublished === 'true',
            publishedAt: (isPublished === 'true') ? (publishedAt || new Date()) : undefined,
            author: req.user._id,
            featureImage: featureImageUrl,
            slug: slugify(slug || title, { lower: true, strict: true }),
        };
        
        const newPost = await BlogPost.create(postData);
        const populatedPost = await BlogPost.findById(newPost._id).populate('author', 'name');

        res.status(201).json({ status: 'success', data: { post: populatedPost } });
    } catch (error) {
        console.error("ADMIN CREATE BLOG POST ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to create blog post.' });
    }
};

/**
 * @desc    Update a blog post
 * @route   PATCH /api/admin/blog/:postId
 */
export const updateBlogPostAdmin = async (req, res) => {
    try {
        const { postId } = req.params;
        const postToUpdate = await BlogPost.findById(postId);
        if (!postToUpdate) {
            return res.status(404).json({ status: 'fail', message: 'Blog post not found.' });
        }

        let newFeatureImageUrl = postToUpdate.featureImage;
        
        if (req.file) { 
            await deleteStoredImage(postToUpdate.featureImage); 
            newFeatureImageUrl = await processAndUploadImage(req.file.buffer, {
                width: 1200, quality: 90, pathPrefix: 'blog_images', originalName: req.file.originalname,
            });
        } else if (req.body.removeFeatureImage === 'true') { 
            await deleteStoredImage(postToUpdate.featureImage);
            newFeatureImageUrl = ''; 
        }

        const { title, description, content, category, tags, isPublished, publishedAt, slug } = req.body;
        postToUpdate.title = title ?? postToUpdate.title;
        postToUpdate.description = description ?? postToUpdate.description;
        postToUpdate.content = content ?? postToUpdate.content;
        postToUpdate.category = category ?? postToUpdate.category;
        postToUpdate.tags = tags !== undefined ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim())) : postToUpdate.tags;
        postToUpdate.isPublished = isPublished !== undefined ? (isPublished === 'true') : postToUpdate.isPublished;
        postToUpdate.slug = slug ? slugify(slug, { lower: true, strict: true }) : postToUpdate.slug;
        postToUpdate.featureImage = newFeatureImageUrl;
        
        if (postToUpdate.isPublished && !postToUpdate.publishedAt) {
            postToUpdate.publishedAt = new Date();
        } else if (isPublished !== undefined && !postToUpdate.isPublished) {
            postToUpdate.publishedAt = undefined;
        } else if (publishedAt !== undefined) {
            postToUpdate.publishedAt = publishedAt ? new Date(publishedAt) : undefined;
        }
        
        const updatedPost = await postToUpdate.save();
        const populatedPost = await BlogPost.findById(updatedPost._id).populate('author', 'name');
        res.status(200).json({ status: 'success', data: { post: populatedPost } });
    } catch (error) {
        console.error("ADMIN UPDATE BLOG POST ERROR:", error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to update post.' });
    }
};

/**
 * @desc    Delete a blog post
 * @route   DELETE /api/admin/blog/:postId
 */
export const deleteBlogPostAdmin = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await BlogPost.findById(postId);
        if (!post) {
            return res.status(404).json({ status: 'fail', message: 'Blog post not found.' });
        }
        
        await deleteStoredImage(post.featureImage); // Delete image from Bunny Storage
        await BlogPost.findByIdAndDelete(postId); // Delete post from DB
        
        res.status(204).send();
    } catch (error) {
        console.error("ADMIN DELETE BLOG POST ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete blog post.' });
    }
};


export const getAllBlogPostsAdmin = async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const posts = await BlogPost.find({}).populate('author', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalPosts = await BlogPost.countDocuments();
    res.status(200).json({
        status: 'success', results: posts.length, total: totalPosts,
        currentPage: page, totalPages: Math.ceil(totalPosts / limit), data: { posts },
    });
};

export const getBlogPostByIdAdmin = async (req, res) => {
    const post = await BlogPost.findById(req.params.postId).populate('author', 'name');
    if (!post) { return res.status(404).json({ status: 'fail', message: 'Post not found.' }); }
    res.status(200).json({ status: 'success', data: { post } });
};