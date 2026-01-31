// src/models/ModuleQuiz.js
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
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
                return v.length >= 2 && v.length <= 6; // 2-6 options
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
    points: {
        type: Number,
        default: 1,
        min: 1,
    },
}, { _id: true });

const moduleQuizSchema = new mongoose.Schema({
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: [true, 'Module is required'],
        index: true,
        unique: true, // One quiz per module
    },
    title: {
        type: String,
        required: [true, 'Quiz title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    questions: {
        type: [questionSchema],
        required: [true, 'Questions are required'],
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'Must have at least one question'
        }
    },
    passingScore: {
        type: Number,
        default: 70, // 70% passing score
        min: 0,
        max: 100,
    },
    timeLimit: {
        type: Number, // in minutes, 0 means no time limit
        default: 0,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});

// Indexes
moduleQuizSchema.index({ module: 1, isActive: 1 });

const ModuleQuiz = mongoose.model('ModuleQuiz', moduleQuizSchema);

export default ModuleQuiz;
