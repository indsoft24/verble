// src/controllers/helpController.js
import asyncHandler from 'express-async-handler';
import KnowledgeBaseArticle from '../models/KnowledgeBaseArticle.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all enabled help articles (public)
 * @route   GET /api/help
 * @access  Public
 */
export const getHelpArticles = asyncHandler(async (req, res) => {
    const { category, search } = req.query;
    
    const query = { isEnabled: true };
    
    // Filter by category if provided
    if (category) {
        query.category = category;
    }
    
    // Search in title, content, and keywords
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { keywords: { $in: [new RegExp(search, 'i')] } }
        ];
    }
    
    const articles = await KnowledgeBaseArticle.find(query)
        .select('title content keywords category createdAt updatedAt')
        .sort({ createdAt: -1 });
    
    res.status(200).json({
        status: 'success',
        results: articles.length,
        data: { articles },
    });
});

/**
 * @desc    Get a single help article by ID (public)
 * @route   GET /api/help/:id
 * @access  Public
 */
export const getHelpArticleById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid article ID format.');
    }
    
    const article = await KnowledgeBaseArticle.findOne({
        _id: req.params.id,
        isEnabled: true
    }).select('title content keywords category createdAt updatedAt');
    
    if (!article) {
        res.status(404);
        throw new Error('Help article not found or is disabled.');
    }
    
    res.status(200).json({
        status: 'success',
        data: { article },
    });
});

/**
 * @desc    Get all unique categories from enabled articles
 * @route   GET /api/help/categories
 * @access  Public
 */
export const getHelpCategories = asyncHandler(async (req, res) => {
    const categories = await KnowledgeBaseArticle.distinct('category', {
        isEnabled: true,
        category: { $exists: true, $ne: null, $ne: '' }
    });
    
    res.status(200).json({
        status: 'success',
        data: { categories: categories.sort() },
    });
});
