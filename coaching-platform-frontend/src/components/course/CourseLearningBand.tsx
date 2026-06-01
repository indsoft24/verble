import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { courseLearningTheme } from './courseLearningTheme';

export interface CourseLearningBandProps {
    headerLabel: string;
    subtitle?: string;
    ribbon?: string | null;
    locked?: boolean;
    children?: React.ReactNode;
    /** Skip outer margin (when stacking bands) */
    noMargin?: boolean;
}

const CourseLearningBand: React.FC<CourseLearningBandProps> = ({
    headerLabel,
    subtitle,
    ribbon = null,
    locked = false,
    children,
    noMargin = false,
}) => (
    <Box
        sx={{
            position: 'relative',
            mb: noMargin ? 0 : courseLearningTheme.bandMb,
            p: courseLearningTheme.bandOuterP,
            borderRadius: `${courseLearningTheme.bandBorderRadius}px`,
            border: courseLearningTheme.bandBorder(locked),
            bgcolor: courseLearningTheme.bandBg,
            overflow: 'hidden',
            boxShadow: courseLearningTheme.bandShadow,
        }}
    >
        {ribbon && (
            <Box
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: -28,
                    zIndex: 3,
                    width: 96,
                    py: 0.75,
                    textAlign: 'center',
                    transform: 'rotate(45deg)',
                    bgcolor: courseLearningTheme.highlight,
                    color: '#1a1a1a',
                    fontWeight: 900,
                    fontSize: '0.62rem',
                    letterSpacing: 1,
                }}
            >
                {ribbon}
            </Box>
        )}

        <Box
            sx={{
                pt: courseLearningTheme.bandHeaderPt,
                pb: children ? courseLearningTheme.bandHeaderPb : 0,
                ...(ribbon ? { pr: courseLearningTheme.space.gapMd } : {}),
                borderBottom: children ? `1px solid ${alpha(courseLearningTheme.accent, 0.22)}` : 'none',
                ...courseLearningTheme.learningColStackSx,
            }}
        >
            <Typography
                variant="overline"
                sx={{
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    color: courseLearningTheme.accent,
                    fontSize: '0.68rem',
                    lineHeight: 1.3,
                    display: 'block',
                    m: 0,
                }}
            >
                {headerLabel}
            </Typography>
            {subtitle && (
                <Typography
                    variant="body2"
                    sx={{
                        m: 0,
                        color: courseLearningTheme.textMuted,
                        maxWidth: 640,
                        lineHeight: 1.5,
                        fontSize: '0.8125rem',
                    }}
                >
                    {subtitle}
                </Typography>
            )}
        </Box>

        {children && (
            <Box
                sx={{
                    pt: courseLearningTheme.bandBodyPt,
                    ...courseLearningTheme.learningColStackSx,
                }}
            >
                {children}
            </Box>
        )}
    </Box>
);

export default CourseLearningBand;
