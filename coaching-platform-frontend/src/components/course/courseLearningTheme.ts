import { alpha } from '@mui/material/styles';

/** Verble brand — teal primary, yellow highlight (logo-inspired) */
export const COURSE_LEARNING_ACCENT = '#22a699';
export const COURSE_LEARNING_ACCENT_DARK = '#1a857c';
export const COURSE_LEARNING_HIGHLIGHT = '#e8b923';

/** Production-tuned spacing (matches learning page devtools reference) */
export const courseLearningSpace = {
    gap: '5px',
    gapMd: '8px',
    bandInset: { xs: '7px', sm: '8px' },
    bandMb: '24px',
    blockMt: '5px',
    blockMb: '16px',
    sectionMt: '8px',
    rowIndent: '16px',
    lessonThumbSm: 104,
    lessonRowMinHeight: 102,
} as const;

/** MUI Stack/Grid spacing multiplier for 5px (8px theme unit × 0.625) */
export const courseLearningStackSpacing = 0.625;

export const courseLearningTheme = {
    accent: COURSE_LEARNING_ACCENT,
    accentDark: COURSE_LEARNING_ACCENT_DARK,
    highlight: COURSE_LEARNING_HIGHLIGHT,
    pageBg: '#0f1619',
    bandBg: '#182428',
    tileBg: '#1f2e34',
    surfaceRaised: '#263a42',
    textPrimary: '#f4f7f6',
    textSecondary: '#c5ddd8',
    textMuted: '#8fa8a3',
    textBody: '#d4e4e1',
    iconOnDark: '#ffffff',
    iconMuted: '#a8c4bf',
    borderRadius: 10,
    bandBorderRadius: 14,
    bottomNavHeight: 64,
    bottomNavSafePadding: 'max(8px, env(safe-area-inset-bottom))',
    contentPaddingBottom: 76,
    space: courseLearningSpace,
    bandMb: courseLearningSpace.bandMb,
    bandOuterP: courseLearningSpace.bandInset,
    bandHeaderPt: courseLearningSpace.gapMd,
    bandHeaderPb: courseLearningSpace.gap,
    bandBodyP: 0,
    bandBodyPt: courseLearningSpace.gap,
    bandBodyGap: courseLearningSpace.gap,
    stackGap: courseLearningSpace.gap,
    stackGapLoose: courseLearningSpace.blockMb,
    sectionGap: courseLearningSpace.blockMb,
    gridGap: courseLearningSpace.gap,
    accordionGap: courseLearningSpace.gap,
    listRowGap: courseLearningSpace.gap,
    paperP: courseLearningSpace.bandInset,
    accordionSummaryPx: courseLearningSpace.bandInset,
    accordionSummaryPy: courseLearningSpace.gapMd,
    accordionDetailsPx: courseLearningSpace.bandInset,
    accordionDetailsPy: courseLearningSpace.gapMd,
    lessonThumbWidth: { sm: courseLearningSpace.lessonThumbSm, md: 200 },
    shellPt: courseLearningSpace.gapMd,
    shellPx: courseLearningSpace.bandInset,
    breadcrumbMb: courseLearningSpace.blockMb,
    learningRowStackSx: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: '100%',
        pr: courseLearningSpace.gapMd,
        gap: courseLearningSpace.gap,
    },
    learningColStackSx: {
        display: 'flex',
        flexDirection: 'column',
        gap: courseLearningSpace.gap,
    },
    learningActionBarSx: {
        display: 'flex',
        justifyContent: 'center',
        mt: courseLearningSpace.blockMt,
        mb: courseLearningSpace.blockMb,
    },
    contentMaxWidth: 1200,
    bandBorder: (locked = false) =>
        `1px solid ${alpha(COURSE_LEARNING_ACCENT, locked ? 0.28 : 0.45)}`,
    bandShadow: `0 2px 16px ${alpha('#000', 0.28)}`,
    tileBorder: (locked = false) =>
        `1px solid ${alpha(COURSE_LEARNING_ACCENT, locked ? 0.2 : 0.32)}`,
    focusRing: `0 0 0 2px ${alpha(COURSE_LEARNING_ACCENT, 0.5)}`,
} as const;

export const courseBottomNavZIndex = 1200;

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
    height: 26,
    fontSize: '0.75rem',
    fontWeight: 600,
    borderColor: alpha(COURSE_LEARNING_ACCENT, 0.45),
    color: courseLearningTheme.textSecondary,
    bgcolor: alpha(COURSE_LEARNING_ACCENT, 0.1),
    '& .MuiChip-icon': { color: courseLearningTheme.accent },
} as const;

export const courseChipSuccessSx = {
    ...courseChipOutlinedSx,
    borderColor: alpha('#34d399', 0.55),
    color: '#a7f3d0',
    bgcolor: alpha('#34d399', 0.14),
    '& .MuiChip-icon': { color: '#6ee7b7' },
} as const;

export const courseChipWarningSx = {
    ...courseChipOutlinedSx,
    borderColor: alpha(COURSE_LEARNING_HIGHLIGHT, 0.55),
    color: '#fde68a',
    bgcolor: alpha(COURSE_LEARNING_HIGHLIGHT, 0.12),
    '& .MuiChip-icon': { color: COURSE_LEARNING_HIGHLIGHT },
} as const;

export const courseChipInfoSx = {
    ...courseChipOutlinedSx,
    borderColor: alpha(COURSE_LEARNING_ACCENT, 0.5),
    color: courseLearningTheme.textSecondary,
    bgcolor: alpha(COURSE_LEARNING_ACCENT, 0.12),
    '& .MuiChip-icon': { color: courseLearningTheme.accent },
} as const;
