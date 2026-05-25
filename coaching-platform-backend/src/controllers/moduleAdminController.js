import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';
import mongoose from 'mongoose';
import { processAndUploadImage, deleteStoredImage } from '../utils/localImageStorage.js';

/**
 * @desc    Create a new module for a specific course (Admin)
 * @route   POST /api/admin/courses/:courseId/modules
 * @access  Private/Admin
 */
export const createModuleAdmin = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { title, description, subscriptionPlans, order } = req.body;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Course ID format.' });
        }
        if (!title) {
            return res.status(400).json({ status: 'fail', message: 'Module title is required.' });
        }

        const courseExists = await Course.findById(courseId);
        if (!courseExists) {
            return res.status(404).json({ status: 'fail', message: 'Course not found. Cannot add module.' });
        }

        // Validate subscriptionPlans if provided
        let validSubscriptionPlans = [];
        if (subscriptionPlans) {
            // Handle JSON string from FormData
            let parsedSubscriptionPlans = subscriptionPlans;
            if (typeof subscriptionPlans === 'string') {
                try {
                    parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
                } catch (error) {
                    return res.status(400).json({ status: 'fail', message: 'Invalid Subscription Plan ID format.' });
                }
            }

            if (Array.isArray(parsedSubscriptionPlans)) {
                validSubscriptionPlans = parsedSubscriptionPlans.filter(planId =>
                    mongoose.Types.ObjectId.isValid(planId)
                );
                if (validSubscriptionPlans.length !== parsedSubscriptionPlans.length) {
                    return res.status(400).json({ status: 'fail', message: 'One or more Subscription Plan IDs are invalid.' });
                }
            } else if (mongoose.Types.ObjectId.isValid(parsedSubscriptionPlans)) {
                // Handle single subscription plan for backward compatibility
                validSubscriptionPlans = [parsedSubscriptionPlans];
            } else {
                return res.status(400).json({ status: 'fail', message: 'Invalid Subscription Plan ID format.' });
            }
        }

        let imageUrl;
        if (req.file) {
            imageUrl = await processAndUploadImage(req.file.buffer, {
                width: 800,
                quality: 80,
                pathPrefix: 'module_images',
                originalName: req.file.originalname,
            });
        }

        const newModule = await Module.create({
            title,
            description,
            image: imageUrl,
            course: courseId,
            subscriptionPlans: validSubscriptionPlans,
            order: order || 0,
        });

        // Invalidate cache
        const { invalidateModuleCache, invalidateCourseCache } = await import('../utils/cacheInvalidation.js');
        await invalidateModuleCache(null, courseId);
        await invalidateCourseCache(courseId);

        res.status(201).json({
            status: 'success',
            message: 'Module created successfully.',
            data: {
                module: newModule,
            },
        });
    } catch (error) {
        console.error("ADMIN CREATE MODULE ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create module.' });
    }
};

/**
 * @desc    Get all modules across all courses (Admin)
 * @route   GET /api/admin/modules
 * @access  Private/Admin
 */
export const getAllModulesAdmin = async (req, res, next) => {
    try {
        const modules = await Module.find({})
            .populate('course', 'title')
            .populate('subscriptionPlans', 'name price currency')
            .sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: modules.length,
            data: {
                modules,
            },
        });
    } catch (error) {
        console.error("ADMIN GET ALL MODULES ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch modules.' });
    }
};

/**
 * @desc    Get all modules for a specific course (Admin)
 * @route   GET /api/admin/courses/:courseId/modules
 * @access  Private/Admin
 */
export const getModulesForCourseAdmin = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Course ID format.' });
        }

        const courseExists = await Course.findById(courseId);
        if (!courseExists) {
            return res.status(404).json({ status: 'fail', message: 'Course not found.' });
        }

        const modules = await Module.find({ course: courseId })
            .populate('subscriptionPlans', 'name price currency')
            .sort({ order: 1, createdAt: 1 });

        res.status(200).json({
            status: 'success',
            results: modules.length,
            data: {
                modules,
            },
        });
    } catch (error) {
        console.error("ADMIN GET MODULES FOR COURSE ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch modules for the course.' });
    }
};

/**
 * @desc    Get a single module by its ID (Admin)
 * @route   GET /api/admin/modules/:moduleId
 * @access  Private/Admin
 */
export const getModuleByIdAdmin = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Module ID format.' });
        }

        const moduleDoc = await Module.findById(moduleId)
            .populate('course', 'title')
            .populate('subscriptionPlans', 'name price currency');
        if (!moduleDoc) {
            return res.status(404).json({ status: 'fail', message: 'Module not found.' });
        }
        res.status(200).json({
            status: 'success',
            data: {
                module: moduleDoc,
            },
        });
    } catch (error) {
        console.error("ADMIN GET MODULE BY ID ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch module.' });
    }
};

/**
 * @desc    Update a module by ID (Admin)
 * @route   PATCH /api/admin/modules/:moduleId
 * @access  Private/Admin
 */
