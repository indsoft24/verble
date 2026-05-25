// src/pages/static/AboutUsPage.tsx
import React from 'react';
import {
    Box,
    Button,
    Chip,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography,
    useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MicIcon from '@mui/icons-material/Mic';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

import LandingSection from '../../components/landing/LandingSection';
import LandingContainer from '../../components/landing/LandingContainer';
import Reveal from '../../components/landing/Reveal';
import { CARD_BORDER_RADIUS, CARD_GAP, CARD_HOVER_LIFT, CARD_PADDING, SPACING, TYPO } from '../../landing/designSystem';

/** Pexels — same URL pattern as `LandingPage.tsx` */
const ABOUT_STOCK_IMAGES = {
    hero: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2',
    whatIs: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1000&h=700&dpr=2',
    scenarios: 'https://images.pexels.com/photos/7092613/pexels-photo-7092613.jpeg?auto=compress&cs=tinysrgb&w=1400&h=600&dpr=2',
} as const;

const FeatureCard = ({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={0}
            sx={{
                p: CARD_PADDING,
                borderRadius: CARD_BORDER_RADIUS + 2,
                height: '100%',
                minHeight: 160,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.2)' : 'rgba(226,232,240,0.95)'}`,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.6)' : '#FFFFFF',
                boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    transform: `translateY(${CARD_HOVER_LIFT}px)`,
                    boxShadow: '0 12px 40px rgba(15,23,42,0.1)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: SPACING.sm }}>
                <Box sx={{ color: '#4F46E5', mr: SPACING.sm, fontSize: '1.75rem', flexShrink: 0 }}>{icon}</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: TYPO.subtitle, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#0F172A' }}>
                    {title}
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: TYPO.lineHeightBody, fontSize: TYPO.bodySmall }}>
                {description}
            </Typography>
        </Paper>
    );
};

