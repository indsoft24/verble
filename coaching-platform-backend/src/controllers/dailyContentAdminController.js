// src/controllers/dailyContentAdminController.js
import asyncHandler from 'express-async-handler';
import DailyContent from '../models/DailyContent.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all daily content (admin)
 * @route   GET /api/admin/daily-content
 * @access  Private/Admin
 */
export const getAllDailyContentAdmin = asyncHandler(async (req, res) => {
    const { date, level, type } = req.query;
    
    const query = {};

    if (date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        query.date = {
            $gte: targetDate,
            $lt: nextDay
        };
    }

    if (level) {
        query.level = level;
    }

    if (type) {
        query.type = type;
    }

    const content = await DailyContent.find(query)
        .sort({ date: -1, level: 1, type: 1 })
        .populate('createdBy', 'name email');

    res.status(200).json({
        status: 'success',
        data: {
            content
        }
    });
});

/**
 * @desc    Create daily content
 * @route   POST /api/admin/daily-content
 * @access  Private/Admin
 */
export const createDailyContentAdmin = asyncHandler(async (req, res) => {
    const { type, date, level, title, metadata, isActive } = req.body;

    if (!type || !date || !level || !title || !metadata) {
        res.status(400);
        throw new Error('Type, date, level, title, and metadata are required.');
    }

    // Validate type
    const validTypes = ['WORD', 'PHRASE', 'STORY', 'VOCAB_SET', 'CONVERSATION', 'PUZZLE', 'SCENE', 'SPEECH', 'LYRICS', 'FEED'];
    if (!validTypes.includes(type)) {
        res.status(400);
        throw new Error('Invalid content type.');
    }

    // Validate level
    const validLevels = ['FREE', 'BRONZE', 'SILVER', 'GOLD'];
    if (!validLevels.includes(level)) {
        res.status(400);
        throw new Error('Invalid level.');
    }

    const contentDate = new Date(date);
    contentDate.setHours(0, 0, 0, 0);

    const newContent = await DailyContent.create({
        type,
        date: contentDate,
        level,
        title,
        metadata,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id
    });

    const populatedContent = await DailyContent.findById(newContent._id)
        .populate('createdBy', 'name email');

    res.status(201).json({
        status: 'success',
        data: {
            content: populatedContent
        }
    });
});

/**
 * @desc    Update daily content
 * @route   PATCH /api/admin/daily-content/:id
 * @access  Private/Admin
 */
export const updateDailyContentAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, date, level, title, metadata, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid content ID.');
    }

    const content = await DailyContent.findById(id);
    if (!content) {
        res.status(404);
        throw new Error('Content not found.');
    }

    if (type) {
        const validTypes = ['WORD', 'PHRASE', 'STORY', 'VOCAB_SET', 'CONVERSATION', 'PUZZLE', 'SCENE', 'SPEECH', 'LYRICS', 'FEED'];
        if (!validTypes.includes(type)) {
            res.status(400);
            throw new Error('Invalid content type.');
        }
        content.type = type;
    }

    if (date) {
        const contentDate = new Date(date);
        contentDate.setHours(0, 0, 0, 0);
        content.date = contentDate;
    }

    if (level) {
        const validLevels = ['FREE', 'BRONZE', 'SILVER', 'GOLD'];
        if (!validLevels.includes(level)) {
            res.status(400);
            throw new Error('Invalid level.');
        }
        content.level = level;
    }

    if (title) {
        content.title = title;
    }

    if (metadata) {
        content.metadata = metadata;
    }

    if (isActive !== undefined) {
        content.isActive = isActive;
    }

    await content.save();

    const populatedContent = await DailyContent.findById(content._id)
        .populate('createdBy', 'name email');

    res.status(200).json({
        status: 'success',
        data: {
            content: populatedContent
        }
    });
});

/**
 * @desc    Delete daily content
 * @route   DELETE /api/admin/daily-content/:id
 * @access  Private/Admin
 */
export const deleteDailyContentAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid content ID.');
    }

    const content = await DailyContent.findById(id);
    if (!content) {
        res.status(404);
        throw new Error('Content not found.');
    }

    await DailyContent.findByIdAndDelete(id);

    res.status(200).json({
        status: 'success',
        message: 'Content deleted successfully.'
    });
});
