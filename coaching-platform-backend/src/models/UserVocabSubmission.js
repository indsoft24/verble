// src/models/UserVocabSubmission.js
import mongoose from 'mongoose';

const userVocabSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    vocabSetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyContent',
        required: true,
        index: true,
    },
    sentences: {
        type: [{
            sentence: { type: String, required: true, trim: true },
            vocabWordsUsed: { type: [String], required: true } // Array of vocab words used in this sentence
        }],
        required: true,
        validate: {
            validator: function(v) {
                return v.length >= 2 && v.length <= 5;
            },
            message: 'Must submit between 2 and 5 sentences.'
        }
    },
    totalVocabWordsUsed: {
        type: Number,
        default: 0, // Count of unique vocab words used across all sentences
    },
    pointsEarned: {
        type: Number,
        default: 0, // 10 points per correct sentence
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

// Compound index to prevent duplicate submissions for the same vocab set on the same day
userVocabSubmissionSchema.index({ userId: 1, vocabSetId: 1 }, { unique: true });

const UserVocabSubmission = mongoose.model('UserVocabSubmission', userVocabSubmissionSchema);

export default UserVocabSubmission;
