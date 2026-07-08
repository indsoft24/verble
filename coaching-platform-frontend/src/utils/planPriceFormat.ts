import type { SubscriptionPlanPublic } from '../services/subscriptionPlanService';

/** Amounts are stored in minor units (paise/cents), same as admin. */
export function formatPlanPrice(amountInMinorUnits: number, currency = 'INR'): string {
    if (amountInMinorUnits == null || Number.isNaN(amountInMinorUnits)) return '';
    return (amountInMinorUnits / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

export function getPlanOfferLabels(plan: Pick<SubscriptionPlanPublic, 'price' | 'currency' | 'marketValue'>) {
    const currency = plan.currency || 'INR';
    const offer = formatPlanPrice(plan.price, currency);
    const original =
        plan.marketValue != null && plan.marketValue > (plan.price ?? 0)
            ? formatPlanPrice(plan.marketValue, currency)
            : null;
    return { offer, original, currency };
}

export function findPlanByNameMatch(
    plans: SubscriptionPlanPublic[],
    pattern: RegExp
): SubscriptionPlanPublic | undefined {
    return plans.find((p) => pattern.test(p.name.trim()));
}

export function findPlanByNameMatches(
    plans: SubscriptionPlanPublic[],
    patterns: RegExp[]
): SubscriptionPlanPublic | undefined {
    return plans.find((plan) => {
        const name = plan.name.trim();
        return patterns.some((pattern) => pattern.test(name));
    });
}

export const PLAN_NAME_MATCHERS = {
    freeFoundation: [/free foundation/i, /^free$/i],
    bronze: [/bronze/i],
    silver: [/silver/i],
    gold: [/gold professional/i, /gold membership/i, /\bgold\b/i],
    fullCourse: [/^full course$/i, /\bfull course\b/i],
    aiLearning: [/ai learning/i, /learning companion/i],
    bonus: [/bonus/i],
} as const;
