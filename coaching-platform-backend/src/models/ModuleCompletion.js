// src/models/ModuleCompletion.js
import mongoose from 'mongoose';

const moduleCompletionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
        index: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true,
    },
    videosCompleted: {
        type: Number,
        default: 0,
    },
    totalVideos: {
        type: Number,
        default: 0,
    },
    quizPassed: {
        type: Boolean,
        default: false,
    },
    quizScore: {
        type: Number,
        default: 0,
    },
    quizUnlocked: {
        type: Boolean,
        default: false,
    },
    /** Set when cycle 0 (first learning cycle) is fully completed; quiz stays available across later practice cycles. */
    firstCycleCompleted: {
        type: Boolean,
        default: false,
    },
    quizFailedAttempts: {
        type: Number,
        default: 0,
    },
    quizExhausted: {
        type: Boolean,
        default: false,
    },
    isCompleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    completedAt: {
        type: Date,
    },
}, {
    timestamps: true
});

// Compound index to ensure one completion record per user-module
moduleCompletionSchema.index({ user: 1, module: 1 }, { unique: true });

// Index for querying user's completed modules in a course
moduleCompletionSchema.index({ user: 1, course: 1, isCompleted: 1 });

const ModuleCompletion = mongoose.model('ModuleCompletion', moduleCompletionSchema);

export default ModuleCompletion;
