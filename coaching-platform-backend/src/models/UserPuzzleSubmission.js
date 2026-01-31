// src/models/UserPuzzleSubmission.js
import mongoose from 'mongoose';

const userPuzzleSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    puzzleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyContent',
        required: true,
        index: true,
    },
    puzzleType: {
        type: String,
        enum: ['SPOT_CORRECT_SENTENCE', 'GRAMMAR_FILL_BLANK'],
        required: true,
    },
    answers: {
        type: [{
            questionIndex: { type: Number, required: true },
            selectedAnswer: { type: Number, required: true }, // Index of selected option
            isCorrect: { type: Boolean, default: null }
        }],
        required: true,
        validate: {
            validator: function(v) {
                return v.length === 5; // Must have 5 answers
            },
            message: 'Must submit exactly 5 answers.'
        }
    },
    correctCount: {
        type: Number,
        default: 0,
    },
    pointsEarned: {
        type: Number,
        default: 0, // 10 points per correct answer
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

// Compound index to prevent duplicate submissions for the same puzzle
userPuzzleSubmissionSchema.index({ userId: 1, puzzleId: 1 }, { unique: true });

const UserPuzzleSubmission = mongoose.model('UserPuzzleSubmission', userPuzzleSubmissionSchema);

export default UserPuzzleSubmission;
