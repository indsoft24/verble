import { alpha, type SxProps, type Theme } from '@mui/material';
import { getAdjacentContent } from '../services/dailyContentService';
import {
    DISPLAY_NUMBER_BASE,
    getDisplayTag as getContentDisplayNumber,
    getWordDisplayNumber,
    WORD_DISPLAY_NUMBER_BASE,
} from './dailyContentDisplayNumber';

export const GREEN_ACCENT = '#14b8a6';
export const GOLD_ACCENT = '#ca8a04';
export const MAX_ACTIVITY_SENTENCES = 5;

/** Dark page background for daily activity detail views */
export const ACTIVITY_PAGE_BG = '#0b1220';

/** Class applied to dark activity cards so layout theme overrides do not force light Paper bg */
export const DAILY_ACTIVITY_CARD_CLASS = 'daily-activity-card';

export { DISPLAY_NUMBER_BASE, WORD_DISPLAY_NUMBER_BASE, getContentDisplayNumber, getWordDisplayNumber };

const toLocalDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const isContentScheduledToday = (dateStr: string): boolean => {
    const contentDate = new Date(dateStr);
    return toLocalDateKey(contentDate) === toLocalDateKey(new Date());
};

export async function refreshAdjacentFlags(contentId: string): Promise<{
    hasPrevious: boolean;
    hasNext: boolean;
}> {
    const [prevContent, nextContent] = await Promise.all([
        getAdjacentContent(contentId, 'prev'),
        getAdjacentContent(contentId, 'next'),
    ]);
    return {
        hasPrevious: !!prevContent,
        hasNext: !!nextContent,
    };
}

/** Next is hidden on today's item until user navigates to history */
export function canShowNextNavigation(
    currentDate: string,
    hasNextFromApi: boolean
): boolean {
    return !isContentScheduledToday(currentDate) && hasNextFromApi;
}

/** Outer wrapper for two-card activities (content + practice). */
export const activityCardStackSx: SxProps<Theme> = {
    maxWidth: 800,
    mx: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: { xs: 2.5, sm: 3 },
    my: { xs: 1.25, sm: 1.5 },
    width: '100%',
};

export const activityCardShell = (borderColor: string): SxProps<Theme> => ({
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    border: `2px solid ${borderColor}`,
    bgcolor: '#0f172a',
    boxShadow: `0 0 24px ${alpha(borderColor, 0.35)}`,
});

/** Props for MUI Card shells used across daily content activities */
export const activityCardProps = (borderColor: string) => ({
    className: DAILY_ACTIVITY_CARD_CLASS,
    elevation: 0 as const,
    sx: activityCardShell(borderColor),
});

/** Read-only submitted summary text (Scene, Speech, etc.) */
export const activitySubmittedTextSx: SxProps<Theme> = {
    p: { xs: 1.5, sm: 1.75 },
    borderRadius: 1.5,
    bgcolor: alpha('#0f172a', 0.65),
    border: `1px solid ${alpha('#e2e8f0', 0.18)}`,
    color: '#f8fafc',
    fontSize: { xs: '0.9375rem', sm: '1rem' },
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    minHeight: 80,
};

/** Editable summary fields on dark activity cards */
export type ActivityAlertSeverity = 'info' | 'success' | 'warning' | 'error';

/** Readable MUI Alert on dark gold activity cards */
export function activityAlertOnDarkSx(severity: ActivityAlertSeverity): SxProps<Theme> {
    const base = {
        mb: 2,
        py: { xs: 1.35, sm: 1.5 },
        px: { xs: 1.5, sm: 2 },
        alignItems: 'flex-start',
        borderRadius: 2,
        '& .MuiAlert-icon': {
            color: 'inherit',
            mt: 0.1,
            mr: 1.25,
            p: 0,
            opacity: 1,
            alignItems: 'center',
        },
        '& .MuiAlert-message': {
            width: '100%',
            py: 0.25,
            lineHeight: 1.55,
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
        },
    };
    switch (severity) {
        case 'info':
            return {
                ...base,
                bgcolor: alpha('#38bdf8', 0.15),
                border: `1px solid ${alpha('#38bdf8', 0.35)}`,
                color: '#e0f2fe',
                '& .MuiAlert-message': { ...base['& .MuiAlert-message'], color: '#e0f2fe' },
            };
        case 'success':
            return {
                ...base,
                bgcolor: alpha('#22c55e', 0.14),
                border: `1px solid ${alpha('#22c55e', 0.4)}`,
                color: '#bbf7d0',
                '& .MuiAlert-message': { ...base['& .MuiAlert-message'], color: '#bbf7d0' },
            };
        case 'warning':
            return {
                ...base,
                bgcolor: alpha('#f59e0b', 0.18),
                border: `1px solid ${alpha('#f59e0b', 0.45)}`,
                color: '#fef3c7',
                '& .MuiAlert-message': { ...base['& .MuiAlert-message'], color: '#fef3c7' },
                '& .MuiTypography-root': { color: '#fef3c7', lineHeight: 1.55 },
            };
        case 'error':
            return {
                ...base,
                bgcolor: alpha('#ef4444', 0.14),
                border: `1px solid ${alpha('#ef4444', 0.4)}`,
                color: '#fecaca',
                '& .MuiAlert-message': { ...base['& .MuiAlert-message'], color: '#fecaca' },
            };
        default:
            return base;
    }
}

