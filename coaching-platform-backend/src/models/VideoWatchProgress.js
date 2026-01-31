// src/models/VideoWatchProgress.js
import mongoose from 'mongoose';

const videoWatchProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
        index: true,
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
        index: true,
    },
    watchCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    lastWatchedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    // Tracks which completion cycle this watch belongs to (0 or 1, max 2 cycles)
    moduleCompletionCycle: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
    },
}, {
    timestamps: true
});

// Compound index to ensure one progress record per user-video-module-cycle combination
// This allows separate progress tracking for cycle 0 and cycle 1
videoWatchProgressSchema.index({ user: 1, video: 1, module: 1, moduleCompletionCycle: 1 }, { unique: true });

// Index for querying by user and module
videoWatchProgressSchema.index({ user: 1, module: 1 });

// Index for querying by user, module, and cycle
videoWatchProgressSchema.index({ user: 1, module: 1, moduleCompletionCycle: 1 });

const VideoWatchProgress = mongoose.model('VideoWatchProgress', videoWatchProgressSchema);

export default VideoWatchProgress;

