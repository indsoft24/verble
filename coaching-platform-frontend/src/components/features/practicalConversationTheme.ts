import { alpha } from '@mui/material/styles';
import {
    COURSE_LEARNING_ACCENT,
    COURSE_LEARNING_HIGHLIGHT,
    courseLearningTheme,
} from '../course/courseLearningTheme';

export const practicalConversationTheme = {
    accent: COURSE_LEARNING_ACCENT,
    accentDark: courseLearningTheme.accentDark,
    highlight: COURSE_LEARNING_HIGHLIGHT,
    silverRing: COURSE_LEARNING_ACCENT,
    headerBg: courseLearningTheme.bandBg,
    headerText: courseLearningTheme.textPrimary,
    headerMuted: courseLearningTheme.textMuted,
    headerAccentLabel: '#a7f3d0',
    chatBg: '#1a2428',
    bubbleOther: courseLearningTheme.surfaceRaised,
    bubbleOtherText: courseLearningTheme.textPrimary,
    bubbleUser: alpha(COURSE_LEARNING_ACCENT, 0.22),
    bubbleUserText: courseLearningTheme.textPrimary,
    bubbleLabel: COURSE_LEARNING_ACCENT,
    bubbleHindi: courseLearningTheme.textSecondary,
    iconColor: COURSE_LEARNING_ACCENT,
    practicePanelBg: courseLearningTheme.bandBg,
    practiceBorder: `1px solid ${alpha(COURSE_LEARNING_ACCENT, 0.45)}`,
    cardShadow: `0 0 24px ${alpha(COURSE_LEARNING_ACCENT, 0.2)}`,
    /** Unified pro-mobile column width (large-phone logical width, full width on xs) */
    frameMaxWidth: { xs: '100%', sm: 520 },
    frameWidth: '100%',
} as const;
