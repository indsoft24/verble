// src/models/CertificateAssessment.js
import mongoose from 'mongoose';

const assessmentQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true,
    },
    options: {
        type: [String],
        required: [true, 'Options are required'],
        validate: {
            validator: function(v) {
                return v.length >= 2 && v.length <= 6;
            },
            message: 'Must have between 2 and 6 options'
        }
    },
    correctAnswer: {
        type: Number,
        required: [true, 'Correct answer index is required'],
        min: 0,
    },
    explanation: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true, // e.g., "Grammar", "Vocabulary", "Reading Comprehension"
    },
    difficulty: {
        type: String,
        enum: ['EASY', 'MEDIUM', 'HARD'],
        default: 'MEDIUM',
    },
    points: {
        type: Number,
        default: 1,
        min: 1,
    },
}, { _id: true });

const certificateAssessmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Assessment title is required'],
        trim: true,
        default: 'Full Course Certificate Assessment',
    },
    description: {
        type: String,
        trim: true,
    },
    questions: {
        type: [assessmentQuestionSchema],
        required: [true, 'Questions are required'],
        validate: {
            validator: function(v) {
                return v.length >= 150 && v.length <= 200; // 150-200 questions
            },
            message: 'Must have between 150 and 200 questions'
        }
    },
    passingScore: {
        type: Number,
        default: 70, // 70% passing score
        min: 0,
        max: 100,
    },
    timeLimit: {
        type: Number, // in minutes
        default: 180, // 3 hours default
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true, // Index is created here, no need for separate index() call
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});

const CertificateAssessment = mongoose.model('CertificateAssessment', certificateAssessmentSchema);

export default CertificateAssessment;