const AboutUsPage: React.FC = () => {
    const theme = useTheme();
    const textMuted = theme.palette.mode === 'dark' ? 'rgba(226,232,240,0.82)' : '#4B5563';
    const headingColor = theme.palette.mode === 'dark' ? '#F9FAFB' : '#0F172A';

    const whyVerbleWorks = [
        'Proven for Indians: Hinglish support, short sessions (5 mins/day)',
        'Lifetime Access of Full Course once purchased',
        'Results-Driven: 10k+ learners; real testimonials',
    ];

    const coreFeatures = [
        {
            icon: <MicIcon />,
            title: 'Pronunciation Polish',
            description: 'Master clear pronunciation with AI-powered feedback and practice tools.',
        },
        {
            icon: <PsychologyIcon />,
            title: 'Grammar Intuition',
            description: 'Learn grammar naturally through practical examples, not complex rules.',
        },
        {
            icon: <TranslateIcon />,
            title: 'Cultural Fluency',
            description: 'Understand context and cultural nuances for real-world conversations.',
        },
        {
            icon: <TrendingUpIcon />,
            title: 'Progress Tracking',
            description: 'Monitor your improvement with detailed analytics and milestones.',
        },
        {
            icon: <RecordVoiceOverIcon />,
            title: 'Voice Recording',
            description: 'Practice speaking and get instant feedback on your pronunciation.',
        },
        {
            icon: <AutoAwesomeIcon />,
            title: 'AI Tips',
            description: 'Personalized learning suggestions powered by artificial intelligence.',
        },
    ];

    const practicalScenarios = [
        'Bargaining at markets',
        'Acing job interviews',
        'Chatting at family events',
        'Office conversations',
        'Wedding celebrations',
        'Daily street interactions',
    ];

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Hero — two columns + stock image (landing style) */}
            <LandingSection bgcolor={theme.palette.mode === 'dark' ? '#020617' : '#FFFFFF'}>
                <LandingContainer>
                    <Reveal>
                        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
                                <Typography
                                    component="h1"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { xs: '2rem', md: '2.75rem' },
                                        lineHeight: 1.1,
                                        letterSpacing: '-0.03em',
                                        color: headingColor,
                                        mb: SPACING.sm,
                                    }}
                                >
                                    About Verble
                                </Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: TYPO.subtitle,
                                        color: '#4F46E5',
                                        mb: SPACING.md,
                                    }}
                                >
                                    &ldquo;Speak English. Live Freely.&rdquo;
                                </Typography>
                                <Typography sx={{ color: textMuted, lineHeight: 1.7, mb: SPACING.lg, maxWidth: 520 }}>
                                    Verble exists to break the English barrier for millions of non-native speakers in India. We deliver simple, survival English that works in streets, offices, and weddings –
                                    turning hesitation into confidence.
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: SPACING.md }}>
                                    <Chip
                                        label="No Complex Grammar"
                                        sx={{
                                            bgcolor: 'rgba(79,70,229,0.1)',
                                            color: '#4338CA',
                                            fontWeight: 600,
                                            border: '1px solid rgba(79,70,229,0.2)',
                                        }}
                                    />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: headingColor }}>
                                    Just speak fluently in 30 days.
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
                                <Box
                                    sx={{
                                        borderRadius: CARD_BORDER_RADIUS + 2,
                                        overflow: 'hidden',
                                        boxShadow: '0 24px 60px rgba(15,23,42,0.12)',
                                        border: '1px solid rgba(226,232,240,0.9)',
                                        lineHeight: 0,
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={ABOUT_STOCK_IMAGES.hero}
                                        alt="Team collaboration and learning"
                                        loading="eager"
                                        sx={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            aspectRatio: '600 / 400',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Reveal>
                </LandingContainer>
            </LandingSection>

            {/* What is Verble + Mission */}
            <LandingSection bgcolor={theme.palette.mode === 'dark' ? '#0F172A' : '#F9FAFB'}>
                <LandingContainer>
                    <Grid container spacing={CARD_GAP} alignItems="stretch">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Reveal delay={60}>
                                <Box
                                    sx={{
                                        borderRadius: CARD_BORDER_RADIUS + 2,
                                        overflow: 'hidden',
                                        height: '100%',
                                        minHeight: 280,
                                        boxShadow: '0 18px 45px rgba(15,23,42,0.08)',
                                        border: '1px solid rgba(226,232,240,0.9)',
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={ABOUT_STOCK_IMAGES.whatIs}
                                        alt="Learning with Verble"
                                        loading="lazy"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            minHeight: 280,
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                </Box>
                            </Reveal>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Reveal delay={100}>
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: TYPO.sectionTitle,
                                            letterSpacing: '-0.03em',
                                            color: headingColor,
                                            mb: SPACING.md,
                                        }}
                                    >
                                        What is Verble?
                                    </Typography>
                                    <Typography sx={{ mb: SPACING.md, lineHeight: 1.7, color: textMuted }}>
                                        Verble is your <strong>mobile-first web app</strong> for bite-sized English mastery. Free tier for basics; Bronze/Silver/Gold for advanced practice.
                                    </Typography>
                                    <Typography sx={{ mb: SPACING.lg, lineHeight: 1.7, color: textMuted }}>
                                        Built by a <strong>15 years MNC professional</strong> passionate about EdTech – blending AI, daily habits, and cultural scenarios.
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: SPACING.xl }}>
                                        <Chip icon={<SmartphoneIcon />} label="Mobile-First" size="small" sx={{ fontWeight: 600 }} />
                                        <Chip icon={<AccessTimeIcon />} label="5 Mins/Day" size="small" sx={{ fontWeight: 600 }} />
                                        <Chip icon={<WorkspacePremiumIcon />} label="15 Years Experience" size="small" sx={{ fontWeight: 600 }} />
                                    </Box>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: SPACING.lg,
                                            borderRadius: CARD_BORDER_RADIUS + 1,
                                            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.2)' : '#E5E7EB'}`,
                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.5)' : '#FFFFFF',
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: 700, mb: SPACING.sm, color: '#4F46E5' }}>Our Mission</Typography>
                                        <Typography sx={{ lineHeight: 1.7, color: textMuted, mb: SPACING.md }}>
                                            To empower millions of Indians to speak English confidently in real-life situations, breaking down language barriers that hold them back.
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <PeopleIcon sx={{ fontSize: 36, color: '#22C55E' }} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#22C55E' }}>10,000+</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Active Learners
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Box>
                            </Reveal>
                        </Grid>
                    </Grid>
                </LandingContainer>
            </LandingSection>

            {/* Core Content */}
            <LandingSection bgcolor={theme.palette.mode === 'dark' ? '#020617' : '#FFFFFF'}>
                <LandingContainer>
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: { xs: SPACING.xl, md: SPACING.xxl } }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 800,
                                    fontSize: TYPO.sectionTitle,
                                    letterSpacing: '-0.03em',
                                    color: headingColor,
                                    mb: SPACING.md,
                                }}
                            >
                                Core Content & How It Helps
                            </Typography>
                            <Typography sx={{ color: textMuted, maxWidth: 640, mx: 'auto', lineHeight: 1.7 }}>
                                Verble creates daily, actionable content tailored for beginners. Users gain pronunciation polish, grammar intuition, and cultural fluency –
                                transforming shy speakers into pros.
                            </Typography>
                        </Box>
                    </Reveal>
                    <Grid container spacing={2}>
                        {coreFeatures.map((feature, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Reveal delay={index * 40}>
                                    <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
                                </Reveal>
                            </Grid>
                        ))}
                    </Grid>
                </LandingContainer>
            </LandingSection>

            {/* Practical scenarios — stock background + overlay */}
            <Box
                sx={{
                    position: 'relative',
                    py: { xs: 6, md: 8 },
                    px: { xs: 2, sm: 2, md: 3 },
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `linear-gradient(125deg, rgba(2,6,23,0.92), rgba(15,23,42,0.88)), url(${ABOUT_STOCK_IMAGES.scenarios})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <LandingContainer sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <TranslateIcon sx={{ fontSize: 44, mb: 1.5, color: '#A5B4FC' }} />
                        <Typography variant="h2" sx={{ fontWeight: 800, fontSize: TYPO.sectionTitle, color: '#F9FAFB', mb: 1.5 }}>
                            Practical Phrases for Real Indian Life
                        </Typography>
                        <Typography sx={{ color: 'rgba(226,232,240,0.82)', maxWidth: 520, mx: 'auto' }}>
                            Hinglish support ensures every learner succeeds.
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {practicalScenarios.map((scenario, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        bgcolor: 'rgba(255,255,255,0.08)',
                                        borderRadius: 1.5,
                                        textAlign: 'center',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'background 0.2s ease',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                                    }}
                                >
                                    <CheckCircleIcon sx={{ mb: 1, fontSize: 26, color: '#86EFAC' }} />
                                    <Typography sx={{ fontWeight: 600, color: '#F9FAFB', fontSize: TYPO.bodySmall, lineHeight: 1.5 }}>
                                        {scenario}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </LandingContainer>
            </Box>

            {/* Why Verble Works */}
            <LandingSection bgcolor={theme.palette.mode === 'dark' ? '#0F172A' : '#F9FAFB'}>
                <LandingContainer>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <StarIcon sx={{ fontSize: 44, color: '#FACC15', mb: 1.5 }} />
                        <Typography variant="h2" sx={{ fontWeight: 800, fontSize: TYPO.sectionTitle, color: headingColor }}>
                            Why Verble Works
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }} sx={{ mx: 'auto' }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: SPACING.xl,
                                    borderRadius: CARD_BORDER_RADIUS + 2,
                                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.2)' : '#E5E7EB'}`,
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.6)' : '#FFFFFF',
                                    boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
                                }}
                            >
                                <List dense disablePadding>
                                    {whyVerbleWorks.map((item, index) => (
                                        <ListItem key={index} sx={{ py: 1.25, alignItems: 'flex-start' }}>
                                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                                <CheckCircleIcon color="success" sx={{ fontSize: 24 }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item}
                                                primaryTypographyProps={{
                                                    variant: 'body1',
                                                    sx: { fontWeight: 500, lineHeight: 1.65, color: textMuted },
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    </Grid>
                </LandingContainer>
            </LandingSection>

            {/* CTA */}
            <LandingSection bgcolor={theme.palette.mode === 'dark' ? '#020617' : '#FFFFFF'}>
                <LandingContainer>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, md: 5 },
                            borderRadius: 4,
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 45%, #7C3AED 100%)',
                            color: '#fff',
                            boxShadow: '0 20px 50px rgba(79,70,229,0.25)',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    >
                        <Typography variant="h2" sx={{ fontWeight: 800, fontSize: TYPO.sectionTitle, mb: 2 }}>
                            Join the Fluency Revolution
                        </Typography>
                        <Typography sx={{ mb: 3.5, opacity: 0.95, maxWidth: 520, mx: 'auto', lineHeight: 1.65 }}>
                            Start free today and transform your English speaking confidence in just 30 days.
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                bgcolor: '#FFFFFF',
                                color: '#4F46E5',
                                px: 3,
                                py: 1.25,
                                fontWeight: 700,
                                borderRadius: 2,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                '&:hover': {
                                    bgcolor: '#F3F4F6',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Get Started Free
                        </Button>
                    </Paper>
                </LandingContainer>
            </LandingSection>
        </Box>
    );
};

export default AboutUsPage;
