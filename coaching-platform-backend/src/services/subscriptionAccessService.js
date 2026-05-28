import User from '../models/User.js';
import {
    buildUnlockedLevelsFromSubscriptions,
    getHighestTierFromActiveSubscriptions,
    mergeUnlockedLevels,
    resolveMembershipLevel,
    tierIndex,
} from '../utils/tierAccessUtils.js';

const ZERO_STREAK = { current: 0, max: 0, lastActive: null };

/**
 * Admin-only hard reset after manual downgrade/removal.
 * Keeps no challenge carry-over: user returns to FREE + 0-day.
 */
export const forceFreeResetForAdminDowngrade = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    user.unlockedLevels = ['FREE'];
    user.membershipLevel = 'FREE';
    user.streaks = {
        free: { ...ZERO_STREAK },
        bronze: { ...ZERO_STREAK },
        silver: { ...ZERO_STREAK },
    };

    await user.save({ validateBeforeSave: false });
    return user;
};

export const updateUnlockedLevelsFromSubscriptions = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return { hasGold: false, hasFullCourse: false };

    const active = (user.subscriptions || []).filter(
        (s) => s.status === 'active' && s.endDate && new Date(s.endDate) > new Date()
    );

    const fromSubscriptions = buildUnlockedLevelsFromSubscriptions(active);
    const unlockedLevels = mergeUnlockedLevels({
        fromSubscriptions,
        existingUnlocked: user.unlockedLevels || [],
        streaks: user.streaks || {},
    });

    const membershipLevel = resolveMembershipLevel(unlockedLevels);
    const highest = getHighestTierFromActiveSubscriptions(user.subscriptions || []);

    user.unlockedLevels = unlockedLevels;
    user.membershipLevel = membershipLevel;
    await user.save({ validateBeforeSave: false });

    return {
        hasGold: tierIndex(highest) >= tierIndex('GOLD'),
        hasFullCourse: highest === 'FULL_COURSE',
        unlockedLevels: user.unlockedLevels,
        membershipLevel: user.membershipLevel,
    };
};

export const processAllUserSubscriptionExpirations = async () => {
    const users = await User.find({ 'subscriptions.0': { $exists: true } }).select('_id');
    let totalExpired = 0;
    for (const u of users) {
        const { expired } = await checkAndHandleSubscriptionExpiration(u._id);
        totalExpired += expired;
    }
    return { usersChecked: users.length, totalExpired };
};

export const checkAndHandleSubscriptionExpiration = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return { expired: 0 };

    const now = new Date();
    let expired = 0;

    for (const sub of user.subscriptions || []) {
        if (sub.status === 'active' && sub.endDate && new Date(sub.endDate) <= now) {
            sub.status = 'expired';
            expired += 1;
        }
    }

    if (expired > 0) {
        await user.save({ validateBeforeSave: false });
    }

    await updateUnlockedLevelsFromSubscriptions(userId);
    return { expired };
};
