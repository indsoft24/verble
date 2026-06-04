// src/models/UserLyricsSubmission.js
import mongoose from 'mongoose';

const sentenceValidationSchema = new mongoose.Schema(
    {
        sentenceIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
    },
    { _id: false }
);

const userLyricsSubmissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        lyricsId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DailyContent',
            required: true,
            index: true,
        },
        summaries: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            trim: true,
        },
        sentences: {
            type: [String],
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
            default: null,
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
        sentenceValidations: {
            type: [sentenceValidationSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

userLyricsSubmissionSchema.index({ userId: 1, lyricsId: 1 }, { unique: true });

const UserLyricsSubmission = mongoose.model('UserLyricsSubmission', userLyricsSubmissionSchema);

export default UserLyricsSubmission;
