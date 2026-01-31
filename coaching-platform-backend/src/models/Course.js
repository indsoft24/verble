// src/models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A course must have a title.'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
    examCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamCategory',
        required: [true, 'A course must belong to an exam category.'],
        index: true,
    },
    isPublished: { 
        type: Boolean,
        default: false,
        index: true,
    }
}, {
    timestamps: true,
});

// Indexes for faster queries
courseSchema.index({ isPublished: 1, createdAt: -1 }); // Compound index for list queries
courseSchema.index({ examCategory: 1, isPublished: 1 }); // For category-based queries
courseSchema.index({ title: 'text', description: 'text' }); // Text search index

const Course = mongoose.model('Course', courseSchema);
export default Course;