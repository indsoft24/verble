// src/models/ModuleQuizSubmission.js
import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    selectedAnswer: {
        type: Number,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        default: null,
    },
    pointsEarned: {
        type: Number,
        default: 0,
    },
}, { _id: false });

const moduleQuizSubmissionSchema = new mongoose.Schema({
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
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ModuleQuiz',
        required: true,
        index: true,
    },
    answers: {
        type: [answerSchema],
        required: true,
    },
    totalQuestions: {
        type: Number,
        required: true,
    },
    correctAnswers: {
        type: Number,
        default: 0,
    },
    totalPoints: {
        type: Number,
        default: 0,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    passed: {
        type: Boolean,
        default: false,
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

// Compound index to allow multiple attempts but track best score
moduleQuizSubmissionSchema.index({ user: 1, module: 1, quiz: 1 });

// Index for querying user's quiz history
moduleQuizSubmissionSchema.index({ user: 1, submittedAt: -1 });

const ModuleQuizSubmission = mongoose.model('ModuleQuizSubmission', moduleQuizSubmissionSchema);

export default ModuleQuizSubmission;
