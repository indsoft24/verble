/**
 * Landing page design system.
 * Spacing uses MUI 8px base: 4=0.5, 8=1, 12=1.5, 16=2, 24=3, 32=4, 48=6, 64=8, 96=12.
 */
export const SPACING = {
    /** 4px */
    xxs: 0.5,
    /** 8px */
    xs: 1,
    /** 12px */
    sm: 1.5,
    /** 16px */
    md: 2,
    /** 24px */
    lg: 3,
    /** 32px */
    xl: 4,
    /** 48px */
    xxl: 6,
    /** 64px */
    section: 8,
    /** 96px */
    hero: 12,
} as const;

/** Vertical padding between sections: reduced for tighter layout */
export const SECTION_PADDING_Y = {
    xs: 3,   // 24px
    sm: 4,   // 32px
    md: 5,   // 40px
} as const;

/** Outer section horizontal padding (reduced from 24px) */
export const SECTION_PADDING_X = SPACING.md; // 2 = 16px

/** Max width of content container (1200px) */
export const CONTAINER_MAX_WIDTH = 1200;

/** Hero vertical padding: 96px */
export const HERO_PADDING_Y = SPACING.hero; // 12 = 96px

/** Gap between hero columns: 48px */
export const HERO_COLUMN_GAP = SPACING.xxl; // 6

/** Gap between CTA buttons: 16px */
export const BUTTON_GAP = SPACING.md; // 2

/** Feature card: padding 24px, gap 24px, radius 16px */
export const CARD_PADDING = SPACING.lg;   // 3 = 24px
export const CARD_GAP = SPACING.lg;       // 3 = 24px
export const CARD_BORDER_RADIUS = 2;      // 16px
export const CARD_HOVER_LIFT = -6;        // translateY(-6px)

/** Typography */
export const TYPO = {
    heroTitle: { xs: '2.25rem', sm: '2.75rem', md: '3rem', lg: '3.5rem' }, // 36–56px
    sectionTitle: { xs: '1.75rem', md: '2rem', lg: '2.25rem' },            // 28–36px
    subtitle: { xs: '1.125rem', md: '1.25rem' },                           // 18–20px
    body: '1rem',       // 16px
    bodySmall: '0.875rem', // 14px
    lineHeightBody: 1.5,
} as const;

export const NAVBAR_HEIGHT = 72;
