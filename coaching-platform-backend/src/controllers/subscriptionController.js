import asyncHandler from 'express-async-handler';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';

export const getActiveSubscriptionPlans = asyncHandler(async (req, res) => {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1, price: 1 });
    res.status(200).json({ status: 'success', results: plans.length, data: { plans } });
});

export const getSubscriptionPlanDetails = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.planId);
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

export const getMySubscription = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('subscriptions.planId');
    res.status(200).json({
        status: 'success',
        data: { subscriptions: user?.subscriptions || [] },
    });
});

export const subscribeToPlan = asyncHandler(async (req, res) => {
    res.status(400).json({
        status: 'fail',
        message: 'Use the payment flow to subscribe to paid plans.',
    });
});