/** Submitted sentence row on dark activity cards (vocab practice, etc.) */
export function activitySentenceReviewSx(
    review: boolean | null | undefined,
    accent: string = GOLD_ACCENT
): SxProps<Theme> {
    return {
        p: { xs: 1.75, sm: 2 },
        borderRadius: 2,
        border: '1px solid',
        borderColor:
            review === true
                ? alpha('#22c55e', 0.65)
                : review === false
                  ? alpha('#ef4444', 0.65)
                  : alpha(accent, 0.28),
        bgcolor:
            review === true
                ? alpha('#22c55e', 0.12)
                : review === false
                  ? alpha('#ef4444', 0.12)
                  : alpha('#1a1f2e', 0.6),
    };
}

export function activityNavSideButtonSx(options: {
    disabled: boolean;
    accentColor: string;
    side: 'left' | 'right';
    inStackedRow?: boolean;
    isDark?: boolean;
}): SxProps<Theme> {
    const { disabled, accentColor, side, inStackedRow = false, isDark = true } = options;
    const activeColor = isDark ? alpha('#e2e8f0', 0.9) : 'text.primary';
    const idleColor = isDark ? alpha('#e2e8f0', 0.55) : alpha('#000', 0.45);

    return {
        color: disabled ? idleColor : activeColor,
        fontWeight: 600,
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        minWidth: 0,
        minHeight: 44,
        maxWidth: '100%',
        opacity: 1,
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
        textAlign: side,
        px: { xs: 0.5, sm: 1 },
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto',
        ...(inStackedRow
            ? { flex: '1 1 0', width: '100%' }
            : { width: '100%', justifySelf: side === 'left' ? 'start' : 'end' }),
        '&:hover': disabled
            ? { bgcolor: 'transparent' }
            : { bgcolor: alpha(accentColor, isDark ? 0.1 : 0.06) },
        '&.Mui-disabled': {
            opacity: 1,
            color: idleColor,
        },
        '& .MuiButton-startIcon, & .MuiButton-endIcon': {
            flexShrink: 0,
            marginInline: { xs: 0.25, sm: 0.5 },
            color: 'inherit',
        },
    };
}

export function activityNavCenterButtonSx(options: {
    disabled: boolean;
    accentColor: string;
    isDark?: boolean;
    fullWidth?: boolean;
}): SxProps<Theme> {
    const { disabled, accentColor, isDark = true, fullWidth = false } = options;
    return {
        borderColor: disabled ? alpha(accentColor, 0.35) : accentColor,
        color: disabled ? alpha(accentColor, 0.55) : accentColor,
        fontWeight: 700,
        fontSize: { xs: '0.875rem', sm: '0.9375rem' },
        textTransform: 'none',
        py: 1.1,
        px: 2,
        minHeight: 48,
        maxWidth: '100%',
        width: fullWidth ? '100%' : 'auto',
        justifySelf: 'center',
        flexShrink: 0,
        opacity: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto',
        '&:hover': disabled
            ? { bgcolor: 'transparent', borderColor: alpha(accentColor, 0.35) }
            : {
                  borderColor: accentColor,
                  bgcolor: alpha(accentColor, isDark ? 0.14 : 0.08),
              },
        '&.Mui-disabled': {
            opacity: 1,
            borderColor: alpha(accentColor, 0.35),
            color: alpha(accentColor, 0.55),
        },
    };
}

/** Gold (or tier) contained submit buttons on dark cards — stay visible when disabled */
export function activityContainedButtonSx(accentColor: string = GOLD_ACCENT): SxProps<Theme> {
    return {
        bgcolor: accentColor,
        color: '#0f172a',
        fontWeight: 800,
        opacity: 1,
        '&:hover': {
            bgcolor: alpha(accentColor, 0.88),
        },
        '&.Mui-disabled': {
            opacity: 1,
            cursor: 'not-allowed',
            bgcolor: alpha(accentColor, 0.35),
            color: alpha('#f8fafc', 0.75),
        },
    };
}

export const activitySummaryTextFieldSx = (accent: string = GOLD_ACCENT): SxProps<Theme> => ({
    '& .MuiOutlinedInput-root': {
        bgcolor: alpha('#0f172a', 0.55),
        color: '#f8fafc',
        '& fieldset': {
            borderColor: alpha(accent, 0.35),
        },
        '&:hover fieldset': {
            borderColor: alpha(accent, 0.5),
        },
        '&.Mui-focused fieldset': {
            borderColor: accent,
        },
        '& .MuiOutlinedInput-input': {
            color: '#f8fafc',
            WebkitTextFillColor: '#f8fafc',
        },
        '&.Mui-disabled': {
            bgcolor: alpha('#0f172a', 0.65),
            '& .MuiOutlinedInput-input': {
                color: '#f8fafc',
                WebkitTextFillColor: '#f8fafc',
                opacity: 1,
            },
        },
    },
});
