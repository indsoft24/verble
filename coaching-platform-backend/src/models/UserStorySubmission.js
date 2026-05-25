// src/models/UserStorySubmission.js
import mongoose from 'mongoose';

const userStorySubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyContent',
        required: true,
        index: true,
    },
    summary: {
        type: [String], // Array of sentences (max 5)
        required: true,
        validate: {
            validator: function(v) {
                return v.length >= 2 && v.length <= 5;
            },
            message: 'Summary must contain between 2 and 5 sentences.'
        }
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

// Compound index to prevent duplicate submissions for the same story on the same day
userStorySubmissionSchema.index({ userId: 1, storyId: 1 }, { unique: true });

const UserStorySubmission = mongoose.model('UserStorySubmission', userStorySubmissionSchema);

export default UserStorySubmission;