export const updateModuleAdmin = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        const { title, description, subscriptionPlans, order } = req.body;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Module ID format.' });
        }

        const existingModule = await Module.findById(moduleId);
        if (!existingModule) {
            return res.status(404).json({ status: 'fail', message: 'Module not found.' });
        }

        const fieldsToUpdate = {};
        if (title !== undefined) fieldsToUpdate.title = title;
        if (description !== undefined) fieldsToUpdate.description = description;
        if (subscriptionPlans !== undefined) {
            let validSubscriptionPlans = [];
            if (subscriptionPlans) {
                // Handle JSON string from FormData
                let parsedSubscriptionPlans = subscriptionPlans;
                if (typeof subscriptionPlans === 'string') {
                    try {
                        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
                    } catch (error) {
                        return res.status(400).json({ status: 'fail', message: 'Invalid Subscription Plan ID format.' });
                    }
                }

                if (Array.isArray(parsedSubscriptionPlans)) {
                    validSubscriptionPlans = parsedSubscriptionPlans.filter(planId =>
                        mongoose.Types.ObjectId.isValid(planId)
                    );
                    if (validSubscriptionPlans.length !== parsedSubscriptionPlans.length) {
                        return res.status(400).json({ status: 'fail', message: 'One or more Subscription Plan IDs are invalid.' });
                    }
                } else if (mongoose.Types.ObjectId.isValid(parsedSubscriptionPlans)) {
                    // Handle single subscription plan for backward compatibility
                    validSubscriptionPlans = [parsedSubscriptionPlans];
                } else {
                    return res.status(400).json({ status: 'fail', message: 'Invalid Subscription Plan ID format.' });
                }
            }
            fieldsToUpdate.subscriptionPlans = validSubscriptionPlans;
        }
        if (order !== undefined) fieldsToUpdate.order = Number(order);

        // Handle image upload
        if (req.file) {
            // Delete old image if it exists
            if (existingModule.image) {
                await deleteStoredImage(existingModule.image);
            }

            // Upload new image
            fieldsToUpdate.image = await processAndUploadImage(req.file.buffer, {
                width: 800,
                quality: 80,
                pathPrefix: 'module_images',
                originalName: req.file.originalname,
            });
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'No fields provided for update.' });
        }

        const updatedModule = await Module.findByIdAndUpdate(moduleId, fieldsToUpdate, {
            new: true,
            runValidators: true,
        });

        // Invalidate cache
        const { invalidateModuleCache } = await import('../utils/cacheInvalidation.js');
        const courseId = existingModule.course?.toString() || existingModule.course;
        await invalidateModuleCache(moduleId, courseId);

        res.status(200).json({
            status: 'success',
            message: 'Module updated successfully.',
            data: {
                module: updatedModule,
            },
        });
    } catch (error) {
        console.error("ADMIN UPDATE MODULE ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update module.' });
    }
};

/**
 * @desc    Delete a module by ID (Admin)
 * @route   DELETE /api/admin/modules/:moduleId
 * @access  Private/Admin
 */
export const deleteModuleAdmin = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Module ID format.' });
        }

        const moduleToDelete = await Module.findById(moduleId);
        if (!moduleToDelete) {
            return res.status(404).json({ status: 'fail', message: 'Module not found.' });
        }

        // Delete module image from Bunny if it exists
        if (moduleToDelete.image) {
            await deleteStoredImage(moduleToDelete.image);
        }

        await Video.updateMany(
            { modules: moduleId },
            { $pull: { modules: moduleId } }
        );

        await Module.findByIdAndDelete(moduleId);

        // Invalidate cache
        const { invalidateModuleCache, invalidateVideoCache } = await import('../utils/cacheInvalidation.js');
        const courseId = moduleToDelete.course?.toString() || moduleToDelete.course;
        await invalidateModuleCache(moduleId, courseId);
        await invalidateVideoCache();

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        console.error("ADMIN DELETE MODULE ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete module.' });
    }
};

/**
 * @desc    Link existing videos to a specific module (Admin)
 * (Adds the moduleId to each video's 'modules' array)
 * @route   POST /api/admin/modules/:moduleId/link-videos
 * @access  Private/Admin
 */
export const linkVideosToModuleAdmin = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        const { videoIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Module ID format.' });
        }
        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({ status: 'fail', message: 'An array of videoIds is required.' });
        }

        const validVideoIds = videoIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validVideoIds.length !== videoIds.length) {
            return res.status(400).json({ status: 'fail', message: 'One or more provided video IDs are invalid.' });
        }

        const moduleObjectId = new mongoose.Types.ObjectId(moduleId);

        const moduleExists = await Module.findById(moduleObjectId);
        if (!moduleExists) {
            return res.status(404).json({ status: 'fail', message: 'Module not found.' });
        }

        const updatePromises = validVideoIds.map(videoId =>
            Video.findByIdAndUpdate(
                videoId,
                { $addToSet: { modules: moduleObjectId } },
                { new: true }
            )
        );

        const results = await Promise.all(updatePromises);

        const notFoundCount = results.filter(r => r === null).length;
        if (notFoundCount > 0) {
            console.warn(`[linkVideosToModuleAdmin] ${notFoundCount} video(s) specified were not found.`);
        }

        res.status(200).json({
            status: 'success',
            message: `${results.length - notFoundCount} video(s) successfully linked to module. ${notFoundCount > 0 ? `${notFoundCount} video(s) not found.` : ''}`,
        });

    } catch (error) {
        console.error("ADMIN LINK VIDEOS TO MODULE ERROR:", error.stack);
        res.status(500).json({ status: 'error', message: 'Failed to link videos to module.' });
    }
};