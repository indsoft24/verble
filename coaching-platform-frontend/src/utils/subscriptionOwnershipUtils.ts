export interface SubscriptionOwnershipRecord {
    _id?: string;
    planId?: string | { _id?: string } | null;
    planName?: string;
    status?: string;
    startDate?: string | Date;
    endDate?: string | Date;
}

export const OWNED_SUBSCRIPTION_STATUSES = [
    'active',
    'trial',
    'future_active',
    'pending_cancellation',
] as const;

type OwnedStatus = (typeof OWNED_SUBSCRIPTION_STATUSES)[number];

export function resolveSubscriptionPlanId(
    planId: SubscriptionOwnershipRecord['planId'] | null | undefined
): string | null {
    if (!planId) return null;
    if (typeof planId === 'string') return planId;
    if (typeof planId === 'object' && planId._id) return String(planId._id);
    return null;
}

export function isSubscriptionCurrentlyOwned(
    sub: SubscriptionOwnershipRecord,
    now: Date = new Date()
): boolean {
    if (!OWNED_SUBSCRIPTION_STATUSES.includes(sub.status as OwnedStatus)) return false;
    if (sub.endDate) {
        const end = new Date(sub.endDate);
        if (!Number.isNaN(end.getTime()) && end < now) return false;
    }
    return true;
}

export function findOwnedSubscription<T extends SubscriptionOwnershipRecord>(
    subscriptions: T[],
    planId: string
): T | undefined {
    return subscriptions.find(
        (sub) =>
            isSubscriptionCurrentlyOwned(sub) &&
            resolveSubscriptionPlanId(sub.planId) === planId
    );
}

export function userOwnsPlan(
    subscriptions: SubscriptionOwnershipRecord[],
    planId: string
): boolean {
    return Boolean(findOwnedSubscription(subscriptions, planId));
}

export function formatSubscriptionEndDate(date?: string | Date): string | null {
    if (!date) return null;
    try {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return null;
    }
}
