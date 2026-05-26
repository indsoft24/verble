import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';
import { updateUnlockedLevelsFromSubscriptions } from './subscriptionAccessService.js';

const FREE_FOUNDATION_NAME = 'Free Foundation';

const calculateEndDate = (startDate, duration) => {
    const end = new Date(startDate);
    const { value, unit } = duration;
    switch (unit) {
        case 'day':
            end.setDate(end.getDate() + value);
            break;
        case 'week':
            end.setDate(end.getDate() + value * 7);
            break;
        case 'month':
            end.setMonth(end.getMonth() + value);
            break;
        case 'year':
            end.setFullYear(end.getFullYear() + value);
            break;
        default:
            end.setFullYear(end.getFullYear() + 1);
    }
    return end;
};

/**
 * Assign Free Foundation subscription if user has none active.
 */
export const assignFreeFoundationToUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    const hasActive = user.subscriptions?.some(
        (s) => s.status === 'active' && s.endDate && new Date(s.endDate) > new Date()
    );
    if (hasActive) return user;

    const plan = await SubscriptionPlan.findOne({ name: FREE_FOUNDATION_NAME, isActive: { $ne: false } });
    if (!plan) {
        console.warn('[defaultSubscription] Free Foundation plan not found');
        return user;
    }

    const startDate = new Date();
    const endDate = calculateEndDate(startDate, plan.duration);

    user.subscriptions.push({
        planId: plan._id,
        planName: plan.name,
        status: 'active',
        startDate,
        endDate,
        paymentDetails: { gateway: 'system' },
    });

    await user.save({ validateBeforeSave: false });
    await updateUnlockedLevelsFromSubscriptions(userId);
    return User.findById(userId);
};
