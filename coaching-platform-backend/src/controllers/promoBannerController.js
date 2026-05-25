// src/controllers/promoBannerController.js
import asyncHandler from 'express-async-handler';
import PromoBanner from '../models/PromoBanner.js';

const DEFAULT_KEY = 'default';

/**
 * @desc    Get active promo banner (public)
 * @route   GET /api/promo-banner
 * @access  Public
 */
export const getPromoBanner = asyncHandler(async (req, res) => {
    let doc = await PromoBanner.findOne({ key: DEFAULT_KEY }).lean();
    if (!doc) {
        doc = await PromoBanner.create({
            key: DEFAULT_KEY,
            isEnabled: false,
            title: '',
            batchText: '',
            urgencyText: '',
            ctaText: 'Join Now',
            ctaUrl: '#',
            originalPrice: '',
            offerPrice: '',
            countdownMinutes: 5,
        });
        doc = doc.toObject();
    }
    res.status(200).json({
        status: 'success',
        data: { promoBanner: doc },
    });
});

/**
 * @desc    Get promo banner for admin
 * @route   GET /api/admin/promo-banner
 * @access  Private (Admin)
 */
export const getPromoBannerAdmin = asyncHandler(async (req, res) => {
    let doc = await PromoBanner.findOne({ key: DEFAULT_KEY }).lean();
    if (!doc) {
        const created = await PromoBanner.create({
            key: DEFAULT_KEY,
            isEnabled: false,
            title: '',
            batchText: '',
            urgencyText: '',
            ctaText: 'Join Now',
            ctaUrl: '#',
            originalPrice: '',
            offerPrice: '',
            countdownMinutes: 5,
        });
        doc = created.toObject();
    }
    res.status(200).json({
        status: 'success',
        data: { promoBanner: doc },
    });
});

/**
 * @desc    Update promo banner
 * @route   PUT /api/admin/promo-banner
 * @access  Private (Admin)
 */
export const updatePromoBanner = asyncHandler(async (req, res) => {
    const {
        isEnabled,
        title,
        batchText,
        urgencyText,
        ctaText,
        ctaUrl,
        originalPrice,
        offerPrice,
        countdownMinutes,
    } = req.body;

    const doc = await PromoBanner.findOneAndUpdate(
        { key: DEFAULT_KEY },
        {
            $set: {
                ...(typeof isEnabled === 'boolean' && { isEnabled }),
                ...(title !== undefined && { title: String(title).trim() }),
                ...(batchText !== undefined && { batchText: String(batchText).trim() }),
                ...(urgencyText !== undefined && { urgencyText: String(urgencyText).trim() }),
                ...(ctaText !== undefined && { ctaText: String(ctaText).trim() }),
                ...(ctaUrl !== undefined && { ctaUrl: String(ctaUrl).trim() }),
                ...(originalPrice !== undefined && { originalPrice: String(originalPrice).trim() }),
                ...(offerPrice !== undefined && { offerPrice: String(offerPrice).trim() }),
                ...(countdownMinutes !== undefined && {
                    countdownMinutes: Math.min(1440, Math.max(1, Number(countdownMinutes) || 5)),
                }),
            },
        },
        { new: true, upsert: true, runValidators: true }
    ).lean();

    res.status(200).json({
        status: 'success',
        data: { promoBanner: doc },
    });
});
