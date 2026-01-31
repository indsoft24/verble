import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import ExamCategory from '../models/ExamCategory.js';
import Course from '../models/Course.js';

/**
 * @desc    Fetch all published exam categories
 * @route   GET /api/exam-categories
 * @access  Public
 */
export const getAllExamCategories = asyncHandler(async (req, res) => {
    const categories = await ExamCategory.find({ isPublished: true }).sort({ name: 'asc' });
    
    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: {
            categories: categories
        }
    });
});

/**
 * @desc    Fetch a single category and all its published courses by the category's slug
 * @route   GET /api/exam-categories/:slug/courses
 * @access  Public
 */
export const getCoursesForCategory = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const category = await ExamCategory.findOne({ slug: slug, isPublished: true });

    if (!category) {
        res.status(404);
        throw new Error('Exam category not found.');
    }
    const courses = await Course.find({ 
        examCategory: category._id, 
        isPublished: true 
    }).sort({ title: 'asc' });

    res.status(200).json({
        status: 'success',
        data: {
            category: { 
                _id: category._id,
                name: category.name,
                description: category.description,
            },
            courses: courses
        }
    });
});


/**
 * @desc    Create a new exam category
 * @route   POST /api/admin/exam-categories
 * @access  Private (Admin)
 */
export const createExamCategory = asyncHandler(async (req, res) => {
    const { name, description, imageUrl, isPublished } = req.body;

    const categoryExists = await ExamCategory.findOne({ name });
    if (categoryExists) {
        res.status(400);
        throw new Error('An exam category with this name already exists.');
    }

    const category = new ExamCategory({
        name,
        description,
        imageUrl,
        isPublished,
    });

    const createdCategory = await category.save();
    res.status(201).json({
        status: 'success',
        data: { category: createdCategory }
    });
});

/**
 * @desc    Update an existing exam category by ID
 * @route   PATCH /api/admin/exam-categories/:id
 * @access  Private (Admin)
 */
export const updateExamCategory = asyncHandler(async (req, res) => {
    const { name, description, imageUrl, isPublished } = req.body;
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid exam category ID format.');
    }

    const category = await ExamCategory.findById(id);

    if (!category) {
        res.status(404);
        throw new Error('Exam category not found.');
    }

    // Only update fields that are provided
    if (name !== undefined) {
        category.name = name;
    }
    if (description !== undefined) {
        category.description = description;
    }
    if (imageUrl !== undefined) {
        category.imageUrl = imageUrl;
    }
    if (isPublished !== undefined) {
        category.isPublished = isPublished;
    }

    const updatedCategory = await category.save();
    res.status(200).json({
        status: 'success',
        data: { category: updatedCategory }
    });
});

/**
 * @desc    Delete an exam category by ID
 * @route   DELETE /api/admin/exam-categories/:id
 * @access  Private (Admin)
 */
export const deleteExamCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid exam category ID format.');
    }

    const category = await ExamCategory.findById(id);

    if (!category) {
        res.status(404);
        throw new Error('Exam category not found.');
    }
    
    const coursesInCategory = await Course.countDocuments({ examCategory: id });
    if (coursesInCategory > 0) {
        res.status(400);
        throw new Error(`Cannot delete category. ${coursesInCategory} courses are still assigned to it.`);
    }

    await category.deleteOne();

    res.status(200).json({ 
        status: 'success',
        message: 'Exam category deleted successfully.',
        data: null
    });
});
