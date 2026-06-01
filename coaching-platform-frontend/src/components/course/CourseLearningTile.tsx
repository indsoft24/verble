import React from 'react';
import { Box, Typography, Chip, alpha } from '@mui/material';
import { courseLearningTheme } from './courseLearningTheme';

export interface CourseLearningTileProps {
    title: string;
    subtitle?: string;
    /** Extra lines shown on md+ (desktop horizontal layout). */
    subtitleDesktop?: string;
    icon?: React.ReactNode;
    imageUrl?: string;
    onClick?: () => void;
    variant?: 'row' | 'card';
    badgeLabel?: string;
    disabled?: boolean;
    footer?: React.ReactNode;
    meta?: React.ReactNode;
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
    subtitleDesktop,
    meta,
}) => {
    const interactive = !disabled && !!onClick;

    const handleActivate = () => {
        if (interactive && onClick) onClick();
    };

    if (variant === 'card') {
        const hasSplitDesc = Boolean(subtitle && subtitleDesktop);
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
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { md: 'stretch' },
                    borderRadius: 2,
                    border: courseLearningTheme.tileBorder(disabled),
                    bgcolor: courseLearningTheme.tileBg,
                    overflow: 'hidden',
                    cursor: interactive ? 'pointer' : 'default',
                    opacity: disabled ? 0.55 : 1,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    width: '100%',
                    outline: 'none',
                    '&:hover': interactive
                        ? {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 20px ${alpha(courseLearningTheme.accent, 0.22)}`,
                          }
                        : undefined,
                    '&:focus-visible': { boxShadow: courseLearningTheme.focusRing },
                }}
            >
                {imageUrl && (
                    <Box
                        sx={{
                            aspectRatio: { xs: '16 / 9', md: 'auto' },
                            width: { xs: '100%', md: 300, lg: 380 },
                            minHeight: { md: 220 },
                            flexShrink: 0,
                            backgroundImage: `url("${imageUrl}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            bgcolor: alpha(courseLearningTheme.accent, 0.12),
                        }}
                    />
                )}
                <Box
                    sx={{
                        p: { xs: 2, md: 2.5, lg: 3 },
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: { xs: 1, md: 1.25 },
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 800,
                                color: courseLearningTheme.textPrimary,
                                lineHeight: 1.3,
                                flex: 1,
                                minWidth: 0,
                                fontSize: { xs: '1rem', md: '1.2rem' },
                            }}
                        >
                            {title}
                        </Typography>
                        {badgeLabel && (
                            <Chip
                                label={badgeLabel}
                                size="small"
                                variant="outlined"
                                sx={{
                                    height: 24,
                                    fontSize: '0.7rem',
                                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                                    color: courseLearningTheme.accent,
                                }}
                            />
                        )}
                    </Box>
                    {meta && (
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>{meta}</Box>
                    )}
                    {hasSplitDesc ? (
                        <>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: courseLearningTheme.textBody,
                                    lineHeight: 1.55,
                                    display: { xs: '-webkit-box', md: 'none' },
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {subtitle}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: courseLearningTheme.textBody,
                                    lineHeight: 1.55,
                                    display: { xs: 'none', md: '-webkit-box' },
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {subtitleDesktop}
                            </Typography>
                        </>
                    ) : (
                        (subtitle || subtitleDesktop) && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: courseLearningTheme.textBody,
                                    lineHeight: 1.55,
                                    display: '-webkit-box',
                                    WebkitLineClamp: { xs: 2, md: 4 },
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {subtitle || subtitleDesktop}
                            </Typography>
                        )
                    )}
                    {footer && (
                        <Box
                            sx={{ mt: 'auto', pt: { xs: 1.25, md: 2 } }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {footer}
                        </Box>
                    )}
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
                          boxShadow: `0 6px 20px ${alpha(courseLearningTheme.accent, 0.22)}`,
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
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: courseLearningTheme.textPrimary, lineHeight: 1.3 }}>
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
