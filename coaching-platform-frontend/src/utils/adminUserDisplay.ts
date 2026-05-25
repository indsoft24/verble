import type { AdminUserView } from '../services/adminService';
import type { SubscriptionPlan } from '../services/subscriptionPlanAdminService';

const FREE_FOUNDATION_NAME = 'Free Foundation';

export function getUserPhone(user: AdminUserView): string {
    return user.phoneNumber || '—';
}

export function getActiveSubscriptions(user: AdminUserView) {
    const now = new Date();
    return (user.subscriptions || []).filter(
        (sub) =>
            sub.status === 'active' &&
            sub.startDate &&
            sub.endDate &&
            new Date(sub.startDate) <= now &&
            new Date(sub.endDate) >= now
    );
}

export function getUserPlanDisplay(user: AdminUserView): {
    planName: string;
    statusLabel: string;
    statusColor: 'default' | 'success' | 'warning' | 'error';
} {
    const active = getActiveSubscriptions(user);
    if (active.length === 0) {
        return { planName: 'None', statusLabel: 'NONE', statusColor: 'default' };
    }

    const premium = active.find((s) => s.planName !== FREE_FOUNDATION_NAME);
    const sub = premium || active[0];
    const planName = sub.planName || (typeof sub.planId === 'object' ? (sub.planId as SubscriptionPlan).name : 'Unknown');

    if (planName === FREE_FOUNDATION_NAME) {
        return { planName: 'Free Foundation', statusLabel: 'ACTIVE', statusColor: 'success' };
    }

    return { planName, statusLabel: 'ACTIVE', statusColor: 'success' };
}

export function formatPlanDurationLabel(plan?: SubscriptionPlan | null): string {
    if (!plan?.duration) return '';
    const { value, unit } = plan.duration;
    if (plan.name === FREE_FOUNDATION_NAME && unit === 'day' && value >= 365) {
        return 'No expiry (Free Foundation)';
    }
    return `${value} ${unit}(s)`;
}
