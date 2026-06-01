import React from 'react';
import { Box, Chip, Typography, alpha } from '@mui/material';
import { getContentTypeConfig, type ContentType } from '../../utils/contentTypeConfig';

const LEARNER_ACTIVITY_LABELS: Partial<Record<ContentType, string>> = {
    WORD: 'Word of the Day',
    PHRASE: 'Phrase of the Day',
    STORY: 'One Minute Read',
    VOCAB_SET: 'Weekly Essential Vocab',
    SCENE: 'Explain the Scene',
    SPEECH: 'Famous Speeches',
    LYRICS: 'Song Lyrics',
    FEED: 'Instagram Feeds',
    PUZZLE: 'Daily Puzzle',
    CONVERSATION: 'Practical Conversations',
};

export function getLearnerActivityLabel(type: ContentType, labelOverride?: string): string {
    if (labelOverride?.trim()) return labelOverride.trim();
    return LEARNER_ACTIVITY_LABELS[type] ?? getContentTypeConfig(type).label;
}

export interface ActivityContentHeaderProps {
    contentType: ContentType;
    /** Accent for icon, label, and number chip (dark cards). */
    accentColor: string;
    displayNumber?: string | null;
    /** Optional chip after the number (e.g. part of speech on Word). */
    secondaryChip?: string | null;
    labelOverride?: string;
    /** Light cards (Speech, Puzzle) use theme text colors. */
    variant?: 'dark' | 'light';
    sx?: { mb?: number };
}

const ActivityContentHeader: React.FC<ActivityContentHeaderProps> = ({
    contentType,
    accentColor,
    displayNumber,
    secondaryChip,
    labelOverride,
    variant = 'dark',
    sx,
}) => {
    const config = getContentTypeConfig(contentType);
    const Icon = config.icon;
    const label = getLearnerActivityLabel(contentType, labelOverride);
    const isDark = variant === 'dark';
    const labelColor = isDark ? accentColor : 'text.secondary';
    const iconColor = isDark ? accentColor : 'primary.main';

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mb: sx?.mb ?? 1,
            }}
        >
            <Box component={Icon} sx={{ fontSize: 20, color: iconColor, flexShrink: 0 }} />
            <Typography
                variant="overline"
                sx={{
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    color: labelColor,
                    lineHeight: 1.4,
                }}
            >
                {label}
            </Typography>
            {displayNumber && (
                <Chip
                    label={displayNumber}
                    size="small"
                    variant="outlined"
                    sx={{
                        borderColor: isDark ? alpha(accentColor, 0.6) : alpha(accentColor, 0.45),
                        color: isDark ? accentColor : 'primary.main',
                        fontWeight: 700,
                    }}
                />
            )}
            {secondaryChip?.trim() && (
                <Chip
                    label={secondaryChip.trim()}
                    size="small"
                    variant="outlined"
                    sx={{
                        color: isDark ? alpha('#e2e8f0', 0.9) : 'text.secondary',
                        borderColor: isDark ? alpha('#e2e8f0', 0.3) : 'divider',
                    }}
                />
            )}
        </Box>
    );
};

export default ActivityContentHeader;
