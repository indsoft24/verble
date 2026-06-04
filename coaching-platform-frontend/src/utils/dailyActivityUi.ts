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

export const activityCardShell = (borderColor: string): SxProps<Theme> => ({
    maxWidth: 800,
    margin: '0 auto',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    border: `2px solid ${borderColor}`,
    bgcolor: '#0f172a',
    boxShadow: `0 0 24px ${alpha(borderColor, 0.35)}`,
    mb: 2.5,
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
