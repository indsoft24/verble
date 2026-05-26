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
