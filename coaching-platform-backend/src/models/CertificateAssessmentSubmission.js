// src/models/CertificateAssessmentSubmission.js
import mongoose from 'mongoose';

const assessmentAnswerSchema = new mongoose.Schema({
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

const certificateAssessmentSubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
        unique: true, // One assessment attempt per user (can retake if failed)
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CertificateAssessment',
        required: true,
        index: true,
    },
    answers: {
        type: [assessmentAnswerSchema],
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
    certificateGenerated: {
        type: Boolean,
        default: false,
    },
    certificateGeneratedAt: {
        type: Date,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

// Index for querying user's assessment
certificateAssessmentSubmissionSchema.index({ user: 1, submittedAt: -1 });

const CertificateAssessmentSubmission = mongoose.model('CertificateAssessmentSubmission', certificateAssessmentSubmissionSchema);

export default CertificateAssessmentSubmission;
