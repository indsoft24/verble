// src/controllers/aiPromptController.js
import asyncHandler from 'express-async-handler';
import AIPrompt from '../models/AIPrompt.js';

/**
 * @desc    Get all AI prompts grouped by topic
 * @route   GET /api/ai-prompts
 * @access  Private (Logged-in users)
 */
export const getAllPrompts = asyncHandler(async (req, res) => {
    const { level } = req.query;
    
    const query = { isActive: true };
    if (level) {
        query.level = level;
    }

    const prompts = await AIPrompt.find(query).sort({ topic: 1, createdAt: 1 });

    // Group prompts by topic
    const promptsByTopic = {};
    prompts.forEach(prompt => {
        const topic = prompt.topic || 'Uncategorized';
        if (!promptsByTopic[topic]) {
            promptsByTopic[topic] = [];
        }
        promptsByTopic[topic].push({
            _id: prompt._id,
            title: prompt.title,
            prompt: prompt.prompt,
            description: prompt.description,
            tags: prompt.tags,
            category: prompt.category,
            level: prompt.level,
            usageCount: prompt.usageCount,
        });
    });

    // Get all unique topics
    const topics = Object.keys(promptsByTopic).sort();

    res.status(200).json({
        status: 'success',
        data: {
            topics,
            promptsByTopic,
        },
    });
});

/**
 * @desc    Get all unique topics/categories
 * @route   GET /api/ai-prompts/topics
 * @access  Private (Logged-in users)
 */
export const getTopics = asyncHandler(async (req, res) => {
    const topics = await AIPrompt.distinct('topic', { isActive: true });
    const categories = await AIPrompt.distinct('category', { isActive: true });

    res.status(200).json({
        status: 'success',
        data: {
            topics: topics.filter(t => t).sort(),
            categories: categories.filter(c => c).sort(),
        },
    });
});

/**
 * @desc    Increment usage count when a prompt is copied
 * @route   POST /api/ai-prompts/:id/increment-usage
 * @access  Private (Logged-in users)
 */
export const incrementUsage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prompt = await AIPrompt.findById(id);
    if (!prompt) {
        res.status(404);
        throw new Error('Prompt not found');
    }

    prompt.usageCount = (prompt.usageCount || 0) + 1;
    await prompt.save();

    res.status(200).json({
        status: 'success',
        data: {
            usageCount: prompt.usageCount,
        },
    });
});

/**
 * @desc    Create a new AI prompt (Admin only)
 * @route   POST /api/ai-prompts
 * @access  Private (Admin only)
 */
export const createPrompt = asyncHandler(async (req, res) => {
    const { topic, category, title, prompt, description, tags, level } = req.body;

    if (!topic || !title || !prompt) {
        res.status(400);
        throw new Error('Topic, title, and prompt are required');
    }

    const newPrompt = await AIPrompt.create({
        topic,
        category,
        title,
        prompt,
        description,
        tags: tags || [],
        level: level || 'GOLD',
        createdBy: req.user._id,
    });

    res.status(201).json({
        status: 'success',
        data: {
            prompt: newPrompt,
        },
    });
});

/**
 * @desc    Update an AI prompt (Admin only)
 * @route   PUT /api/ai-prompts/:id
 * @access  Private (Admin only)
 */
export const updatePrompt = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { topic, category, title, prompt, description, tags, level, isActive } = req.body;

    const existingPrompt = await AIPrompt.findById(id);
    if (!existingPrompt) {
        res.status(404);
        throw new Error('Prompt not found');
    }

    if (topic) existingPrompt.topic = topic;
    if (category !== undefined) existingPrompt.category = category;
    if (title) existingPrompt.title = title;
    if (prompt) existingPrompt.prompt = prompt;
    if (description !== undefined) existingPrompt.description = description;
    if (tags) existingPrompt.tags = tags;
    if (level) existingPrompt.level = level;
    if (isActive !== undefined) existingPrompt.isActive = isActive;

    await existingPrompt.save();

    res.status(200).json({
        status: 'success',
        data: {
            prompt: existingPrompt,
        },
    });
});

/**
 * @desc    Delete an AI prompt (Admin only)
 * @route   DELETE /api/ai-prompts/:id
 * @access  Private (Admin only)
 */
export const deletePrompt = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prompt = await AIPrompt.findById(id);
    if (!prompt) {
        res.status(404);
        throw new Error('Prompt not found');
    }

    await prompt.deleteOne();

    res.status(200).json({
        status: 'success',
        message: 'Prompt deleted successfully',
    });
});
