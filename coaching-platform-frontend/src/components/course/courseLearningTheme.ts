import { alpha } from '@mui/material/styles';

/** Full Course tier accent */
export const COURSE_LEARNING_ACCENT = '#8b5cf6';
export const COURSE_LEARNING_ACCENT_DARK = '#7c3aed';

/** Readable text on purple-tinted dark surfaces */
export const courseLearningTheme = {
    accent: COURSE_LEARNING_ACCENT,
    accentDark: COURSE_LEARNING_ACCENT_DARK,
    /** Soft black with purple undertone */
    pageBg: '#13111c',
    /** Card / band surface */
    bandBg: '#1c1929',
    /** Nested tiles, lesson rows */
    tileBg: '#252236',
    surfaceRaised: '#2d2940',
    textPrimary: '#f8fafc',
    textSecondary: '#e9e4ff',
    textMuted: '#c4bdd9',
    textBody: '#e2e8f0',
    borderRadius: 10,
    bandBorderRadius: 14,
    bottomNavHeight: 64,
    bottomNavSafePadding: 'max(8px, env(safe-area-inset-bottom))',
    contentPaddingBottom: 76,
    /** Compact vertical rhythm */
    bandMb: 1.5,
    bandHeaderPy: 1.25,
    bandBodyP: 1.5,
    shellPt: 0.75,
    shellPx: { xs: 1.5, sm: 2 },
    breadcrumbMb: 1,
    bandBorder: (locked = false) =>
        `1px solid ${alpha(COURSE_LEARNING_ACCENT, locked ? 0.3 : 0.55)}`,
    bandShadow: `0 2px 16px ${alpha('#000', 0.25)}`,
    tileBorder: (locked = false) =>
        `1px solid ${alpha(COURSE_LEARNING_ACCENT, locked ? 0.22 : 0.38)}`,
    focusRing: `0 0 0 2px ${alpha(COURSE_LEARNING_ACCENT, 0.55)}`,
} as const;

export const courseBottomNavZIndex = 1200;

/** TipTap / HTML description — force light text on dark UI */
export const courseTiptapSx = {
    color: courseLearningTheme.textBody,
    '& p': {
        typography: 'body2',
        lineHeight: 1.6,
        mb: 1,
        color: courseLearningTheme.textBody,
    },
    '& ul, & ol': { pl: 2.5, mb: 1, color: courseLearningTheme.textBody },
    '& li': { mb: 0.35, color: courseLearningTheme.textBody },
    '& strong': { fontWeight: 700, color: courseLearningTheme.textPrimary },
    '& em': { fontStyle: 'italic', color: courseLearningTheme.textSecondary },
    '& a': {
        color: courseLearningTheme.accent,
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
        mt: 1.5,
        mb: 0.75,
        fontWeight: 700,
        color: courseLearningTheme.textPrimary,
    },
    '& span, & div': { color: 'inherit' },
} as const;

export const courseChipOutlinedSx = {
    height: 24,
    fontSize: '0.75rem',
    fontWeight: 600,
    borderColor: alpha(COURSE_LEARNING_ACCENT, 0.45),
    color: courseLearningTheme.textSecondary,
    bgcolor: alpha(COURSE_LEARNING_ACCENT, 0.08),
} as const;

export const courseChipSuccessSx = {
    ...courseChipOutlinedSx,
    borderColor: alpha('#34d399', 0.5),
    color: '#a7f3d0',
    bgcolor: alpha('#34d399', 0.12),
} as const;

export const courseChipWarningSx = {
    ...courseChipOutlinedSx,
    borderColor: alpha('#fbbf24', 0.55),
    color: '#fde68a',
    bgcolor: alpha('#fbbf24', 0.12),
} as const;

export const courseChipInfoSx = {
    ...courseChipOutlinedSx,
    borderColor: alpha('#a78bfa', 0.5),
    color: '#ddd6fe',
    bgcolor: alpha('#a78bfa', 0.1),
} as const;
