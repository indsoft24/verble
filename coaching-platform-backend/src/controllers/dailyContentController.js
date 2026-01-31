// src/controllers/dailyContentController.js
import asyncHandler from 'express-async-handler';
import DailyContent from '../models/DailyContent.js';
import { getContentSequenceNumber } from '../utils/contentNumberingHelper.js';

/**
 * @desc    Get daily content for today
 * @route   GET /api/daily-content/today
 * @access  Public
 */
export const getTodaysDailyContent = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const content = await DailyContent.find({
        date: {
            $gte: today,
            $lt: tomorrow
        },
        isActive: true
    }).sort({ level: 1, type: 1 });

    // Add sequence numbers to content
    const contentWithSequence = await Promise.all(
        content.map(async (item) => {
            const sequenceNumber = await getContentSequenceNumber(
                item._id,
                item.type,
                item.level,
                item.date
            );
            return {
                ...item.toObject(),
                sequenceNumber
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: {
            content: contentWithSequence
        }
    });
});

/**
 * @desc    Get daily content by date and/or level
 * @route   GET /api/daily-content
 * @access  Public
 */
export const getDailyContent = asyncHandler(async (req, res) => {
    const { date, level, type } = req.query;
    
    const query = { isActive: true };

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

    const content = await DailyContent.find(query).sort({ level: 1, type: 1 });

    // Add sequence numbers to content
    const contentWithSequence = await Promise.all(
        content.map(async (item) => {
            const sequenceNumber = await getContentSequenceNumber(
                item._id,
                item.type,
                item.level,
                item.date
            );
            return {
                ...item.toObject(),
                sequenceNumber
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: {
            content: contentWithSequence
        }
    });
});
