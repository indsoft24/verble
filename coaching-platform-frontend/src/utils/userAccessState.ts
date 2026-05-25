import type { User, UserSubscriptionInstance } from '../services/authService';

export type MembershipTier = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE';
export type TierAccessStatus = 'locked' | 'active' | 'completed' | 'unlocked';

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

export const getActiveSubscriptions = (user: User): UserSubscriptionInstance[] => {
    if (!user.subscriptions?.length) return [];
    const now = Date.now();
    return user.subscriptions.filter((sub) => {
        if (sub.status !== 'active') return false;
        const start = new Date(sub.startDate).getTime();
        const end = new Date(sub.endDate).getTime();
        return start <= now && end >= now;
    });
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

/** Header badge — never show FULL_COURSE/GOLD without active paid subscription. */
export const getDisplayMembershipLevel = (user: User): MembershipTier => {
    if (hasActiveFullCourse(user)) return 'FULL_COURSE';
    if (hasActiveGold(user)) return 'GOLD';

    const levels = getUnlockedLevels(user);
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
    const unlocked = getUnlockedLevels(user);
    const isPremium = tier === 'GOLD' || tier === 'FULL_COURSE';

    if (isPremium) {
        const hasSub = tier === 'GOLD' ? hasActiveGold(user) : hasActiveFullCourse(user);
        const inUnlocked = unlocked.includes(tier);
        const hasAccess = hasSub && inUnlocked;

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

    const tierUnlocked = unlocked.includes(tier);
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
