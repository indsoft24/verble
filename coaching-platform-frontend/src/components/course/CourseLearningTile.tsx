import React from 'react';
import { Box, Typography, Chip, alpha } from '@mui/material';
import { courseLearningTheme } from './courseLearningTheme';

export interface CourseLearningTileProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    imageUrl?: string;
    onClick?: () => void;
    variant?: 'row' | 'card';
    badgeLabel?: string;
    disabled?: boolean;
    footer?: React.ReactNode;
}

const CourseLearningTile: React.FC<CourseLearningTileProps> = ({
    title,
    subtitle,
    icon,
    imageUrl,
    onClick,
    variant = 'row',
    badgeLabel,
    disabled = false,
    footer,
}) => {
    const interactive = !disabled && !!onClick;

    const handleActivate = () => {
        if (interactive && onClick) onClick();
    };

    if (variant === 'card') {
        return (
            <Box
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : -1}
                onClick={handleActivate}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && interactive) {
                        e.preventDefault();
                        handleActivate();
                    }
                }}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    border: courseLearningTheme.tileBorder(disabled),
                    bgcolor: courseLearningTheme.tileBg,
                    overflow: 'hidden',
                    cursor: interactive ? 'pointer' : 'default',
                    opacity: disabled ? 0.55 : 1,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    outline: 'none',
                    '&:hover': interactive
                        ? {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 20px ${alpha(courseLearningTheme.accent, 0.25)}`,
                          }
                        : undefined,
                    '&:focus-visible': { boxShadow: courseLearningTheme.focusRing },
                }}
            >
                {imageUrl && (
                    <Box
                        sx={{
                            aspectRatio: '16 / 9',
                            backgroundImage: `url("${imageUrl}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            bgcolor: alpha(courseLearningTheme.accent, 0.15),
                        }}
                    />
                )}
                <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 800, color: courseLearningTheme.accent, lineHeight: 1.3 }}
                        >
                            {title}
                        </Typography>
                        {badgeLabel && (
                            <Chip
                                label={badgeLabel}
                                size="small"
                                variant="outlined"
                                sx={{
                                    height: 22,
                                    fontSize: '0.7rem',
                                    borderColor: alpha(courseLearningTheme.accent, 0.55),
                                    color: courseLearningTheme.accent,
                                }}
                            />
                        )}
                    </Box>
                    {subtitle && (
                        <Typography variant="caption" sx={{ color: courseLearningTheme.textBody, lineHeight: 1.45 }}>
                            {subtitle}
                        </Typography>
                    )}
                    {footer && <Box sx={{ mt: 'auto', pt: 1 }}>{footer}</Box>}
                </Box>
            </Box>
        );
    }

    return (
        <Box
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : -1}
            onClick={handleActivate}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && interactive) {
                    e.preventDefault();
                    handleActivate();
                }
            }}
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 2,
                borderRadius: 2,
                border: courseLearningTheme.tileBorder(disabled),
                bgcolor: courseLearningTheme.tileBg,
                cursor: interactive ? 'pointer' : 'default',
                opacity: disabled ? 0.55 : 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
                width: '100%',
                minHeight: 88,
                outline: 'none',
                boxSizing: 'border-box',
                '&:hover': interactive
                    ? {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 20px ${alpha(courseLearningTheme.accent, 0.25)}`,
                      }
                    : undefined,
                '&:focus-visible': { boxShadow: courseLearningTheme.focusRing },
            }}
        >
            {icon && (
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        bgcolor: alpha(courseLearningTheme.accent, 0.15),
                        color: courseLearningTheme.accent,
                        '& svg': { fontSize: 26 },
                    }}
                >
                    {icon}
                </Box>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: courseLearningTheme.accent, lineHeight: 1.3 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: courseLearningTheme.textBody, lineHeight: 1.45 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default CourseLearningTile;
