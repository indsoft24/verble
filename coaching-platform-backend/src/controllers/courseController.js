import Course from '../models/Course.js';
import Module from '../models/Module.js'; 
import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import ExamCategory from '../models/ExamCategory.js';
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../utils/cacheHelper.js';
import { enrichModulesWithUnlockStatus } from '../services/moduleUnlockService.js';
import { getActiveUserTierLevel, TIER_LEVEL } from '../utils/subscriptionTierAccess.js';


/**
 * @desc    Get a list of featured published courses for the homepage
 * @route   GET /api/courses/featured
 * @access  Public
 */

export const getFeaturedCourses = async (req, res, next) => {
    try {
        const cacheKey = 'courses:featured';

        // Try to get from cache first
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const courses = await Course.find({ isPublished: true })
            .limit(6)
            .populate('examCategory', 'name slug') 
            .select('title description image createdAt updatedAt _id examCategory') 
            .sort({ createdAt: -1 })
            .lean(); // Use lean for better performance

        const response = {
            status: 'success',
            results: courses.length,
            data: {
                courses,
            },
        };

        // Cache the response
        await setCache(cacheKey, response, CACHE_TTL.MEDIUM);

        res.status(200).json(response);
    } catch (error) {
        console.error("USER GET ALL PUBLISHED COURSES ERROR:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch published courses.'
        });
    }
};


/**
 * @desc    Get courses the current user is subscribed to.
 * @route   GET /api/courses/my-courses
 * @access  Private
 */
export const getMyCourses = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get user with subscriptions
        const user = await User.findById(userId).select('subscriptions');

        if (!user) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'User not found.' 
            });
        }

        const now = new Date();

        // Filter active subscriptions
        const activeSubscriptions = user.subscriptions.filter(sub =>
            sub.status === 'active' &&
            new Date(sub.startDate) <= now &&
            new Date(sub.endDate) >= now
        );

        if (activeSubscriptions.length > 0) {
            const activePlanIds = activeSubscriptions.map(sub => sub.planId);
            
            const plans = await SubscriptionPlan.find({ 
                _id: { $in: activePlanIds },
                isActive: true 
            }).select('course name');
            
            let courseIds = [...new Set(plans.map(plan => plan.course).filter(Boolean))];

            const userTierLevel = getActiveUserTierLevel(user.subscriptions);
            if (courseIds.length === 0 && userTierLevel >= TIER_LEVEL.FULL_COURSE) {
                const allPublished = await Course.find({ isPublished: true }).select('_id').lean();
                courseIds = allPublished.map((c) => c._id);
            }

            if (courseIds.length > 0) {
                const myCourses = await Course.find({ 
                    _id: { $in: courseIds }, 
                    isPublished: true 
                })
                .populate('examCategory', 'name slug')
                .select('title description image examCategory createdAt updatedAt')
                .sort({ title: 'asc' });

                return res.status(200).json({
                    status: 'success',
                    results: myCourses.length,
                    data: { 
                        courses: myCourses, 
                        context: 'subscribed',
                        subscriptionCount: activeSubscriptions.length
                    },
                });
            }
        }

        res.status(200).json({
            status: 'success',
            results: 0,
            data: { 
                courses: [], 
                context: 'no_subscription',
                subscriptionCount: 0
            },
        });

    } catch (error) {
        console.error("GET MY COURSES ERROR:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to fetch user courses.' 
        });
    }
});


/**
 * @desc    Get all published courses for users, with search and pagination
 * @route   GET /api/courses
 * @access  Private (Logged-in users)
 */
export const getAllPublishedCourses = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const searchTerm = req.query.search ? String(req.query.search).trim() : null;
        const topic = req.query.topic ? String(req.query.topic).trim().toUpperCase() : null;
        
        // Generate cache key
        const cacheKey = generateCacheKey('courses:list', { 
            page, 
            limit, 
            search: searchTerm || '',
            topic: topic || ''
        });

        // Try to get from cache first
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const queryConditions = { isPublished: true };

        // Filter by topic if provided (direct slug matching)
        if (topic) {
            const categorySlug = topic.toLowerCase().replace(/\s+/g, '-');
            const examCategory = await ExamCategory.findOne({ slug: categorySlug });
            
            if (examCategory) {
                // Use examCategory filter
                queryConditions.examCategory = examCategory._id;
            }
            // If category not found, topic filter is ignored (show all courses)
        }

        // Add search term filter
        if (searchTerm) {
            const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
            queryConditions.$or = [{ title: regex }, { description: regex }];
        }

        // Parallel queries for better performance
        const [totalCourses, courses] = await Promise.all([
            Course.countDocuments(queryConditions),
            Course.find(queryConditions)
                .populate('examCategory', 'name slug')
                .select('_id title description image createdAt updatedAt examCategory')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean() // Use lean for better performance
        ]);

        const totalPages = Math.ceil(totalCourses / limit);

        const response = {
            status: 'success',
            results: courses.length,
            totalResults: totalCourses,
            currentPage: page,
            totalPages: totalPages,
            data: {
                courses,
            },
        };

        // Cache the response
        await setCache(cacheKey, response, CACHE_TTL.MEDIUM);

        res.status(200).json(response);
    } catch (error) {
        console.error("USER GET ALL PUBLISHED COURSES ERROR:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch published courses.'
        });
    }
};

/**
 * @desc    Get a single published course by ID, including its published modules (for users)
 * @route   GET /api/courses/:courseId
 * @access  Private (Logged-in users)
 */
export const getPublishedCourseById = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid course ID format.' });
        }

        const userId = req.user?._id;
        const cacheKey = userId
            ? `course:detail:${courseId}:user:${userId.toString()}`
            : `course:detail:${courseId}`;

        if (!userId) {
            const cached = await getCache(cacheKey);
            if (cached) {
                return res.status(200).json(cached);
            }
        }

        const [course, modules] = await Promise.all([
            Course.findOne({ _id: courseId, isPublished: true })
                .populate('examCategory', 'name slug')
                .select('title description image createdAt updatedAt _id examCategory')
                .lean(),
            Module.find({ course: courseId }) 
                .select('title description timeline chapters image subscriptionPlans order createdAt _id')
                .populate('subscriptionPlans', 'name price currency')
                .sort({ order: 1, createdAt: 1 })
                .lean()
        ]);

        if (!course) {
            return res.status(404).json({ status: 'fail', message: 'Published course not found.' });
        }

        let modulesOut = modules;
        if (userId) {
            modulesOut = await enrichModulesWithUnlockStatus(userId, courseId, modules);
        }

        const response = {
            status: 'success',
            data: {
                course,
                modules: modulesOut,
            },
        };

        if (!userId) {
            await setCache(cacheKey, response, CACHE_TTL.MEDIUM);
        }

        res.status(200).json(response);
    } catch (error) {
        console.error("USER GET PUBLISHED COURSE BY ID ERROR:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid course ID format.' });
        }
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch course details.'
        });
    }
};

