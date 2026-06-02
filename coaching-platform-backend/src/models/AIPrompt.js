// src/models/AIPrompt.js
import mongoose from 'mongoose';

const aiPromptSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true,
        index: true,
    },
    category: {
        type: String,
        trim: true,
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        index: true,
    },
    excerpt: {
        type: String,
        trim: true,
    },
    prompt: {
        type: String,
        required: [true, 'Prompt text is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    content: {
        type: String,
        trim: true,
    },
    tags: {
        type: [String],
        default: [],
        index: true,
    },
    level: {
        type: String,
        enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD'],
        default: 'GOLD',
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    usageCount: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});

// Index for efficient queries
aiPromptSchema.index({ topic: 1, isActive: 1 });
aiPromptSchema.index({ category: 1, isActive: 1 });
aiPromptSchema.index({ level: 1, isActive: 1 });
aiPromptSchema.index({ tags: 1, isActive: 1 });
aiPromptSchema.index({ title: 'text', excerpt: 'text', description: 'text', content: 'text', prompt: 'text' });

const AIPrompt = mongoose.model('AIPrompt', aiPromptSchema);

export default AIPrompt;
