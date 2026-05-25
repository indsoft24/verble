import User from '../models/User.js';

const LEVEL_ORDER = ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'];

const planNameToLevel = (planName = '') => {
    const n = planName.toLowerCase();
    if (n.includes('full course')) return 'FULL_COURSE';
    if (n.includes('gold')) return 'GOLD';
    if (n.includes('silver')) return 'SILVER';
    if (n.includes('bronze')) return 'BRONZE';
    return 'FREE';
};

export const updateUnlockedLevelsFromSubscriptions = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return { hasGold: false, hasFullCourse: false };

    const now = new Date();
    const active = (user.subscriptions || []).filter(
        (s) => s.status === 'active' && s.endDate && new Date(s.endDate) > now
    );

    const levels = new Set(['FREE']);
    let membershipLevel = 'FREE';
    let hasGold = false;
    let hasFullCourse = false;

    for (const sub of active) {
        const level = planNameToLevel(sub.planName);
        levels.add(level);
        if (LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(membershipLevel)) {
            membershipLevel = level;
        }
        if (level === 'GOLD') hasGold = true;
        if (level === 'FULL_COURSE') hasFullCourse = true;
        if (level === 'BRONZE') levels.add('BRONZE');
        if (level === 'SILVER') {
            levels.add('BRONZE');
            levels.add('SILVER');
        }
        if (level === 'GOLD') {
            levels.add('BRONZE');
            levels.add('SILVER');
            levels.add('GOLD');
            levels.add('BONUS');
        }
        if (level === 'FULL_COURSE') {
            ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'BONUS', 'FULL_COURSE'].forEach((l) => levels.add(l));
        }
    }

    user.unlockedLevels = [...levels];
    user.membershipLevel = membershipLevel;
    await user.save({ validateBeforeSave: false });

    return { hasGold, hasFullCourse, unlockedLevels: user.unlockedLevels };
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
