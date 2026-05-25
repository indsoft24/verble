import React from 'react';
import { Box, Grid, Typography, alpha, useTheme } from '@mui/material';

export type MembershipSectionTier = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE';

const sectionTheme: Record<
    MembershipSectionTier,
    { gradient: string; subtitle: string; chip: string }
> = {
    FREE: {
        gradient: 'linear-gradient(120deg, #0f766e 0%, #14b8a6 55%, #5eead4 100%)',
        subtitle: 'Start every day here — vocabulary & phrases',
        chip: 'Free access',
    },
    BRONZE: {
        gradient: 'linear-gradient(120deg, #9a3412 0%, #ea580c 50%, #fb923c 100%)',
        subtitle: 'Short reads & themed vocabulary',
        chip: '30-day challenge',
    },
    SILVER: {
        gradient: 'linear-gradient(120deg, #1e3a5f 0%, #3b82f6 45%, #93c5fd 100%)',
        subtitle: 'Conversations & daily puzzles',
        chip: '60-day bronze track',
    },
    GOLD: {
        gradient: 'linear-gradient(120deg, #713f12 0%, #ca8a04 42%, #fcd34d 100%)',
        subtitle: 'Immersive media, scenes & professional English',
        chip: 'Gold subscription',
    },
    FULL_COURSE: {
        gradient: 'linear-gradient(120deg, #4c1d95 0%, #7c3aed 48%, #c4b5fd 100%)',
        subtitle: 'Structured modules, video path & certificate track',
        chip: 'Full course purchase',
    },
};

export interface DashboardMembershipSectionProps {
    tier: MembershipSectionTier;
    title: string;
    /** Optional override for header gradient */
    headerGradient?: string;
    children: React.ReactNode;
}

const DashboardMembershipSection: React.FC<DashboardMembershipSectionProps> = ({ tier, title, headerGradient, children }) => {
    const theme = useTheme();
    const t = sectionTheme[tier];
    const grad = headerGradient || t.gradient;

    return (
        <Box
            sx={{
                mb: { xs: 3, md: 4 },
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: (th) => th.shadows[2],
            }}
        >
            <Box
                sx={{
                    px: { xs: 2, sm: 2.5, md: 3 },
                    py: { xs: 2, md: 2.25 },
                    background: grad,
                    color: 'common.white',
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, transparent 40%)',
                        pointerEvents: 'none',
                    },
                }}
            >
                <Typography
                    variant="overline"
                    sx={{
                        fontWeight: 800,
                        letterSpacing: 1.2,
                        opacity: 0.95,
                        display: 'block',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {t.chip}
                </Typography>
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: 900,
                        mt: 0.25,
                        fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
                        textShadow: '0 1px 12px rgba(0,0,0,0.18)',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        mt: 0.5,
                        opacity: 0.95,
                        maxWidth: 720,
                        lineHeight: 1.5,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {t.subtitle}
                </Typography>
            </Box>
            <Box
                sx={{
                    px: { xs: 1.5, sm: 2, md: 2.5 },
                    py: { xs: 2, md: 2.5 },
                    bgcolor: alpha(theme.palette.grey[50], theme.palette.mode === 'dark' ? 0.06 : 1),
                }}
            >
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                    {children}
                </Grid>
            </Box>
        </Box>
    );
};

export default DashboardMembershipSection;
