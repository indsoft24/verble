import type { User, UserSubscriptionInstance } from '../services/authService';

export type MembershipTier = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE';
export type TierAccessStatus = 'locked' | 'active' | 'completed' | 'unlocked';

export const TIER_ORDER: MembershipTier[] = ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'];

const planNameToLevel = (planName = ''): MembershipTier => {
    const n = planName.toLowerCase();
    if (n.includes('full course') || n.includes('fullcourse')) return 'FULL_COURSE';
    if (n.includes('gold')) return 'GOLD';
    if (n.includes('silver')) return 'SILVER';
    if (n.includes('bronze')) return 'BRONZE';
    return 'FREE';
};

const tierIndex = (tier: MembershipTier | string): number => {
    const idx = TIER_ORDER.indexOf(tier as MembershipTier);
    return idx === -1 ? 0 : idx;
};

/** All membership tiers at or below the given tier (client-side cascade). */
export const expandLevelsForTier = (highestTier: MembershipTier): Set<string> => {
    const levels = new Set<string>(['FREE']);
    const hi = tierIndex(highestTier);
    for (const tier of TIER_ORDER) {
        if (tierIndex(tier) <= hi) {
            levels.add(tier);
        }
    }
    return levels;
};

export interface TierAccessInfo {
    tier: MembershipTier;
    status: TierAccessStatus;
    streak: number;
    target: number;
    progress: number;
    daysRemaining: number;
    unlockHint: string | null;
    isPremium: boolean;
}

const CHALLENGE_TARGETS: Record<'FREE' | 'BRONZE' | 'SILVER', number> = {
    FREE: 30,
    BRONZE: 60,
    SILVER: 90,
};

const STREAK_KEYS: Record<'FREE' | 'BRONZE' | 'SILVER', 'free' | 'bronze' | 'silver'> = {
    FREE: 'free',
    BRONZE: 'bronze',
    SILVER: 'silver',
};

const PAID_SUBSCRIPTION_STATUSES = new Set([
    'active',
    'pending_cancellation',
    'trial',
    'future_active',
]);

/** Subscription is within its billing window and still grants access. */
export const isSubscriptionCurrentlyValid = (sub: UserSubscriptionInstance): boolean => {
    const now = Date.now();
    const start = new Date(sub.startDate).getTime();
    const end = new Date(sub.endDate).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    if (start > now || end < now) return false;
    return PAID_SUBSCRIPTION_STATUSES.has(sub.status);
};

export const getActiveSubscriptions = (user: User): UserSubscriptionInstance[] => {
    if (!user.subscriptions?.length) return [];
    return user.subscriptions.filter(isSubscriptionCurrentlyValid);
};

export const hasActiveGold = (user: User): boolean =>
    getActiveSubscriptions(user).some((sub) => sub.planName?.toLowerCase().includes('gold'));

export const hasActiveFullCourse = (user: User): boolean =>
    getActiveSubscriptions(user).some(
        (sub) =>
            sub.planName?.toLowerCase().includes('full course') ||
            sub.planName?.toLowerCase().includes('fullcourse')
    );

export const getUnlockedLevels = (user: User): string[] => user.unlockedLevels || ['FREE'];

/** Highest tier implied by active subscription plan names. */
export const getHighestActivePaidTier = (user: User): MembershipTier => {
    let highest: MembershipTier = 'FREE';
    for (const sub of getActiveSubscriptions(user)) {
        const level = planNameToLevel(sub.planName);
        if (tierIndex(level) > tierIndex(highest)) {
            highest = level;
        }
    }
    return highest;
};

/** Union of stored unlockedLevels and levels implied by active paid subscriptions. */
export const getEffectiveUnlockedLevels = (user: User): string[] => {
    // Admin hard-reset safeguard: when backend marks user FREE and no paid plan is active,
    // do not trust stale cached unlockedLevels from old sessions.
    const highestPaid = getHighestActivePaidTier(user);
    if (highestPaid === 'FREE' && user.membershipLevel === 'FREE') {
        return ['FREE'];
    }

    const stored = getUnlockedLevels(user);
    const fromSubs = expandLevelsForTier(highestPaid);
    return [...new Set([...stored, ...fromSubs])];
};

export const hasTierAccess = (user: User, tier: MembershipTier): boolean => {
    if (tier === 'FREE') return true;
    return getEffectiveUnlockedLevels(user).includes(tier);
};

