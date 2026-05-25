import Course from '../models/Course.js';
import Video from '../models/Video.js';
import Module from '../models/Module.js';
import ExamCategory from '../models/ExamCategory.js';
import mongoose from 'mongoose';
import { processAndUploadImage, deleteStoredImage } from '../utils/localImageStorage.js';

/**
 * @desc    Create a new course (Admin)
 * @route   POST /api/admin/courses
 * @access  Private/Admin
 */
export const createCourseAdmin = async (req, res, next) => {
    try {
        const { title, description, isPublished, examCategory } = req.body;

        if (!title || !examCategory) {
            return res.status(400).json({ status: 'fail', message: 'Course title and Exam Category are required.' });
        }
        if (!mongoose.Types.ObjectId.isValid(examCategory)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Exam Category ID format.' });
        }
        const categoryExists = await ExamCategory.findById(examCategory);
        if (!categoryExists) {
            return res.status(404).json({ status: 'fail', message: 'The selected Exam Category does not exist.' });
        }

        let imageUrl;
        if (req.file) {
            imageUrl = await processAndUploadImage(req.file.buffer, {
                width: 800,
                quality: 80,
                pathPrefix: 'course_images',
                originalName: req.file.originalname,
            });
        }

        const newCourse = await Course.create({
            title,
            description,
            image: imageUrl,
            isPublished: isPublished !== undefined ? isPublished : false,
            examCategory,
        });

        // Invalidate cache
        const { invalidateCourseCache } = await import('../utils/cacheInvalidation.js');
        await invalidateCourseCache();

        res.status(201).json({
            status: 'success',
            message: 'Course created successfully.',
            data: {
                course: newCourse,
            },
        });
    } catch (error) {
        console.error("ADMIN CREATE COURSE ERROR:", error);
        if (error.code === 11000) {
            return res.status(409).json({ status: 'fail', message: 'A course with this title already exists.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create course.' });
    }
};

/**
 * @desc    Get all courses (Admin)
 * @route   GET /api/admin/courses
 * @access  Private/Admin
 */
export const getAllCoursesAdmin = async (req, res, next) => {
    try {
        const courses = await Course.find({})
            .populate('examCategory', 'name slug')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: {
                courses,
            },
        });
    } catch (error) {
        console.error("ADMIN GET ALL COURSES ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch courses.' });
    }
};

/**
 * @desc    Get a single course by ID (Admin)
 * @route   GET /api/admin/courses/:courseId
 * @access  Private/Admin
 */
export const getCourseByIdAdmin = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid course ID format.' });
        }

        const course = await Course.findById(courseId)
            .populate('examCategory', 'name slug');

        if (!course) {
            return res.status(404).json({ status: 'fail', message: 'Course not found.' });
        }
        res.status(200).json({
            status: 'success',
            data: {
                course,
            },
        });
    } catch (error) {
        console.error("ADMIN GET COURSE BY ID ERROR:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid course ID format.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to fetch course.' });
    }
};

/**
 * @desc    Update a course by ID (Admin)
 * @route   PATCH /api/admin/courses/:courseId
 * @access  Private/Admin
 */
export const updateCourseAdmin = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { title, description, isPublished, examCategory } = req.body;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid course ID format.' });
        }

        const existingCourse = await Course.findById(courseId);
        if (!existingCourse) {
            return res.status(404).json({ status: 'fail', message: 'Course not found.' });
        }

        const fieldsToUpdate = {};
        if (title !== undefined) fieldsToUpdate.title = title;
        if (description !== undefined) fieldsToUpdate.description = description;
        if (isPublished !== undefined) fieldsToUpdate.isPublished = isPublished;

        // Handle image upload
        if (req.file) {
            // Delete old image if it exists
            if (existingCourse.image) {
                await deleteStoredImage(existingCourse.image);
            }

            // Upload new image
            fieldsToUpdate.image = await processAndUploadImage(req.file.buffer, {
                width: 800,
                quality: 80,
                pathPrefix: 'course_images',
                originalName: req.file.originalname,
            });
        }

        if (examCategory !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(examCategory)) {
                return res.status(400).json({ status: 'fail', message: 'Invalid Exam Category ID format.' });
            }
            const categoryExists = await ExamCategory.findById(examCategory);
            if (!categoryExists) {
                return res.status(404).json({ status: 'fail', message: 'The selected Exam Category does not exist.' });
            }
            fieldsToUpdate.examCategory = examCategory;
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'No fields provided for update.' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(courseId, fieldsToUpdate, {
            new: true,
            runValidators: true,
        }).populate('examCategory', 'name slug');

        // Invalidate cache
        const { invalidateCourseCache } = await import('../utils/cacheInvalidation.js');
        await invalidateCourseCache(courseId);

        res.status(200).json({
            status: 'success',
            message: 'Course updated successfully.',
            data: {
                course: updatedCourse,
            },
        });
    } catch (error) {
        console.error("ADMIN UPDATE COURSE ERROR:", error);
        if (error.code === 11000) {
            return res.status(409).json({ status: 'fail', message: 'A course with this title already exists.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update course.' });
    }
};

/**
 * @desc    Delete a course by ID (Admin)
 * @route   DELETE /api/admin/courses/:courseId
 * @access  Private/Admin
 */
export const deleteCourseAdmin = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid course ID format.' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ status: 'fail', message: 'Course not found.' });
        }

        // Delete course image from Bunny if it exists
        if (course.image) {
            await deleteStoredImage(course.image);
        }

        await Video.updateMany(
            { courses: courseId },
            { $pull: { courses: courseId } }
        );

        const modulesOfCourse = await Module.find({ course: courseId }).select('_id');
        const moduleIds = modulesOfCourse.map(m => m._id);
        if (moduleIds.length > 0) {
            await Video.updateMany({ module: { $in: moduleIds } }, { $unset: { module: "" } });
        }

        await Module.deleteMany({ course: courseId });
        await Course.findByIdAndDelete(courseId);

        // Invalidate cache
        const { invalidateCourseCache, invalidateModuleCache } = await import('../utils/cacheInvalidation.js');
        await invalidateCourseCache(courseId);
        await invalidateModuleCache(null, courseId);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        console.error("ADMIN DELETE COURSE ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete course.' });
    }
};
