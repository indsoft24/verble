import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography } from '@mui/material';
import Reveal from './Reveal';
import LandingContainer from './LandingContainer';
import { SECTION_PADDING_Y, SECTION_PADDING_X, TYPO, SPACING } from '../../landing/designSystem';

const TrustMarquee: React.FC = () => {
    const { t } = useTranslation();
    const marqueeItems = useMemo(() => {
        const raw = t('landing.marqueeItems', { returnObjects: true });
        return Array.isArray(raw) ? (raw as string[]) : [];
    }, [t]);

    return (
    <Box
        component="section"
        sx={{
            py: { xs: SECTION_PADDING_Y.xs, sm: SECTION_PADDING_Y.sm, md: SECTION_PADDING_Y.md },
            px: SECTION_PADDING_X,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#020617' : '#F9FAFB'),
        }}
    >
        <LandingContainer>
            <Reveal>
                <Stack spacing={SPACING.lg} alignItems="center">
                    <Typography
                        variant="body2"
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: '0.18em',
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: TYPO.bodySmall,
                        }}
                    >
                        {t('landing.marqueeHeading')}
                    </Typography>
                    <Box
                        sx={{
                            width: '100%',
                            overflow: 'hidden',
                            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                gap: SPACING.xxl,
                                whiteSpace: 'nowrap',
                                animation: 'marquee 26s linear infinite',
                                '@keyframes marquee': {
                                    '0%': { transform: 'translateX(0)' },
                                    '100%': { transform: 'translateX(-50%)' },
                                },
                            }}
                        >
                            {[...marqueeItems, ...marqueeItems].map((label, i) => (
                                <Typography
                                    key={`${label}-${i}`}
                                    variant="body2"
                                    sx={{ color: 'text.secondary', fontWeight: 500, fontSize: TYPO.bodySmall }}
                                >
                                    {label}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                </Stack>
            </Reveal>
        </LandingContainer>
    </Box>
    );
};

export default TrustMarquee;
