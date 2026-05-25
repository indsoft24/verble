import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Chip, Grid, Stack, Typography, Box, useTheme } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import InsightsIcon from '@mui/icons-material/Insights';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimelineIcon from '@mui/icons-material/Timeline';
import MicIcon from '@mui/icons-material/Mic';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import Reveal from './Reveal';
import LandingSection from './LandingSection';
import LandingContainer from './LandingContainer';
import {
    CARD_PADDING,
    CARD_GAP,
    CARD_BORDER_RADIUS,
    CARD_HOVER_LIFT,
    TYPO,
    SPACING,
} from '../../landing/designSystem';

const FEATURES = [
    {
        icon: CampaignIcon,
        titleKey: 'features.aiSpeechWritingTitle',
        descKey: 'features.aiSpeechWritingDesc',
        image:
            'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2'
    },
    {
        icon: InsightsIcon,
        titleKey: 'features.audienceAnalysisTitle',
        descKey: 'features.audienceAnalysisDesc',
        image:
            'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2'
    },
    {
        icon: AutoAwesomeIcon,
        titleKey: 'features.persuasionFrameworksTitle',
        descKey: 'features.persuasionFrameworksDesc',
        image:
            'https://images.pexels.com/photos/1181359/pexels-photo-1181359.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2'
    },
    {
        icon: TimelineIcon,
        titleKey: 'features.storytellingTemplatesTitle',
        descKey: 'features.storytellingTemplatesDesc',
        image:
            'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2'
    },
    {
        icon: MicIcon,
        titleKey: 'features.publicSpeakingCoachTitle',
        descKey: 'features.publicSpeakingCoachDesc',
        image:
            'https://images.pexels.com/photos/1708936/pexels-photo-1708936.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2'
    },
    {
        icon: WorkOutlineIcon,
        titleKey: 'features.presentationBuilderTitle',
        descKey: 'features.presentationBuilderDesc',
        image:
            'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2'
    },
];

const Features: React.FC = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    return (
    <LandingSection bgcolor={theme.palette.mode === 'dark' ? '#020617' : '#F9FAFB'}>
        <LandingContainer>
            <Reveal>
                <Stack spacing={SPACING.lg} alignItems="center" sx={{ mb: 6 }}>
                    <Chip
                        label={t('features.chip')}
                        size="small"
                        sx={{
                            borderRadius: '999px',
                            bgcolor: 'rgba(15,23,42,0.85)',
                            color: '#E5E7EB',
                            border: '1px solid rgba(148,163,184,0.5)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 800,
                            fontSize: TYPO.sectionTitle,
                            letterSpacing: '-0.04em',
                            textAlign: 'center',
                        }}
                    >
                        {t('features.heading')}
                    </Typography>
                    <Typography
                        sx={{
                            color: 'text.secondary',
                            fontSize: TYPO.body,
                            lineHeight: TYPO.lineHeightBody,
                            maxWidth: 520,
                            textAlign: 'center',
                        }}
                    >
                        {t('features.subheading')}
                    </Typography>
                </Stack>
            </Reveal>
            <Grid container spacing={CARD_GAP}>
                {FEATURES.map((feature, index) => (
                    <Grid key={feature.titleKey} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Reveal delay={index * 60}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: '100%',
                                    minHeight: { xs: 300, sm: 320 },
                                    borderRadius: CARD_BORDER_RADIUS,
                                    p: CARD_PADDING,
                                    bgcolor: (theme) =>
                                        theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.9)' : '#FFFFFF',
                                    borderColor: (theme) =>
                                        theme.palette.mode === 'dark' ? 'rgba(31,41,55,1)' : 'rgba(209,213,219,1)',
                                    boxShadow: '0 18px 45px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.9)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        boxShadow:
                                            '0 24px 70px rgba(15,23,42,0.35), 0 0 0 1px rgba(129,140,248,0.4)',
                                        transform: `translateY(${CARD_HOVER_LIFT}px)`,
                                        '& .feature-glow': { opacity: 1 },
                                    },
                                }}
                            >
                                <Box
                                    className="feature-glow"
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        background:
                                            'radial-gradient(circle at top left, rgba(91,108,255,0.4), transparent 60%)',
                                        opacity: 0,
                                        pointerEvents: 'none',
                                        transition: 'opacity 0.2s ease',
                                    }}
                                />
                                <Stack spacing={SPACING.sm} sx={{ position: 'relative' }}>
                                    <Box
                                        sx={{
                                            borderRadius: CARD_BORDER_RADIUS - 4,
                                            height: { xs: 132, sm: 146, md: 152 },
                                            width: '100%',
                                            mb: SPACING.sm,
                                            backgroundImage:
                                                `linear-gradient(rgba(15,23,42,0.38), rgba(15,23,42,0.58)), url(${feature.image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: CARD_BORDER_RADIUS,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'rgba(91,108,255,0.12)',
                                            color: '#C7D2FE',
                                        }}
                                    >
                                        <feature.icon sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: TYPO.subtitle }}>
                                        {t(feature.titleKey)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: TYPO.bodySmall }}>
                                        {t(feature.descKey)}
                                    </Typography>
                                </Stack>
                            </Card>
                        </Reveal>
                    </Grid>
                ))}
            </Grid>
        </LandingContainer>
    </LandingSection>
    );
};

export default Features;
