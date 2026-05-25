// src/models/PromoBanner.js
import mongoose from 'mongoose';

const promoBannerSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'default',
        unique: true,
    },
    isEnabled: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        trim: true,
        default: '',
    },
    batchText: {
        type: String,
        trim: true,
        default: '',
    },
    urgencyText: {
        type: String,
        trim: true,
        default: '',
    },
    ctaText: {
        type: String,
        trim: true,
        default: 'Join Now',
    },
    ctaUrl: {
        type: String,
        trim: true,
        default: '#',
    },
    originalPrice: {
        type: String,
        trim: true,
        default: '',
    },
    offerPrice: {
        type: String,
        trim: true,
        default: '',
    },
    countdownMinutes: {
        type: Number,
        default: 5,
        min: 1,
        max: 1440,
    },
}, {
    timestamps: true,
});

const PromoBanner = mongoose.model('PromoBanner', promoBannerSchema);
export default PromoBanner;
