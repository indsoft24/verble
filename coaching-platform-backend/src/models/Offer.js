// src/models/Offer.js
import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Offer title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: ['OFFER', 'WEBINAR'],
        required: true,
    },
    imageUrl: {
        type: String,
        trim: true,
    },
    linkUrl: {
        type: String,
        trim: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    priority: {
        type: Number,
        default: 0, // Higher priority shown first
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});

// Index for active offers
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
