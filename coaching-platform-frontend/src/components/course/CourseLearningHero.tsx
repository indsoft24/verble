import React from 'react';
import { Box, Typography } from '@mui/material';
import { courseLearningTheme } from './courseLearningTheme';

export interface CourseLearningHeroProps {
    imageUrl?: string;
    imageAlt?: string;
    title: string;
    subtitle?: string;
    meta?: React.ReactNode;
    description?: React.ReactNode;
    descriptionDesktop?: React.ReactNode;
    onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const CourseLearningHero: React.FC<CourseLearningHeroProps> = ({
    imageUrl,
    imageAlt,
    title,
    subtitle,
    meta,
    description,
    descriptionDesktop,
    onImageError,
}) => {
    const hasSplitDesc = Boolean(description && descriptionDesktop);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { md: 'stretch' },
                gap: { xs: courseLearningTheme.gridGap, md: 2.5 },
                width: '100%',
            }}
        >
            {imageUrl && (
                <Box
                    sx={{
                        flexShrink: 0,
                        width: { xs: '100%', md: 300, lg: 380 },
                        minHeight: { xs: 140, md: 220 },
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        bgcolor: courseLearningTheme.surfaceRaised,
                    }}
                >
                    <Box
                        component="img"
                        src={imageUrl}
                        alt={imageAlt || title}
                        onError={onImageError}
                        sx={{ width: '100%', height: '100%', minHeight: { md: 220 }, objectFit: 'cover', display: 'block' }}
                    />
                </Box>
            )}
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: courseLearningTheme.space.gap,
                }}
            >
                {subtitle && (
                    <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted, lineHeight: 1.4 }}>
                        {subtitle}
                    </Typography>
                )}
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 800,
                        lineHeight: 1.25,
                        color: courseLearningTheme.textPrimary,
                        fontSize: { xs: '1.2rem', md: '1.45rem', lg: '1.6rem' },
                    }}
                >
                    {title}
                </Typography>
                {meta && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: courseLearningTheme.space.gap }}>{meta}</Box>}
                {hasSplitDesc ? (
                    <>
                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>{description}</Box>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>{descriptionDesktop}</Box>
                    </>
                ) : (
                    (description || descriptionDesktop) && <Box>{description || descriptionDesktop}</Box>
                )}
            </Box>
        </Box>
    );
};

export default CourseLearningHero;
