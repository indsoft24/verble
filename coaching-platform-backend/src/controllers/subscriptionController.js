import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Module from '../models/Module.js';
import mongoose from 'mongoose';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../utils/cacheHelper.js';
import { updateUnlockedLevelsFromSubscriptions } from '../services/subscriptionAccessService.js';

// Helper function to calculate end date based on plan duration
const calculateEndDate = (startDate, duration) => {
    const date = new Date(startDate);
    if (!duration || !duration.unit || typeof duration.value !== 'number') {
        console.warn("Plan duration missing or invalid in calculateEndDate, defaulting to 100 years.");
        date.setFullYear(date.getFullYear() + 100); 
        return date;
    }
    switch (duration.unit) {
        case 'day':
            date.setDate(date.getDate() + duration.value);
            break;
        case 'week':
            date.setDate(date.getDate() + duration.value * 7);
            break;
        case 'month':
            date.setMonth(date.getMonth() + duration.value);
            break;
        case 'year':
            date.setFullYear(date.getFullYear() + duration.value);
            break;
        default:
            throw new Error('Invalid duration unit provided to calculateEndDate.');
    }
    return date;
};

/**
 * @desc    Get all active subscription plans (for users to view)
 * @route   GET /api/subscription-plans 
 * @access  Public or Private (depending on router middleware)
 */
export const getActiveSubscriptionPlans = async (req, res, next) => {
    try {
        const { courseId, topic, subTopic } = req.query;
        
        const filter = { isActive: true };
        
        // Filter by course ID
        if (courseId) {
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({ status: 'fail', message: 'Invalid Course ID format.' });
            }
            filter.course = courseId;
        }
        
        // Filter by topic (e.g., 'UPSC', 'Law', 'Government')
        if (topic) {
            filter.topic = topic;
        }
        
        // Filter by subTopic (e.g., 'Full UPSC course', 'Only G.S', 'Only CSAT', 'Optional')
        if (subTopic) {
            filter.subTopic = subTopic;
        }

        // Generate cache key
        const cacheKey = generateCacheKey('plans:list', { 
            courseId: courseId || '', 
            topic: topic || '', 
            subTopic: subTopic || '' 
        });

        // Try to get from cache first
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        // Optimized query with lean
        const plans = await SubscriptionPlan.find(filter)
            .populate('course', 'title') 
            .select('name description image price currency duration features course topic subTopic')
            .sort({ price: 1 })
            .lean();

        const response = {
            status: 'success',
            results: plans.length,
            data: {
                plans,
            },
        };

        // Cache the response (longer TTL as plans don't change frequently)
        await setCache(cacheKey, response, CACHE_TTL.LONG);

        res.status(200).json(response);
    } catch (error) {
        console.error("GET ACTIVE SUBSCRIPTION PLANS ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscription plans.' });
    }
};


/**
 * @desc    Get all active UPSC subscription plans using topic field
 * @route   GET /api/subscription-plans/upsc
 * @access  Public
 */
export const getActiveUPSCPlans = async (req, res, next) => {
    try {
        const { subTopic } = req.query;
        
        const filter = {
            isActive: true,
            topic: 'UPSC'
        };
        
        // Filter by subTopic if provided
        if (subTopic) {
            filter.subTopic = subTopic;
        }

        // Generate cache key
        const cacheKey = generateCacheKey('plans:upsc', { subTopic: subTopic || '' });

        // Try to get from cache first
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }
        
        const plans = await SubscriptionPlan.find(filter)
            .populate('course', 'title')
            .select('name description image price currency duration features course topic subTopic')
            .sort({ price: 1 })
            .lean();

        const response = {
            status: 'success',
            results: plans.length,
            data: {
                plans,
            },
        };

        // Cache the response
        await setCache(cacheKey, response, CACHE_TTL.LONG);

        res.status(200).json(response);
    } catch (error) {
        console.error("GET ACTIVE UPSC SUBSCRIPTION PLANS ERROR:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch UPSC subscription plans.'
        });
    }
};

/**
 * @desc    Get all active Law subscription plans using topic field
 * @route   GET /api/subscription-plans/law
 * @access  Public
 */
export const getActiveLawPlans = async (req, res, next) => {
    try {
        const { subTopic } = req.query;
        
        const filter = {
            isActive: true,
            topic: { $regex: /law/i } 
        };
        
        // Filter by subTopic if provided
        if (subTopic) {
            filter.subTopic = subTopic;
        }

        // Generate cache key
        const cacheKey = generateCacheKey('plans:law', { subTopic: subTopic || '' });

        // Try to get from cache first
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }
        
        const plans = await SubscriptionPlan.find(filter)
            .populate('course', 'title')
            .select('name description image price currency duration features course topic subTopic')
            .sort({ price: 1 })
            .lean();

        const response = {
            status: 'success',
            results: plans.length,
            data: {
                plans,
            },
        };

        // Cache the response
        await setCache(cacheKey, response, CACHE_TTL.LONG);

        res.status(200).json(response);
    } catch (error) {
        console.error("GET ACTIVE LAW SUBSCRIPTION PLANS ERROR:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch Law subscription plans.'
        });
    }
};

/**
 * @desc    Get available topics and subTopics for filtering
 * @route   GET /api/subscription-plans/filter-options
 * @access  Public
 */
