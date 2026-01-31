import asyncHandler from 'express-async-handler';
import KnowledgeBaseArticle from '../models/KnowledgeBaseArticle.js';
import mongoose from 'mongoose';

/**
 * @desc    Create a new knowledge base article
 * @route   POST /api/admin/knowledge-base
 * @access  Private/Admin
 */
export const createArticle = asyncHandler(async (req, res) => {
    const { title, content, keywords, category, isEnabled } = req.body;

    if (!title || !content) {
        res.status(400);
        throw new Error('Title and content are required fields.');
    }

    const article = new KnowledgeBaseArticle({
        title,
        content,
        keywords: keywords || [],
        category: category || '',
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        lastUpdatedBy: req.user._id, 
    });

    const createdArticle = await article.save();
    res.status(201).json({
        status: 'success',
        data: { article: createdArticle },
    });
});

/**
 * @desc    Get all knowledge base articles for the admin panel
 * @route   GET /api/admin/knowledge-base
 * @access  Private/Admin
 */
export const getAllArticles = asyncHandler(async (req, res) => {
    const articles = await KnowledgeBaseArticle.find({})
        .populate('lastUpdatedBy', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: articles.length,
        data: { articles },
    });
});

/**
 * @desc    Get a single article by its ID
 * @route   GET /api/admin/knowledge-base/:id
 * @access  Private/Admin
 */
export const getArticleById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid article ID format.');
    }
    const article = await KnowledgeBaseArticle.findById(req.params.id);

    if (article) {
        res.status(200).json({ status: 'success', data: { article } });
    } else {
        res.status(404);
        throw new Error('Knowledge base article not found.');
    }
});

/**
 * @desc    Update a knowledge base article
 * @route   PATCH /api/admin/knowledge-base/:id
 * @access  Private/Admin
 */
export const updateArticle = asyncHandler(async (req, res) => {
    const { title, content, keywords, category, isEnabled } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid article ID format.');
    }
    
    const article = await KnowledgeBaseArticle.findById(req.params.id);

    if (!article) {
        res.status(404);
        throw new Error('Knowledge base article not found.');
    }

    if (title !== undefined) {
        article.title = title;
    }
    if (content !== undefined) {
        article.content = content;
    }
    if (keywords !== undefined) {
        article.keywords = keywords;
    }
    if (category !== undefined) {
        article.category = category;
    }
    if (isEnabled !== undefined) {
        article.isEnabled = isEnabled;
    }
    article.lastUpdatedBy = req.user._id;

    const updatedArticle = await article.save();
    res.status(200).json({
        status: 'success',
        data: { article: updatedArticle },
    });
});

/**
 * @desc    Delete a knowledge base article
 * @route   DELETE /api/admin/knowledge-base/:id
 * @access  Private/Admin
 */
export const deleteArticle = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid article ID format.');
    }
    
    const article = await KnowledgeBaseArticle.findById(req.params.id);

    if (article) {
        await article.deleteOne();
        res.status(200).json({ status: 'success', message: 'Article deleted successfully.' });
    } else {
        res.status(404);
        throw new Error('Knowledge base article not found.');
    }
});
