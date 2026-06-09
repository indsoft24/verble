import asyncHandler from 'express-async-handler';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';

export const getActiveSubscriptionPlans = asyncHandler(async (req, res) => {
    const includeAll = req.query.includeAll === 'true';
    const filter = { isActive: true };
    // Public catalog defaults to paid plans; marketing pages can request all active tiers.
    if (!includeAll) {
        filter.price = { $gt: 0 };
    }
    const plans = await SubscriptionPlan.find(filter).sort({
        displayOrder: 1,
        price: 1,
    });
    res.status(200).json({ status: 'success', results: plans.length, data: { plans } });
});

export const getSubscriptionPlanDetails = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.planId).populate('course', 'title description');
    if (!plan) {
        return res.status(404).json({ status: 'fail', message: 'Plan not found.' });
    }
    res.status(200).json({ status: 'success', data: { plan } });
});

export const getSubscriptionPlansForCourse = asyncHandler(async (req, res) => {
    const plans = await SubscriptionPlan.find({ course: req.params.courseId, isActive: true });
    res.status(200).json({ status: 'success', data: { plans } });
});

export const getFilterOptions = asyncHandler(async (req, res) => {
    const topics = await SubscriptionPlan.distinct('topic', { isActive: true });
    res.status(200).json({ status: 'success', data: { topics: topics.filter(Boolean) } });
});

const OWNED_SUBSCRIPTION_STATUSES = ['active', 'trial', 'future_active', 'pending_cancellation'];

export const getMySubscription = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('subscriptions.planId');
    const subscriptions = user?.subscriptions || [];
    const now = new Date();
    const activeSubscriptions = subscriptions.filter((sub) => {
        if (!OWNED_SUBSCRIPTION_STATUSES.includes(sub.status)) return false;
        if (sub.endDate && new Date(sub.endDate) < now) return false;
        return true;
    });

    res.status(200).json({
        status: 'success',
        data: { subscriptions, activeSubscriptions },
    });
});

export const subscribeToPlan = asyncHandler(async (req, res) => {
    res.status(400).json({
        status: 'fail',
        message: 'Use the payment flow to subscribe to paid plans.',
    });
});
