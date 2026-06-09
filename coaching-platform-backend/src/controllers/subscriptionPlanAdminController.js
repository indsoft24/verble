import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Course from '../models/Course.js';
import mongoose from 'mongoose';
import { processAndUploadImage, deleteStoredImage } from '../utils/localImageStorage.js';

const isStandaloneBonusPlanInput = (inputName = '') => {
    return inputName.trim().toLowerCase() === 'bonus';
};

/**
 * @desc    Create a new subscription plan (Admin)
 * @route   POST /api/admin/subscription-plans
 * @access  Private/Admin
 */
export const createSubscriptionPlan = async (req, res, next) => {
    try {
        // Handle FormData fields - when using multipart/form-data, nested objects come as separate fields
        let { name, description, price, currency, duration, features, stripePriceId, isActive, course, topic, subTopic, marketValue } = req.body;

        // If durationValue and durationUnit are present (from FormData), construct duration object
        // Priority: Use durationValue/durationUnit if present, otherwise use duration object if valid
        if (req.body.durationValue !== undefined || req.body.durationUnit !== undefined) {
            const durationValue = req.body.durationValue !== undefined ? Number(req.body.durationValue) : (duration?.value || 1);
            const durationUnit = req.body.durationUnit || duration?.unit || 'month';
            duration = { value: durationValue, unit: durationUnit };
        } else if (!duration || typeof duration !== 'object' || !duration.value || !duration.unit) {
            // If duration is not a valid object, use defaults
            duration = { value: 1, unit: 'month' };
        }

        // Parse features if it's a JSON string (from FormData)
        if (typeof features === 'string') {
            try {
                features = JSON.parse(features);
            } catch (e) {
                // If parsing fails, treat as comma-separated string or empty array
                features = features ? features.split(',').map(f => f.trim()).filter(f => f) : [];
            }
        }

        // Convert price to number if it's a string (from FormData)
        if (typeof price === 'string') {
            price = Number(price);
        }
        if (marketValue === '' || marketValue === null || marketValue === undefined) {
            marketValue = undefined;
        } else if (typeof marketValue === 'string') {
            marketValue = Number(marketValue);
        }

        // Convert isActive to boolean if it's a string (from FormData)
        if (typeof isActive === 'string') {
            isActive = isActive === 'true' || isActive === '1';
        }

        if (!name || price === undefined || price === null || !duration || !duration.value || !duration.unit || !course) {
            return res.status(400).json({
                status: 'fail',
                message: 'Missing required fields: name, price, duration, and course.'
            });
        }
        if (isStandaloneBonusPlanInput(name)) {
            return res.status(400).json({
                status: 'fail',
                message: 'BONUS cannot be created as a standalone plan. Include BONUS benefits inside GOLD.',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(course)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Course ID format.' });
        }
        const courseExists = await Course.findById(course);
        if (!courseExists) {
            return res.status(404).json({ status: 'fail', message: 'The selected course does not exist.' });
        }

        let imageUrl;
        if (req.file) {
            imageUrl = await processAndUploadImage(req.file.buffer, {
                width: 800,
                quality: 80,
                pathPrefix: 'subscription_images',
                originalName: req.file.originalname,
            });
        }

        const newPlan = await SubscriptionPlan.create({
            name,
            description,
            image: imageUrl,
            price,
            currency: currency || 'INR', // Default to INR if not provided
            duration,
            features: features || [],
            stripePriceId,
            isActive: isActive !== undefined ? isActive : true,
            course,
            topic,
            subTopic,
            ...(marketValue !== undefined ? { marketValue } : {}),
        });

        // Invalidate cache
        const { invalidateSubscriptionPlanCache } = await import('../utils/cacheInvalidation.js');
        await invalidateSubscriptionPlanCache(null, course);

        res.status(201).json({
            status: 'success',
            message: 'Subscription plan created successfully.',
            data: {
                plan: newPlan,
            },
        });
    } catch (error) {
        console.error("ADMIN CREATE SUBSCRIPTION PLAN ERROR:", error);
        if (error.code === 11000) {
            return res.status(409).json({ status: 'fail', message: 'A subscription plan with this name already exists for the selected course.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create subscription plan.' });
    }
};

/**
 * @desc    Get all subscription plans, with optional filtering by course (Admin)
 * @route   GET /api/admin/subscription-plans
 * @access  Private/Admin
 */
export const getAllSubscriptionPlansAdmin = async (req, res, next) => {
    try {
        const { courseId } = req.query;

        const filter = {};
        if (courseId) {
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({ status: 'fail', message: 'Invalid Course ID format in query.' });
            }
            filter.course = courseId;
        }

        const plans = await SubscriptionPlan.find(filter)
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: plans.length,
            data: {
                plans,
            },
        });
    } catch (error) {
        console.error("ADMIN GET ALL SUBSCRIPTION PLANS ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscription plans.' });
    }
};

/**
 * @desc    Get a single subscription plan by ID (Admin)
 * @route   GET /api/admin/subscription-plans/:id
 * @access  Private/Admin
 */
export const getSubscriptionPlanByIdAdmin = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription plan ID format.' });
        }

        const plan = await SubscriptionPlan.findById(req.params.id)
            .populate('course', 'title');

        if (!plan) {
            return res.status(404).json({ status: 'fail', message: 'Subscription plan not found.' });
        }
        res.status(200).json({
            status: 'success',
            data: {
                plan,
            },
        });
    } catch (error) {
        console.error("ADMIN GET SUBSCRIPTION PLAN BY ID ERROR:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription plan ID format.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscription plan.' });
    }
};

