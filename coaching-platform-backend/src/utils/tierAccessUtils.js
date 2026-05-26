/**
 * Membership tier hierarchy and unlocked-level expansion.
 * FREE < BRONZE < SILVER < GOLD < FULL_COURSE
 */

export const LEVEL_ORDER = ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'];

const CHALLENGE_TIERS = ['BRONZE', 'SILVER'];

export const planNameToLevel = (planName = '') => {
    const n = String(planName).toLowerCase();
    if (n.includes('full course') || n.includes('fullcourse')) return 'FULL_COURSE';
    if (n.includes('gold')) return 'GOLD';
    if (n.includes('silver')) return 'SILVER';
    if (n.includes('bronze')) return 'BRONZE';
    return 'FREE';
};

export const tierIndex = (tier) => {
    const idx = LEVEL_ORDER.indexOf(tier);
    return idx === -1 ? 0 : idx;
};

/** All membership tiers at or below the given tier (plus BONUS for GOLD+). */
export const expandLevelsForTier = (highestTier) => {
    const levels = new Set(['FREE']);
    const hi = tierIndex(highestTier);

    for (const tier of LEVEL_ORDER) {
        if (tierIndex(tier) <= hi) {
            levels.add(tier);
        }
    }

    if (hi >= tierIndex('GOLD')) {
        levels.add('BONUS');
    }

    return levels;
};

export const getActiveSubscriptions = (subscriptions = []) => {
    const now = Date.now();
    return subscriptions.filter((sub) => {
        if (sub.status !== 'active') return false;
        const start = new Date(sub.startDate).getTime();
        const end = new Date(sub.endDate).getTime();
        return start <= now && end >= now;
    });
};

/** Highest tier from active subscription plan names. */
export const getHighestTierFromActiveSubscriptions = (subscriptions = []) => {
    const active = getActiveSubscriptions(subscriptions);
    let highest = 'FREE';

    for (const sub of active) {
        const level = planNameToLevel(sub.planName);
        if (tierIndex(level) > tierIndex(highest)) {
            highest = level;
        }
    }

    return highest;
};

/** Build unlockedLevels set from all active subscriptions (cascade per plan). */
export const buildUnlockedLevelsFromSubscriptions = (subscriptions = []) => {
    const levels = new Set(['FREE']);
    const active = getActiveSubscriptions(subscriptions);

    for (const sub of active) {
        const level = planNameToLevel(sub.planName);
        expandLevelsForTier(level).forEach((l) => levels.add(l));
    }

    return levels;
};

/**
 * Merge subscription-derived levels with challenge-earned BRONZE/SILVER
 * so sync does not wipe gamification progress when only Free Foundation is active.
 */
export const mergeUnlockedLevels = ({ fromSubscriptions, existingUnlocked = [], streaks = {} }) => {
    const merged = new Set(fromSubscriptions);

    for (const tier of existingUnlocked) {
        if (CHALLENGE_TIERS.includes(tier)) {
            merged.add(tier);
        }
    }

    const bronzeTarget = 60;
    const silverTarget = 90;
    const bronzeStreak = streaks?.bronze?.current ?? 0;
    const silverStreak = streaks?.silver?.current ?? 0;

    if (bronzeStreak >= bronzeTarget || merged.has('BRONZE')) {
        merged.add('BRONZE');
    }
    if (silverStreak >= silverTarget || merged.has('SILVER')) {
        merged.add('SILVER');
        merged.add('BRONZE');
    }

    if (!merged.has('FREE')) {
        merged.add('FREE');
    }

    return [...merged];
};

export const resolveMembershipLevel = (unlockedLevels = []) => {
    let membershipLevel = 'FREE';
    for (const tier of LEVEL_ORDER) {
        if (unlockedLevels.includes(tier) && tierIndex(tier) > tierIndex(membershipLevel)) {
            membershipLevel = tier;
        }
    }
    return membershipLevel;
};
