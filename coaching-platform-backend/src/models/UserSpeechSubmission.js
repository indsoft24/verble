// src/models/UserSpeechSubmission.js
import mongoose from 'mongoose';

const sentenceValidationSchema = new mongoose.Schema(
    {
        sentenceIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
    },
    { _id: false }
);

const userSpeechSubmissionSchema = new mongoose.Schema(
    {
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
        /** Learner summaries (2–5 per speech). */
        summaries: {
            type: [String],
            default: [],
        },
        /** Legacy single description. */
        description: {
            type: String,
            trim: true,
        },
        /** Mirror of summaries for display compat. */
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

userSpeechSubmissionSchema.index({ userId: 1, speechId: 1 }, { unique: true });

const UserSpeechSubmission = mongoose.model('UserSpeechSubmission', userSpeechSubmissionSchema);

export default UserSpeechSubmission;