/**
 * @desc    Update a subscription plan by ID (Admin)
 * @route   PATCH /api/admin/subscription-plans/:id
 * @access  Private/Admin
 */
export const updateSubscriptionPlanAdmin = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription plan ID format.' });
        }

        const existingPlan = await SubscriptionPlan.findById(req.params.id);
        if (!existingPlan) {
            return res.status(404).json({ status: 'fail', message: 'Subscription plan not found.' });
        }

        let { name, description, price, currency, duration, features, isActive, course, topic, subTopic, marketValue } = req.body;

        // Handle FormData fields - when using multipart/form-data, nested objects come as separate fields
        // If durationValue and durationUnit are present (from FormData), construct duration object
        // Priority: Use durationValue/durationUnit if present, otherwise use duration object if valid
        if (req.body.durationValue !== undefined || req.body.durationUnit !== undefined) {
            const durationValue = req.body.durationValue !== undefined ? Number(req.body.durationValue) : (duration?.value || existingPlan.duration?.value || 1);
            const durationUnit = req.body.durationUnit || duration?.unit || existingPlan.duration?.unit || 'month';
            duration = { value: durationValue, unit: durationUnit };
        } else if (duration && typeof duration === 'object' && duration.value && duration.unit) {
            // Duration object is valid, use it as-is
            duration = duration;
        } else {
            // No duration provided, set to undefined so it won't be updated
            duration = undefined;
        }

        // Parse features if it's a JSON string (from FormData)
        if (typeof features === 'string') {
            try {
                features = JSON.parse(features);
            } catch (e) {
                // If parsing fails, treat as comma-separated string or empty array
                features = features ? features.split(',').map(f => f.trim()).filter(f => f) : [];
            }
        }

        // Convert price to number if it's a string (from FormData)
        if (typeof price === 'string') {
            price = Number(price);
        }
        if (marketValue === '' || marketValue === null) {
            marketValue = undefined;
        } else if (typeof marketValue === 'string') {
            marketValue = Number(marketValue);
        }

        // Convert isActive to boolean if it's a string (from FormData)
        if (typeof isActive === 'string') {
            isActive = isActive === 'true' || isActive === '1';
        }

        const fieldsToUpdate = {};
        if (name !== undefined && isStandaloneBonusPlanInput(name)) {
            return res.status(400).json({
                status: 'fail',
                message: 'BONUS cannot be used as a standalone plan name. Include BONUS benefits inside GOLD.',
            });
        }
        if (name !== undefined) fieldsToUpdate.name = name;
        if (description !== undefined) fieldsToUpdate.description = description;
        if (price !== undefined) fieldsToUpdate.price = price;
        if (marketValue !== undefined) fieldsToUpdate.marketValue = marketValue;
        if (currency !== undefined) fieldsToUpdate.currency = currency;
        if (duration !== undefined) fieldsToUpdate.duration = duration;
        if (features !== undefined) fieldsToUpdate.features = features;
        if (isActive !== undefined) fieldsToUpdate.isActive = isActive;
        if (topic !== undefined) fieldsToUpdate.topic = topic;
        if (subTopic !== undefined) fieldsToUpdate.subTopic = subTopic;

        // Handle image upload
        if (req.file) {
            // Delete old image if it exists
            if (existingPlan.image) {
                await deleteStoredImage(existingPlan.image);
            }

            // Upload new image
            fieldsToUpdate.image = await processAndUploadImage(req.file.buffer, {
                width: 800,
                quality: 80,
                pathPrefix: 'subscription_images',
                originalName: req.file.originalname,
            });
        }

        if (course !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(course)) {
                return res.status(400).json({ status: 'fail', message: 'Invalid Course ID format.' });
            }
            const courseExists = await Course.findById(course);
            if (!courseExists) {
                return res.status(404).json({ status: 'fail', message: 'The selected course does not exist.' });
            }
            fieldsToUpdate.course = course;
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'No fields provided for update.' });
        }

        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        }).populate('course', 'title');

        res.status(200).json({
            status: 'success',
            message: 'Subscription plan updated successfully.',
            data: {
                plan: updatedPlan,
            },
        });
    } catch (error) {
        console.error("ADMIN UPDATE SUBSCRIPTION PLAN ERROR:", error);
        if (error.code === 11000) {
            return res.status(409).json({ status: 'fail', message: 'A subscription plan with this name already exists for the selected course.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription plan ID format.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update subscription plan.' });
    }
};

/**
 * @desc    Delete a subscription plan by ID (Admin)
 * @route   DELETE /api/admin/subscription-plans/:id
 * @access  Private/Admin
 */
export const deleteSubscriptionPlanAdmin = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription plan ID format.' });
        }

        const plan = await SubscriptionPlan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ status: 'fail', message: 'Subscription plan not found.' });
        }

        // Delete plan image from Bunny if it exists
        if (plan.image) {
            await deleteStoredImage(plan.image);
        }

        await SubscriptionPlan.findByIdAndDelete(req.params.id);

        // Invalidate cache
        const { invalidateSubscriptionPlanCache } = await import('../utils/cacheInvalidation.js');
        const courseId = plan.course?.toString() || plan.course;
        await invalidateSubscriptionPlanCache(req.params.id, courseId);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        console.error("ADMIN DELETE SUBSCRIPTION PLAN ERROR:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription plan ID format.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to delete subscription plan.' });
    }
};
