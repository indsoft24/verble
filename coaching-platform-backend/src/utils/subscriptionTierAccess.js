/**
 * Subscription tier ordering (numeric for comparisons):
 * FREE < FOUNDATIONAL < BRONZE < SILVER < GOLD < FULL_COURSE
 *
 * Based on `SubscriptionPlan.name` (and user subscription `planName`).
 */

export const TIER_LEVEL = {
  FREE: 0,
  FOUNDATIONAL: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 4,
  FULL_COURSE: 5,
};

export function planNameToTierLevel(planName) {
  const name = String(planName || '').toLowerCase();
  if (!name) return TIER_LEVEL.FREE;

  if (name.includes('full course') || name.includes('fullcourse')) {
    return TIER_LEVEL.FULL_COURSE;
  }
  if (name.includes('gold')) return TIER_LEVEL.GOLD;
  if (name.includes('silver')) return TIER_LEVEL.SILVER;
  if (name.includes('bronze')) return TIER_LEVEL.BRONZE;
  if (name.includes('foundational')) return TIER_LEVEL.FOUNDATIONAL;

  return TIER_LEVEL.FREE;
}

/**
 * Highest active tier across all of the user's subscriptions (by endDate).
 */
export function getActiveUserTierLevel(subscriptions) {
  const subs = Array.isArray(subscriptions) ? subscriptions : [];
  const now = new Date();

  const active = subs.filter((sub) => {
    if (!sub) return false;
    if (sub.status !== 'active') return false;
    if (!sub.endDate) return false;
    return new Date(sub.endDate) >= now;
  });

  if (active.length === 0) return TIER_LEVEL.FREE;

  let max = TIER_LEVEL.FREE;
  for (const s of active) {
    const lvl = planNameToTierLevel(s.planName);
    if (lvl > max) max = lvl;
  }
  return max;
}

/**
 * Count users per tier bucket for admin dashboard (one bucket per user = max active tier).
 */
export function computeTierDashboardCounts(usersWithSubscriptionsField) {
  const counts = {
    foundational: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
    fullCourse: 0,
  };

  for (const u of usersWithSubscriptionsField) {
    const max = getActiveUserTierLevel(u.subscriptions);
    if (max === TIER_LEVEL.FULL_COURSE) counts.fullCourse += 1;
    else if (max === TIER_LEVEL.GOLD) counts.gold += 1;
    else if (max === TIER_LEVEL.SILVER) counts.silver += 1;
    else if (max === TIER_LEVEL.BRONZE) counts.bronze += 1;
    else if (max === TIER_LEVEL.FOUNDATIONAL) counts.foundational += 1;
  }

  return {
    ...counts,
    freeTierTotal: counts.foundational + counts.bronze + counts.silver,
    premiumTotal: counts.gold + counts.fullCourse,
  };
}

/**
 * `video.requiredPlans` is an array of populated SubscriptionPlan docs: { _id, name }.
 * If userTier >= requiredTier for ANY required plan, user can access.
 */
export function canAccessRequiredPlansByTier({ requiredPlans, userTierLevel }) {
  const req = Array.isArray(requiredPlans) ? requiredPlans : [];
  if (req.length === 0) return true;

  const requiredLevels = req
    .map((p) => planNameToTierLevel(p?.name))
    .filter((lvl) => typeof lvl === 'number');

  if (requiredLevels.length === 0) return true;

  return requiredLevels.some((requiredLevel) => userTierLevel >= requiredLevel);
}
