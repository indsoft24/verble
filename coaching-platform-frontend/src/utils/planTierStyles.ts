/** Visual accents for subscription plan cards (aligned with dashboard tiers). */
export interface PlanTierStyle {
    accent: string;
    gradient: string;
    chipBg: string;
    featured?: boolean;
}

export const getPlanTierStyle = (planName: string): PlanTierStyle => {
    const n = planName.toLowerCase();

    if (n.includes('bronze')) {
        return {
            accent: '#ea580c',
            gradient: 'linear-gradient(145deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
            chipBg: 'rgba(234, 88, 12, 0.12)',
        };
    }
    if (n.includes('silver')) {
        return {
            accent: '#2563eb',
            gradient: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
            chipBg: 'rgba(37, 99, 235, 0.12)',
            featured: true,
        };
    }
    if (n.includes('gold')) {
        return {
            accent: '#ca8a04',
            gradient: 'linear-gradient(145deg, #fefce8 0%, #fef9c3 50%, #fde047 100%)',
            chipBg: 'rgba(202, 138, 4, 0.15)',
            featured: true,
        };
    }
    if (n.includes('full')) {
        return {
            accent: '#7c3aed',
            gradient: 'linear-gradient(145deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
            chipBg: 'rgba(124, 58, 237, 0.12)',
            featured: true,
        };
    }

    return {
        accent: '#0d9488',
        gradient: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%)',
        chipBg: 'rgba(13, 148, 136, 0.12)',
    };
};

export const formatDurationLabel = (value: number, unit: string): string => {
    const u = unit?.toLowerCase() || 'month';
    const v = value ?? 1;
    if (v === 1) {
        if (u === 'month') return '1 month';
        if (u === 'year') return '1 year';
        if (u === 'day') return '1 day';
        if (u === 'week') return '1 week';
    }
    return `${v} ${u}${v !== 1 ? 's' : ''}`;
};
