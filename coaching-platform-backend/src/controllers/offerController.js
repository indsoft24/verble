// src/controllers/offerController.js
import asyncHandler from 'express-async-handler';
import Offer from '../models/Offer.js';

/**
 * @desc    Get active offers and webinars
 * @route   GET /api/offers
 * @access  Public
 */
export const getActiveOffers = asyncHandler(async (req, res) => {
    const now = new Date();

    const offers = await Offer.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    })
        .sort({ priority: -1, createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            offers,
        },
    });
});

/**
 * @desc    Create offer (Admin only)
 * @route   POST /api/offers
 * @access  Private (Admin)
 */
export const createOffer = asyncHandler(async (req, res) => {
    const { title, description, type, imageUrl, linkUrl, startDate, endDate, priority } = req.body;

    if (!title || !type || !startDate || !endDate) {
        res.status(400);
        throw new Error('Title, type, startDate, and endDate are required');
    }

    const offer = await Offer.create({
        title,
        description,
        type,
        imageUrl,
        linkUrl,
        startDate,
        endDate,
        priority: priority || 0,
        createdBy: req.user._id,
    });

    res.status(201).json({
        status: 'success',
        data: {
            offer,
        },
    });
});