/** Gold-tier daily content (scene, speech, lyrics, feed). */
export const canAccessGoldTierContent = (user: User | null | undefined): boolean => {
    if (!user) return false;
    if (hasTierAccess(user, 'GOLD') || hasTierAccess(user, 'FULL_COURSE')) return true;
    if (hasActiveGold(user) || hasActiveFullCourse(user)) return true;
    if (user.membershipLevel === 'GOLD' || user.membershipLevel === 'FULL_COURSE') return true;
    return false;
};

/** Header badge — never show FULL_COURSE/GOLD without active paid subscription. */
export const getDisplayMembershipLevel = (user: User): MembershipTier => {
    if (hasActiveFullCourse(user)) return 'FULL_COURSE';
    if (hasActiveGold(user)) return 'GOLD';

    const levels = getEffectiveUnlockedLevels(user);
    if (levels.includes('SILVER')) return 'SILVER';
    if (levels.includes('BRONZE')) return 'BRONZE';
    return 'FREE';
};

export const getStreakForDisplayLevel = (user: User): number => {
    const level = getDisplayMembershipLevel(user);
    if (level === 'FULL_COURSE' || level === 'GOLD') {
        return user.streaks?.silver?.current ?? user.streaks?.bronze?.current ?? user.streaks?.free?.current ?? 0;
    }
    const key = STREAK_KEYS[level as 'FREE' | 'BRONZE' | 'SILVER'];
    return user.streaks?.[key]?.current ?? 0;
};

const unlockHints: Record<MembershipTier, string | null> = {
    FREE: null,
    BRONZE: 'Complete the Free 30-day challenge or reach 70% free content completion.',
    SILVER: 'Unlock by completing the Bronze 60-day challenge.',
    GOLD: 'Subscribe to a Gold plan to unlock advanced content.',
    FULL_COURSE: 'Subscribe to the Full Course plan for structured modules and certification.',
};

const previousTier: Partial<Record<MembershipTier, MembershipTier>> = {
    BRONZE: 'FREE',
    SILVER: 'BRONZE',
    GOLD: 'SILVER',
    FULL_COURSE: 'GOLD',
};

export const getChallengeProgress = (current: number, target: number) => ({
    current,
    target,
    daysRemaining: Math.max(0, target - current),
    progress: target > 0 ? Math.min(100, (current / target) * 100) : 0,
});

export const getTierAccess = (tier: MembershipTier, user: User): TierAccessInfo => {
    const unlocked = getEffectiveUnlockedLevels(user);
    const isPremium = tier === 'GOLD' || tier === 'FULL_COURSE';

    if (isPremium) {
        const hasAccess = hasTierAccess(user, tier);

        return {
            tier,
            status: hasAccess ? 'unlocked' : 'locked',
            streak: 0,
            target: 0,
            progress: 0,
            daysRemaining: 0,
            unlockHint: hasAccess ? null : unlockHints[tier],
            isPremium: true,
        };
    }

    const target = CHALLENGE_TARGETS[tier as 'FREE' | 'BRONZE' | 'SILVER'];
    const streakKey = STREAK_KEYS[tier as 'FREE' | 'BRONZE' | 'SILVER'];
    const streak = user.streaks?.[streakKey]?.current ?? 0;
    const { progress, daysRemaining } = getChallengeProgress(streak, target);

    const tierUnlocked = hasTierAccess(user, tier);
    let status: TierAccessStatus;

    if (!tierUnlocked) {
        status = 'locked';
    } else if (streak >= target) {
        status = 'completed';
    } else {
        status = 'active';
    }

    let unlockHint: string | null = null;
    if (status === 'locked') {
        const prev = previousTier[tier];
        if (prev && !unlocked.includes(prev)) {
            unlockHint = `Unlock by completing ${prev.charAt(0) + prev.slice(1).toLowerCase()}.`;
        } else {
            unlockHint = unlockHints[tier];
        }
    }

    return {
        tier,
        status,
        streak,
        target,
        progress,
        daysRemaining,
        unlockHint,
        isPremium: false,
    };
};

export const getChallengeTiers = (user: User): TierAccessInfo[] =>
    (['FREE', 'BRONZE', 'SILVER'] as const).map((t) => getTierAccess(t, user));

export const getPremiumTiers = (user: User): TierAccessInfo[] =>
    (['GOLD', 'FULL_COURSE'] as const).map((t) => getTierAccess(t, user));

export const showPremiumSection = (user: User): boolean =>
    getPremiumTiers(user).some((t) => t.status === 'locked');
