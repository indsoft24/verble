/** Legal and business identity shown across the public site. */
export const SITE_OWNER = {
    name: 'PARUL SHARMA',
    role: 'Proprietor',
} as const;

/** Refund processing timeline communicated to learners. */
export const SITE_REFUND_CREDIT_POLICY =
    'If any refund is approved, we will credit the refund within 10 days.';

export const siteOwnerDisplayLine = `${SITE_OWNER.role}: ${SITE_OWNER.name}`;