export const getFilterOptions = async (req, res, next) => {
    try {
        // Get all unique topics
        const topics = await SubscriptionPlan.distinct('topic', { isActive: true });
        
        // Get all unique subTopics grouped by topic
        const subTopicsByTopic = {};
        for (const topic of topics) {
            if (topic) {
                const subTopics = await SubscriptionPlan.distinct('subTopic', { 
                    isActive: true, 
                    topic: topic 
                });
                subTopicsByTopic[topic] = subTopics.filter(st => st); // Remove null/undefined values
            }
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                topics: topics.filter(t => t), // Remove null/undefined values
                subTopicsByTopic
            },
        });
    } catch (error) {
        console.error("GET FILTER OPTIONS ERROR:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to fetch filter options.' 
        });
    }
};

/**
 * @desc    Subscribe user to a plan (simulates purchase)
 * @route   POST /api/subscriptions/subscribe/:planId
 * @access  Private (User must be logged in)
 */
export const subscribeToPlan = async (req, res, next) => {
    try {
        const { planId } = req.params;
        const userId = req.user._id; 

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription plan ID format.' });
        }

        const plan = await SubscriptionPlan.findOne({ _id: planId, isActive: true });
        if (!plan) {
            return res.status(404).json({ status: 'fail', message: 'Active subscription plan not found or not available.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        const startDate = new Date();
        const endDate = calculateEndDate(startDate, plan.duration);

       const newSubscriptionInstance = {
            planId: plan._id,
            planName: plan.name,
            status: 'active',
            startDate,
            endDate,
        };

        user.subscriptions.push(newSubscriptionInstance);
        await user.save();

        // Update unlocked levels based on subscription type
        try {
            const updatedLevels = await updateUnlockedLevelsFromSubscriptions(userId);
            console.log(`[SubscriptionController] Updated unlocked levels for user ${userId}:`, updatedLevels);
        } catch (error) {
            console.error('[SubscriptionController] Error updating unlocked levels:', error);
            // Don't fail the subscription if level update fails
        }

        // Refresh user to get updated unlocked levels
        const updatedUser = await User.findById(userId);
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        delete userResponse.activeSessions;

        res.status(200).json({
            status: 'success',
            message: `Successfully subscribed to ${plan.name}.`,
            data: {
                user: userResponse,
            },
        });

    } catch (error) {
        console.error("SUBSCRIBE TO PLAN ERROR:", error);
        if (error.message && error.message.startsWith('Invalid duration unit')) {
            // This is a validation error, safe to show generic message
            return res.status(400).json({ status: 'fail', message: 'Invalid subscription duration provided.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to subscribe to plan.' });
    }
};

/**
 * @desc    Get current user's subscription details
 * @route   GET /api/subscriptions/my-subscription
 * @access  Private (User must be logged in)
 */
export const getMySubscription = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
            .select('name email subscriptions')
            .populate({
                path: 'subscriptions.planId', 
                model: 'SubscriptionPlan',
                select: 'name description features price currency duration isActive course',
                populate: {
                    path: 'course',
                    model: 'Course',
                    select: 'title'
                }
            });

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        const now = new Date();
        const activeSubscriptions = user.subscriptions.filter(sub => 
            sub.status === 'active' && 
            new Date(sub.startDate) <= now && 
            new Date(sub.endDate) >= now
        );

        res.status(200).json({
            status: 'success',
            data: {
                activeSubscriptions: activeSubscriptions, 
                allSubscriptions: user.subscriptions 
            },
        });
    } catch (error) {
        console.error("GET MY SUBSCRIPTION ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscription details.' });
    }
};


/**
 * @desc    Get all active subscription plans for a specific course
 * @route   GET /api/courses/:courseId/subscription-plans
 * @access  Public
 */
export const getSubscriptionPlansForCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Invalid Course ID format.' 
            });
        }

        const plans = await SubscriptionPlan.find({
            course: courseId,
            isActive: true
        })
        .select('name description image price currency duration features course')
        .populate('course', 'title description image')
        .sort({ price: 1 });

        res.status(200).json({
            status: 'success',
            results: plans.length,
            data: {
                plans,
            },
        });
    } catch (error) {
        console.error("GET PLANS FOR COURSE ERROR:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to fetch subscription plans for the course.' 
        });
    }
};

/**
 * @desc    Get detailed information about a specific subscription plan
 * @route   GET /api/subscription-plans/:planId/details
 * @access  Public
 */
export const getSubscriptionPlanDetails = async (req, res, next) => {
    try {
        const { planId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Invalid Plan ID format.' 
            });
        }

        const plan = await SubscriptionPlan.findOne({
            _id: planId,
            isActive: true
        })
        .populate('course', 'title description examCategory')
        .populate({
            path: 'course',
            populate: {
                path: 'examCategory',
                select: 'name'
            }
        });

        if (!plan) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'Subscription plan not found or inactive.' 
            });
        }

        // Get modules linked to this subscription plan
        const modules = await Module.find({
            subscriptionPlans: planId
        })
        .select('title description image order course subscriptionPlans')
        .populate('course', 'title')
        .populate('subscriptionPlans', 'name price')
        .sort({ order: 1 });

        res.status(200).json({
            status: 'success',
            data: {
                plan,
                modules: {
                    count: modules.length,
                    items: modules
                }
            }
        });
    } catch (error) {
        console.error("GET PLAN DETAILS ERROR:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to fetch subscription plan details.' 
        });
    }
};
