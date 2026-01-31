// File: src/controllers/blogController.js

import BlogPost from '../models/BlogPost.js';
import axios from 'axios';

/**
 * @desc    Get all published blog posts (paginated)
 * @route   GET /api/blog
 * @access  Public (or Private if only for logged-in users)
 */
export const getAllPublishedBlogPosts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit;
        const query = { isPublished: true };

        const posts = await BlogPost.find(query)
            .populate('author', 'name') 
            .sort({ publishedAt: -1, createdAt: -1 }) 
            .skip(skip)
            .limit(limit)
            .select('_id title slug description featureImage author category tags publishedAt createdAt views'); 

        const totalPosts = await BlogPost.countDocuments(query);
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            status: 'success',
            results: posts.length,
            totalResults: totalPosts,
            currentPage: page,
            totalPages: totalPages,
            data: {
                posts,
            },
        });
    } catch (error) {
        console.error("USER GET ALL PUBLISHED BLOG POSTS ERROR:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch blog posts.'
        });
    }
};

/**
 * @desc    Get a single published blog post by its slug
 * @route   GET /api/blog/:slug
 * @access  Public (or Private)
 */
export const getPublishedBlogPostBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const post = await BlogPost.findOne({ slug: slug, isPublished: true })
            .populate('author', 'name email') 
            .select('-__v');

        if (!post) {
            return res.status(404).json({ status: 'fail', message: 'Blog post not found or not published.' });
        }

        post.views = (post.views || 0) + 1;
        await post.save({ validateBeforeSave: false }); 

        res.status(200).json({
            status: 'success',
            data: {
                post,
            },
        });
    } catch (error) {
        console.error("USER GET PUBLISHED BLOG POST BY SLUG ERROR:", error);
        if (error.name === 'CastError') { 
            return res.status(400).json({ status: 'fail', message: 'Invalid post identifier format.' });
        }
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch blog post.'
        });
    }
};

/**
 * @desc    Get recent published blog posts (for sidebar)
 * @route   GET /api/blog/recent
 * @access  Public
 */
export const getRecentBlogPosts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const posts = await BlogPost.find({ isPublished: true })
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(limit)
            .select('title slug publishedAt');
        res.status(200).json({ status: 'success', data: { posts } });
    } catch (error) { 
        console.error("GET RECENT BLOG POSTS ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch recent blog posts.' });
    }
};

/**
 * @desc    Get all unique categories from published blog posts
 * @route   GET /api/blog/categories
 * @access  Public
 */
export const getAllBlogCategories = async (req, res, next) => {
    try {
        const categories = await BlogPost.distinct('category', { isPublished: true });
        const categoriesWithCounts = await BlogPost.aggregate([
            { $match: { isPublished: true, category: { $ne: null, $ne: "" } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { name: '$_id', count: 1, _id: 0 } },
            { $sort: { name: 1 } }
        ]);
        res.status(200).json({ status: 'success', data: { categories: categoriesWithCounts } });
    } catch (error) { 
        console.error("GET ALL BLOG CATEGORIES ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch blog categories.' });
    }
};

/**
 * @desc    Get all published posts for a specific category
 * @route   GET /api/blog/category/:slug
 * @access  Public
 */
export const getPublishedPostsByCategory = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const skip = (page - 1) * limit;

        if (!slug) {
            return res.status(400).json({ status: 'fail', message: 'Category slug is required.' });
        }

        const queryConditions = {
            isPublished: true,
            category: { $regex: new RegExp(`^${slug}$`, 'i') }
        };
        
        const posts = await BlogPost.find(queryConditions)
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'name')
            .select('-content'); 

        const totalPosts = await BlogPost.countDocuments(queryConditions);

        res.status(200).json({
            status: 'success',
            results: posts.length,
            data: { posts },
            total: totalPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
        });
    } catch (error) {
        console.error("GET POSTS BY CATEGORY ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch posts for this category.' });
    }
};

/**4
 * @desc    Securely serves a blog FEATURE image.
 * @route   GET /api/blog/image/:imageName
 */
export const serveBlogImage = async (req, res) => {
    try {
        const { imageName } = req.params;
        const storagePath = `blog_images/${imageName}`; 
        const downloadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;

        const response = await axios({
            method: 'get', url: downloadUrl, responseType: 'stream',
            headers: { AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY },
        });

        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        res.setHeader('Content-Type', 'image/webp');
        response.data.pipe(res);

    } catch (error) {
        if (error.response?.status === 404) return res.status(404).json({ message: 'Image not found.' });
        console.error("BLOG IMAGE SERVING ERROR:", error.message);
        res.status(500).json({ message: 'Failed to serve image.' });
    }
};

/**
 * @desc    Securely serves a blog CONTENT image (from Tiptap editor).
 * @route   GET /api/blog/content-image/:imageName
 */
export const serveBlogContentImage = async (req, res) => {
    try {
        const { imageName } = req.params;
        const storagePath = `blog_content_images/${imageName}`; 
        const downloadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;

        const response = await axios({
            method: 'get', url: downloadUrl, responseType: 'stream',
            headers: { AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY },
        });

        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        res.setHeader('Content-Type', 'image/webp');
        response.data.pipe(res);

    } catch (error) {
        if (error.response?.status === 404) return res.status(404).json({ message: 'Image not found.' });
        console.error("BLOG CONTENT IMAGE SERVING ERROR:", error.message);
        res.status(500).json({ message: 'Failed to serve image.' });
    }
};
