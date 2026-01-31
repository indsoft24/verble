// src/models/UserSpeechSubmission.js
import mongoose from 'mongoose';

const userSpeechSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    speechId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyContent',
        required: true,
        index: true,
    },
    description: {
        type: String, // User's description of the speech in their own words
        required: true,
        trim: true,
    },
    sentences: {
        type: [String], // Parsed sentences from description (for scoring)
        default: [],
    },
    pointsEarned: {
        type: Number,
        default: 0, // 10 for submission + 2 per correct sentence
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

// Compound index to prevent duplicate submissions for the same speech
userSpeechSubmissionSchema.index({ userId: 1, speechId: 1 }, { unique: true });

const UserSpeechSubmission = mongoose.model('UserSpeechSubmission', userSpeechSubmissionSchema);

export default UserSpeechSubmission;
