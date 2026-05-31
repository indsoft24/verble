// src/models/UserSceneSubmission.js
import mongoose from 'mongoose';

const userSceneSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    sceneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyContent',
        required: true,
        index: true,
    },
    description: {
        type: String, // User's description of the scene in their own words
        required: true,
        trim: true,
    },
    sentences: {
        type: [String], // Parsed sentences from description (for scoring)
        default: [],
    },
    pointsEarned: {
        type: Number,
        default: 0,
    },
    evaluationPoints: {
        type: Number,
        default: 0,
    },
    sentencesCorrect: {
        type: Number,
        default: 0,
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
}, {
    timestamps: true
});

// Compound index to prevent duplicate submissions for the same scene
userSceneSubmissionSchema.index({ userId: 1, sceneId: 1 }, { unique: true });

const UserSceneSubmission = mongoose.model('UserSceneSubmission', userSceneSubmissionSchema);

export default UserSceneSubmission;
