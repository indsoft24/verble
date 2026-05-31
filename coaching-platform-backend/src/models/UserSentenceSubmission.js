// src/models/UserSentenceSubmission.js
import mongoose from 'mongoose';

const userSentenceSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    wordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyContent',
        required: true,
        index: true,
    },
    word: {
        type: String,
        required: true,
    },
    sentence: {
        type: String,
        required: true,
        trim: true,
    },
    isCorrect: {
        type: Boolean,
        default: null, // null = not reviewed, true = correct, false = incorrect
    },
    feedback: {
        type: String,
        trim: true,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewedAt: {
        type: Date,
    },
    evaluationPoints: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true
});

// Compound index to prevent duplicate submissions
userSentenceSubmissionSchema.index({ userId: 1, wordId: 1, sentence: 1 }, { unique: true });

const UserSentenceSubmission = mongoose.model('UserSentenceSubmission', userSentenceSubmissionSchema);

export default UserSentenceSubmission;
