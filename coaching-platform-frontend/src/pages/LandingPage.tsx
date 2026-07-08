// src/pages/LandingPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useStartFreeNavigation } from '../hooks/useStartFreeNavigation';
import {
    Container,
    Box,
    Typography,
    Grid,
    Button,
    Card,
    Paper,
    Chip,
    Checkbox,
    Divider,
    Stack,
    Avatar,
    alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TranslateIcon from '@mui/icons-material/Translate';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WorkIcon from '@mui/icons-material/Work';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { brandAssets } from '../assets/brandAssets';
import FullCourseSyllabusSection from '../components/marketing/FullCourseSyllabusSection';
import LandingPricingSection from '../components/marketing/LandingPricingSection';
import PlanPriceOffer from '../components/marketing/PlanPriceOffer';
import DocumentHead from '../components/seo/DocumentHead';
import { canonicalForPath, HOME_PAGE_SEO } from '../config/siteSeo';
import { getActiveSubscriptionPlans } from '../services/subscriptionPlanService';
import { findPlanByNameMatches, getPlanOfferLabels, PLAN_NAME_MATCHERS } from '../utils/planPriceFormat';

const heroPatternIcons = [
    MenuBookOutlinedIcon,
    MicNoneOutlinedIcon,
    LanguageOutlinedIcon,
    LightbulbOutlinedIcon,
];

const trustedProfessions = [
    { label: 'BANKING', icon: AccountBalanceIcon },
    { label: 'TEACHING', icon: SchoolIcon },
    { label: 'JOBS', icon: WorkIcon },
    { label: 'BUSINESS', icon: BusinessCenterIcon },
    { label: 'SELF-EMPLOYED', icon: StorefrontIcon },
] as const;

type MasterTierStat = { value: string; label: string };
type MasterTierFeature = { title: string; detail: string };

/** Section headings — readable on mobile without dominating the viewport */
const landingSectionTitleSx = {
    fontWeight: 800,
    color: '#0f172a',
    fontSize: { xs: '1.375rem', sm: '1.625rem', md: '2.25rem' },
    lineHeight: { xs: 1.3, md: 1.2 },
    mb: { xs: 1, md: 2 },
    px: { xs: 0.5, sm: 0 },
} as const;

const landingSectionSubtitleSx = {
    color: '#64748b',
    fontWeight: 400,
    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
    lineHeight: 1.55,
    maxWidth: 640,
    mx: 'auto',
    px: { xs: 1, sm: 0 },
} as const;

/** Tighter vertical rhythm on mobile home page */
const landingSectionPy = { xs: 3, sm: 5, md: 10 } as const;
const landingSectionHeaderMb = { xs: 2, sm: 3, md: 6 } as const;

type MasterTierCardProps = {
    badge: string;
    headerIcon: React.ReactNode;
    title: string;
    subtitle: string;
    stats: MasterTierStat[];
    features: MasterTierFeature[];
    offerPriceLabel: string;
    originalPriceLabel?: string | null;
    ctaLabel: string;
    ctaTo: string;
    ctaTextColor: string;
    gradient: string;
    boxShadow: string;
};

const MasterTierCard: React.FC<MasterTierCardProps> = ({
    badge,
    headerIcon,
    title,
    subtitle,
    stats,
    features,
    offerPriceLabel,
    originalPriceLabel,
    ctaLabel,
    ctaTo,
    ctaTextColor,
    gradient,
    boxShadow,
}) => (
    <Card
        elevation={4}
        sx={{
            p: { xs: 3, sm: 2.75, md: 3 },
            borderRadius: { xs: '16px', md: '20px' },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: gradient,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow,
        }}
    >
        <Box
            sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 160,
                height: 160,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                pointerEvents: 'none',
            }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
            <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: { xs: 1.75, md: 2.5 } }}
            >
                <Chip
                    label={badge}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.18)',
                        color: 'white',
                        fontWeight: 700,
                        height: 'auto',
                        maxWidth: 'calc(100% - 52px)',
                        '& .MuiChip-label': {
                            whiteSpace: 'normal',
                            px: 1.25,
                            py: 0.5,
                            lineHeight: 1.3,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        },
                    }}
                />
                <Box
                    sx={{
                        width: { xs: 40, md: 44 },
                        height: { xs: 40, md: 44 },
                        flexShrink: 0,
                        borderRadius: '12px',
                        bgcolor: 'rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {headerIcon}
                </Box>
            </Stack>

            <Box
                sx={{
                    mb: { xs: 1.5, md: 2 },
                    p: { xs: 1.25, md: 1.5 },
                    borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.14)',
                }}
            >
                <PlanPriceOffer
                    offerLabel={offerPriceLabel}
                    originalLabel={originalPriceLabel}
                    variant="onDark"
                    size="lg"
                />
            </Box>

            <Typography
                variant="h5"
                sx={{
                    fontWeight: 800,
                    mb: 0.75,
                    lineHeight: 1.25,
                    fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.5rem' },
                    pr: 0.5,
                }}
            >
                {title}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    opacity: 0.92,
                    lineHeight: 1.55,
                    mb: { xs: 2, md: 3 },
                    fontSize: { xs: '0.78rem', sm: '0.85rem', md: '0.875rem' },
                }}
            >
                {subtitle}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: { xs: 0.5, md: 1 },
                    p: { xs: 1.25, sm: 1.5, md: 2 },
                    mb: { xs: 2, md: 3 },
                    borderRadius: '14px',
                    bgcolor: 'rgba(255,255,255,0.12)',
                }}
            >
                {stats.map((stat) => (
                    <Box key={stat.label} sx={{ textAlign: 'center', minWidth: 0, px: 0.25 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 800,
                                lineHeight: 1.2,
                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                            }}
                        >
                            {stat.value}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.88,
                                display: 'block',
                                mt: 0.25,
                                lineHeight: 1.25,
                                fontSize: { xs: '0.62rem', sm: '0.68rem', md: '0.75rem' },
                                wordBreak: 'break-word',
                            }}
                        >
                            {stat.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Stack spacing={{ xs: 1.5, md: 2.25 }} sx={{ flex: 1 }}>
                {features.map((feature) => (
                    <Box key={feature.title} sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 } }}>
                        <CheckCircleIcon
                            sx={{ fontSize: { xs: 18, md: 22 }, mt: 0.2, flexShrink: 0, opacity: 0.95 }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: 600,
                                    lineHeight: 1.35,
                                    fontSize: { xs: '0.82rem', sm: '0.875rem', md: '1rem' },
                                }}
                            >
                                {feature.title}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    opacity: 0.85,
                                    mt: 0.35,
                                    lineHeight: 1.5,
                                    fontSize: { xs: '0.72rem', sm: '0.78rem', md: '0.875rem' },
                                }}
                            >
                                {feature.detail}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Stack>

            <Box sx={{ mt: { xs: 2.5, md: 3.5 }, pt: { xs: 2, md: 2.5 }, borderTop: '1px solid rgba(255,255,255,0.22)' }}>
                <Button
                    component={RouterLink}
                    to={ctaTo}
                    variant="contained"
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                        py: { xs: 1.1, md: 1.35 },
                        fontWeight: 700,
                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                        borderRadius: '12px',
                        bgcolor: 'white',
                        color: ctaTextColor,
                        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                        '&:hover': { bgcolor: '#f8fafc' },
                    }}
                >
                    {ctaLabel}
                </Button>
            </Box>
        </Box>
    </Card>
);

const LandingPage: React.FC = () => {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    const [catalogPlans, setCatalogPlans] = useState<Awaited<ReturnType<typeof getActiveSubscriptionPlans>>>([]);
    const handleStartFreeModule = useStartFreeNavigation();

    useEffect(() => {
        getActiveSubscriptionPlans({ includeAll: true })
            .then(setCatalogPlans)
            .catch(() => setCatalogPlans([]));
    }, []);

    const goldPlan = useMemo(
        () => findPlanByNameMatches(catalogPlans, [...PLAN_NAME_MATCHERS.gold]),
        [catalogPlans]
    );
    const fullCoursePlan = useMemo(
        () => findPlanByNameMatches(catalogPlans, [...PLAN_NAME_MATCHERS.fullCourse]),
        [catalogPlans]
    );
    const goldPriceLabels = useMemo(() => (goldPlan ? getPlanOfferLabels(goldPlan) : null), [goldPlan]);
    const fullCoursePriceLabels = useMemo(
        () => (fullCoursePlan ? getPlanOfferLabels(fullCoursePlan) : null),
        [fullCoursePlan]
    );

    const handleCheckboxChange = (index: number) => {
        setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const whoIsThisFor = [
        "I speak Hindi fluently but struggle with English conversations",
        "I want Survival English for daily life (market, auto, office, travel)",
        "I'm a complete beginner needing simple, practical English",
        "I freeze during job interviews or client meetings",
        "I enjoy Hollywood dubbed movies but can't understand in English audio",
        "I want to speak confidently without grammar mistakes",
        "I want to master Office English, airport English, restaurant English needed NOW",
        "I want job interview or travel English but don't know where to start",
        "I am a complete beginner overwhelmed by grammar books",
        "I am a student who would start the career soon",
        "I am a small business owner but want to grow my business by learning English confidently",
        "I want to apply for foreigner visa for study / job in some time",
        "I am housewife and want to grow my confidence and create impact in the social platform like Instagram"
    ];

    const provenResults = [
        { icon: <SchoolIcon />, title: "Word of the Day", desc: "Daily Vocabulary", color: "#4CAF50" },
        { icon: <TranslateIcon />, title: "Phrase of the Day", desc: "Ready Conversations", color: "#2196F3" },
        { icon: <VideoLibraryIcon />, title: "One Minute Reads", desc: "Reading Fluency", color: "#FF9800" },
        { icon: <QuizIcon />, title: "Spot Correct Sentence", desc: "Grammar Mastery", color: "#9C27B0" },
        { icon: <AutoAwesomeIcon />, title: "Verb Fill Blanks", desc: "Tense Perfection", color: "#F44336" },
        { icon: <RecordVoiceOverIcon />, title: "Voice Practice", desc: "Speaking Confidence", color: "#00BCD4" }
    ];

    const testimonials = [
        { name: "Rakesh S.", location: "Delhi", text: "From zero conversations to leading team meetings in 3 months. Job promotion! Nobody teaches English this practically.", rating: 5 },
        { name: "Priya M.", location: "Pune", text: "Used airport conversations module before USA trip. Handled immigration perfectly. Silver module worth 10x price!", rating: 5 },
        { name: "Amit K.", location: "Bengaluru", text: "Daily puzzles fixed my grammar. Now I negotiate with clients confidently. Best ever investment on self development.", rating: 5 },
        { name: "Raj", location: "Delhi", text: "Verble made English easy – now I negotiate salaries confidently!", rating: 5 },
        { name: "Priya", location: "Haryana", text: "Gold prompts are gold! Practiced wedding speeches perfectly.", rating: 5 },
        { name: "Amit", location: "Small Business Owner", text: "Best for beginners. Hinglish magic!", rating: 5 },
        { name: "Sneha R.", location: "Mumbai", text: "As a housewife, I wanted to build confidence. Verble's daily practice helped me speak confidently at social events!", rating: 5 },
        { name: "Vikram P.", location: "Hyderabad", text: "Preparing for US visa interview. Airport English module was a lifesaver. Got the visa!", rating: 5 },
        { name: "Anjali K.", location: "Chennai", text: "From struggling with basic sentences to giving presentations at work. Verble transformed my career!", rating: 5 }
    ];

    return (
        <Box sx={{ bgcolor: 'background.default', overflow: 'hidden' }}>
            <DocumentHead
                title={HOME_PAGE_SEO.title}
                description={HOME_PAGE_SEO.description}
                canonicalUrl={canonicalForPath(HOME_PAGE_SEO.path)}
                ogImage={HOME_PAGE_SEO.ogImage}
                ogType={HOME_PAGE_SEO.ogType}
            />
            {/* Hero Banner */}
            <Box
                sx={{
                    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 45%, #111827 100%)',
                    color: 'white',
                    pt: { xs: 8, md: 10 },
                    pb: { xs: 6, md: 8 },
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {heroPatternIcons.map((Icon, index) => (
                    <Icon
                        key={index}
                        sx={{
                            position: 'absolute',
                            fontSize: { xs: 48, md: 64 },
                            color: 'rgba(148, 163, 184, 0.12)',
                            top: `${12 + (index % 2) * 28}%`,
                            left: index % 2 === 0 ? `${6 + index * 14}%` : 'auto',
                            right: index % 2 === 1 ? `${4 + index * 10}%` : 'auto',
                            transform: `rotate(${index * 12 - 8}deg)`,
                            pointerEvents: 'none',
                        }}
                    />
                ))}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.04,
                        backgroundImage: `url(${brandAssets.websiteHeroBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        pointerEvents: 'none',
                    }}
                />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Chip
                                    label="Next-Gen AI English Learning"
                                    sx={{
                                        mb: 3,
                                        bgcolor: 'rgba(99, 102, 241, 0.22)',
                                        color: '#e0e7ff',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        px: 2,
                                        py: 2.25,
                                        borderRadius: '999px',
                                        border: '1px solid rgba(129, 140, 248, 0.35)',
                                    }}
                                />
                                <Typography
                                    variant="h2"
                                    component="h1"
                                    sx={{
                                        fontWeight: 800,
                                        mb: 2.5,
                                        fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.25rem' },
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.02em',
                                        color: '#ffffff',
                                        maxWidth: 620,
                                        mx: { xs: 'auto', md: 0 },
                                    }}
                                >
                                    Learn इंग्लिश fluently with AI
                                </Typography>
                                <Typography
                                    variant="h6"
                                    component="p"
                                    sx={{
                                        mb: 4,
                                        fontWeight: 400,
                                        fontSize: { xs: '1.05rem', md: '1.2rem' },
                                        color: '#94a3b8',
                                        lineHeight: 1.65,
                                        maxWidth: 560,
                                        mx: { xs: 'auto', md: 0 },
                                    }}
                                >
                                    Master real-life conversations with our AI Companion. Zero grammar stress. Just
                                    pure, confident speaking in 180 days.
                                </Typography>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                    sx={{ mb: 4, justifyContent: { xs: 'center', md: 'flex-start' } }}
                                >
                                    <Button
                                        onClick={handleStartFreeModule}
                                        variant="contained"
                                        size="large"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: '#6366f1',
                                            color: 'white',
                                            px: 3.5,
                                            py: 1.75,
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.04em',
                                            borderRadius: '10px',
                                            boxShadow: '0 10px 24px rgba(99, 102, 241, 0.35)',
                                            '&:hover': { bgcolor: '#4f46e5' },
                                        }}
                                    >
                                        START FREE MODULE
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/courses"
                                        variant="outlined"
                                        size="large"
                                        sx={{
                                            borderColor: 'rgba(148, 163, 184, 0.5)',
                                            color: 'white',
                                            px: 3.5,
                                            py: 1.75,
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.04em',
                                            borderRadius: '10px',
                                            '&:hover': {
                                                borderColor: '#e2e8f0',
                                                bgcolor: 'rgba(255, 255, 255, 0.06)',
                                            },
                                        }}
                                    >
                                        EXPLORE COURSES
                                    </Button>
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={3}
                                    sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}
                                >
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                                            3k+
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                            Learners
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(148, 163, 184, 0.35)' }} />
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                                            4.9/5
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                            Rating
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(148, 163, 184, 0.35)' }} />
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                                            AI-First
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                            Learning
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box
                                component="img"
                                src={brandAssets.primaryLogo}
                                alt="Verble — अंग्रेजी सीखें आसानी से"
                                sx={{
                                    width: '100%',
                                    maxWidth: 520,
                                    mx: 'auto',
                                    display: 'block',
                                    borderRadius: '12px',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Trusted learners by profession */}
            <Box sx={{ py: { xs: 3, md: 5 }, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="body2"
                        sx={{
                            textAlign: 'center',
                            color: '#94a3b8',
                            mb: 3,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontSize: '0.8rem',
                        }}
                    >
                        TRUSTED LEARNERS FROM ALL PROFESSIONS
                    </Typography>
                    <Grid container spacing={2} justifyContent="center">
                        {trustedProfessions.map(({ label, icon: ProfessionIcon }) => (
                            <Grid key={label} size={{ xs: 6, sm: 4, md: 2.4 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        py: 2,
                                        px: 1.5,
                                        borderRadius: '12px',
                                        bgcolor: '#f5f3ff',
                                        border: '1px solid #ede9fe',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <ProfessionIcon sx={{ fontSize: 28, color: '#7c3aed' }} />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            color: '#6d28d9',
                                            letterSpacing: '0.06em',
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        {label}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Proven Results - Modern Featured Section */}
            <Box sx={{ py: landingSectionPy, bgcolor: '#ffffff' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: landingSectionHeaderMb, maxWidth: 720, mx: 'auto' }}>
                        <Typography variant="h3" sx={landingSectionTitleSx}>
                            Practical Tools for Rapid Learning
                        </Typography>
                        <Typography variant="h6" sx={{ ...landingSectionSubtitleSx, maxWidth: 560 }}>
                            Our platform is built on proven pedagogical methods, enhanced by cutting-edge AI to make learning English natural and fast.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: 'repeat(2, minmax(0, 1fr))',
                                md: 'repeat(3, minmax(0, 1fr))',
                            },
                            gap: { xs: '16px', sm: '18px', md: '24px' },
                            justifyItems: 'stretch',
                            alignItems: 'stretch',
                            width: '100%',
                        }}
                    >
                        {provenResults.map((result) => (
                            <Paper
                                key={result.title}
                                elevation={0}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: { xs: 'center', md: 'flex-start' },
                                    textAlign: { xs: 'center', md: 'left' },
                                    justifyContent: 'flex-start',
                                    minHeight: { xs: 148, sm: 160, md: 'auto' },
                                    height: '100%',
                                    p: { xs: '16px 14px', sm: '18px', md: '24px' },
                                    borderRadius: { xs: 2, md: 3 },
                                    border: '1px solid #e2e8f0',
                                    bgcolor: '#ffffff',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                                    '@media (hover: hover)': {
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.12)',
                                            borderColor: result.color,
                                            '& .feature-icon': {
                                                bgcolor: result.color,
                                                color: '#fff',
                                            },
                                        },
                                    },
                                }}
                            >
                                <Box
                                    className="feature-icon"
                                    sx={{
                                        width: { xs: 44, md: 48 },
                                        height: { xs: 44, md: 48 },
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 2,
                                        mb: { xs: 1, md: 2 },
                                        color: result.color,
                                        bgcolor: alpha(result.color, 0.1),
                                        transition: 'background-color 0.2s ease, color 0.2s ease',
                                        '& .MuiSvgIcon-root': {
                                            fontSize: { xs: 22, md: 26 },
                                        },
                                    }}
                                >
                                    {result.icon}
                                </Box>

                                <Typography
                                    component="h3"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1.0625rem' },
                                        lineHeight: 1.35,
                                        mb: 0.5,
                                        px: { xs: 0.5, md: 0 },
                                        width: '100%',
                                    }}
                                >
                                    {result.title}
                                </Typography>

                                <Typography
                                    sx={{
                                        color: '#64748b',
                                        lineHeight: 1.45,
                                        fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                                        px: { xs: 0.5, md: 0 },
                                        width: '100%',
                                        mt: 'auto',
                                    }}
                                >
                                    {result.desc}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Membership Tiers - Strategic Learning Path */}
            <Box sx={{ py: landingSectionPy, bgcolor: '#f1f5f9' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: landingSectionHeaderMb }}>
                        <Typography variant="h3" sx={landingSectionTitleSx}>
                            Your Path to English Mastery
                        </Typography>
                        <Typography variant="h6" sx={landingSectionSubtitleSx}>
                            Choose a plan that fits your current level and goals.
                        </Typography>
                    </Box>
                    <Grid container spacing={{ xs: 2, md: 4 }} alignItems="stretch">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 5,
                                    borderRadius: '32px',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid #e2e8f0',
                                    bgcolor: 'white',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', mr: 2 }}>
                                        <CheckCircleIcon sx={{ fontSize: 32 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                            Foundation Path
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b' }}>Perfect for absolute beginners</Typography>
                                    </Box>
                                </Box>
                                <Stack spacing={3} sx={{ flex: 1 }}>
                                    {[
                                        { level: "Free Content", desc: "Basic vocabulary & daily word of the day" },
                                        { level: "Bronze Access", desc: "Essentials & reading fluency practice" },
                                        { level: "Silver Upgrade", desc: "Real-life conversations & advanced puzzles" }
                                    ].map((item, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ mt: 0.5, mr: 2, color: '#22c55e' }}>
                                                <VerifiedUserIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.level}</Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b' }}>{item.desc}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                                <Button
                                    variant="outlined"
                                    onClick={handleStartFreeModule}
                                    sx={{
                                        mt: 5,
                                        py: 1.5,
                                        borderRadius: '12px',
                                        color: '#0f172a',
                                        borderColor: '#e2e8f0',
                                        fontWeight: 700,
                                        '&:hover': { borderColor: '#0f172a', bgcolor: 'transparent' }
                                    }}
                                >
                                    Start Free Foundation
                                </Button>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 5,
                                    borderRadius: '32px',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: '#0f172a',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)'
                                }}
                            >
                                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
                                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', mr: 2 }}>
                                        <AutoAwesomeIcon sx={{ fontSize: 32 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                            Professional Path
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>Accelerate your career growth</Typography>
                                    </Box>
                                </Box>
                                <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, flex: 1 }}>
                                    {[
                                        { level: "Gold Membership", desc: "AI Prompts, Scene Explanations, & Professional Dialogues" },
                                        { level: "Full Course Mastery", desc: "200+ hours of video modules & assessment quizzes" },
                                        { level: "AI Learning Buddy", desc: "Speak or type to learn with personalized feedback" }
                                    ].map((item, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ mt: 0.5, mr: 2, color: '#818cf8' }}>
                                                <VerifiedUserIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.level}</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>{item.desc}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                                <Button
                                    component={RouterLink}
                                    to="/subscription-plans"
                                    variant="contained"
                                    sx={{
                                        mt: 5,
                                        py: 2,
                                        borderRadius: '12px',
                                        bgcolor: '#6366f1',
                                        fontWeight: 700,
                                        '&:hover': { bgcolor: '#4f46e5' }
                                    }}
                                >
                                    Unlock Professional Plans
                                </Button>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Who's This App For - Compact 2 Column */}
            <Box sx={{ py: { xs: 3, md: 5 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Who's This App For?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ✓ Check all that apply
                        </Typography>
                    </Box>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                            {whoIsThisFor.map((item, index) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.5 }}>
                                        <Checkbox
                                            checked={checkedItems[index] || false}
                                            onChange={() => handleCheckboxChange(index)}
                                            color="primary"
                                            size="small"
                                            sx={{ mt: -0.5 }}
                                        />
                                        <Typography variant="body2" sx={{ pt: 0.5 }}>
                                            {item}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ textAlign: 'center', mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                                If any of the above applies to you, Verble is PERFECT for you!
                            </Typography>
                            <Button
                                onClick={handleStartFreeModule}
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ px: 4, py: 1.5, borderRadius: '50px' }}
                            >
                                Start Your Free Module Today
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            </Box>

            {/* Everything You Will Master - Full Width Equal Height 3 Column */}
            <Box sx={{ py: { xs: 3, md: 5 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="xl">
                    <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', width: '100%' }}>
                            Everything You Will Master
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Comprehensive learning modules for complete English mastery
                        </Typography>
                    </Box>
                    <Grid container spacing={{ xs: 2, md: 3 }} sx={{ width: '100%' }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card
                                elevation={2}
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    height: '100%',
                                    minHeight: '420px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: 'white'
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'success.main' }}>
                                    Free Foundation
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 2.5, flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Daily Word</Typography>
                                            <Typography variant="body2" color="text.secondary">1000+ words with meanings & examples</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Phrase Building</Typography>
                                            <Typography variant="body2" color="text.secondary">500+ practical phrases for daily use</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'warning.main' }}>
                                    Bronze Content
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 2.5, flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="warning" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>One Minute Reads</Typography>
                                            <Typography variant="body2" color="text.secondary">300+ stories with key words & translations</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="warning" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Essential Vocabulary</Typography>
                                            <Typography variant="body2" color="text.secondary">Themed vocabulary sets (Kitchen, Travel, etc.)</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'info.main' }}>
                                    Silver Content
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="info" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Practical Conversations</Typography>
                                            <Typography variant="body2" color="text.secondary">Real-life dialogue practice with audio</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="info" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Daily Grammar Puzzles</Typography>
                                            <Typography variant="body2" color="text.secondary">Spot correct sentence & fill blanks</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <MasterTierCard
                                badge="Career Ready"
                                headerIcon={<WorkspacePremiumIcon sx={{ fontSize: 26 }} />}
                                title="Gold Professional"
                                subtitle="Speak confidently at work, interviews, and abroad."
                                stats={[
                                    { value: '50+', label: 'Scenarios' },
                                    { value: '100+', label: 'AI Prompts' },
                                    { value: '24/7', label: 'Learning' },
                                ]}
                                features={[
                                    {
                                        title: 'Scene & situation English',
                                        detail: 'Build vocabulary for real-life moments.',
                                    },
                                    {
                                        title: 'Professional dialogues',
                                        detail: 'Airport, interviews, meetings, and client calls.',
                                    },
                                    {
                                        title: 'AI prompts for super fast learning',
                                        detail: 'Practice daily with ready prompts and feedback.',
                                    },
                                    {
                                        title: 'Hindi & Hinglish support',
                                        detail: 'Learn in the language you are most comfortable with.',
                                    },
                                ]}
                                offerPriceLabel={goldPriceLabels?.offer ?? '—'}
                                originalPriceLabel={goldPriceLabels?.original}
                                ctaLabel="Get Gold Access"
                                ctaTo={goldPlan ? `/subscription-plans/${goldPlan._id}` : '/subscription-plans'}
                                ctaTextColor="#1d4ed8"
                                gradient="linear-gradient(160deg, #4f46e5 0%, #2563eb 55%, #1d4ed8 100%)"
                                boxShadow="0 16px 32px -12px rgba(37, 99, 235, 0.4)"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <MasterTierCard
                                badge="Zero to Hero"
                                headerIcon={<MenuBookIcon sx={{ fontSize: 26 }} />}
                                title="Full Course"
                                subtitle="A complete structured path from basics to advanced fluency."
                                stats={[
                                    { value: '200+', label: 'Hours' },
                                    { value: '80', label: 'Quizzes' },
                                    { value: 'Lifetime', label: 'Access' },
                                ]}
                                features={[
                                    {
                                        title: '100 videos across 8 modules',
                                        detail: 'Clear milestones from beginner to confident speaker.',
                                    },
                                    {
                                        title: 'Complete grammar track',
                                        detail: 'Phonetics through advanced modals and usage.',
                                    },
                                    {
                                        title: 'Assessments & progress tracking',
                                        detail: 'Quizzes to spot gaps and improve faster.',
                                    },
                                    {
                                        title: 'Bonus speeches & PDF notes',
                                        detail: 'Revise offline with curated study material.',
                                    },
                                ]}
                                offerPriceLabel={fullCoursePriceLabels?.offer ?? '—'}
                                originalPriceLabel={fullCoursePriceLabels?.original}
                                ctaLabel="Explore Full Course"
                                ctaTo={fullCoursePlan ? `/subscription-plans/${fullCoursePlan._id}` : '/courses'}
                                ctaTextColor="#047857"
                                gradient="linear-gradient(160deg, #059669 0%, #10b981 50%, #047857 100%)"
                                boxShadow="0 16px 32px -12px rgba(5, 150, 105, 0.38)"
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Course Value Breakdown - Modern Pricing Section */}
            <Box sx={{ py: landingSectionPy, bgcolor: '#ffffff' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: landingSectionHeaderMb }}>
                        <Typography variant="h3" sx={landingSectionTitleSx}>
                            Incredible Value, Unbeatable Price
                        </Typography>
                        <Typography variant="h6" sx={landingSectionSubtitleSx}>
                            Invest in your future with our comprehensive learning modules.
                        </Typography>
                    </Box>
                    <LandingPricingSection />
                    <Box sx={{ mt: 6, textAlign: 'center' }}>
                        <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
                            {[
                                { icon: <SecurityIcon />, text: "7-Day Refund" },
                                { icon: <VerifiedUserIcon />, text: "Verified Content" },
                                { icon: <TrendingUpIcon />, text: "Lifetime Updates" }
                            ].map((item, idx) => (
                                <Grid size="auto" key={idx}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#64748b' }}>
                                        <Box sx={{ color: '#22c55e' }}>{item.icon}</Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.text}</Typography>
                                    </Stack>
                                </Grid>
                            ))}
                        </Grid>
                        <Button
                            onClick={handleStartFreeModule}
                            variant="contained"
                            size="large"
                            sx={{
                                bgcolor: '#6366f1',
                                px: 6,
                                py: 2,
                                borderRadius: '16px',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                                '&:hover': { bgcolor: '#4f46e5' }
                            }}
                        >
                            Start Learning for Free
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Testimonials - Premium Social Proof */}
            <Box sx={{ py: landingSectionPy, bgcolor: '#f8fafc' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: landingSectionHeaderMb }}>
                        <Typography variant="h3" sx={landingSectionTitleSx}>
                            Real Stories, Real Results
                        </Typography>
                        <Typography variant="h6" sx={landingSectionSubtitleSx}>
                            Join 10,000+ learners who have transformed their lives with Verble.
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        {testimonials.map((testimonial, index) => (
                            <Grid size={{ xs: 12, md: 4 }} key={index}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        p: 4,
                                        borderRadius: '24px',
                                        height: '100%',
                                        border: '1px solid #e2e8f0',
                                        bgcolor: 'white',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Avatar sx={{ bgcolor: '#6366f1', width: 56, height: 56, fontWeight: 700 }}>
                                            {testimonial.name.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ ml: 2 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{testimonial.name}</Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>{testimonial.location}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', mb: 2 }}>
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <StarIcon key={i} sx={{ color: '#f59e0b', fontSize: 20 }} />
                                        ))}
                                    </Box>
                                    <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                                        "{testimonial.text}"
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            <FullCourseSyllabusSection />

            {/* Meet Your Guide - Executive Profile */}
            <Box sx={{ pt: landingSectionPy, pb: { xs: 2, sm: 3, md: 5 }, bgcolor: '#0f172a' }}>
                <Container maxWidth="lg">
                    <Card
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 3.5, md: 8 },
                            borderRadius: { xs: '24px', md: '40px' },
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)' }} />
                        <Grid container spacing={{ xs: 2, md: 6 }} alignItems="center">
                            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center', px: { xs: 1, md: 0 } }}>
                                <Avatar
                                    src="/indian-coach.jpg"
                                    alt="Manik Bhardwaj — Lead English Coach"
                                    sx={{
                                        width: { xs: 160, sm: 200, md: 240 },
                                        height: { xs: 160, sm: 200, md: 240 },
                                        mx: 'auto',
                                        border: '8px solid rgba(99, 102, 241, 0.35)',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        '& img': { objectFit: 'cover', objectPosition: 'top center' },
                                    }}
                                />
                                <Typography
                                    variant="h4"
                                    sx={{
                                        mt: 2,
                                        fontWeight: 800,
                                        color: 'white',
                                        fontSize: { xs: '1.25rem', md: '2.125rem' },
                                    }}
                                >
                                    Manik Bhardwaj
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#818cf8',
                                        fontWeight: 600,
                                        fontSize: { xs: '0.9rem', md: '1.25rem' },
                                    }}
                                >
                                    Lead English Coach
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }} sx={{ px: { xs: 1.5, sm: 2, md: 0 }, pb: { xs: 1, md: 0 } }}>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontWeight: 800,
                                        mb: { xs: 1.5, md: 3 },
                                        color: 'white',
                                        lineHeight: { xs: 1.35, md: 1.2 },
                                        fontSize: { xs: '1.15rem', sm: '1.35rem', md: '2rem' },
                                        px: { xs: 0.5, md: 0 },
                                    }}
                                >
                                    &ldquo;I believe everyone has the potential to speak English confidently.&rdquo;
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#94a3b8',
                                        fontWeight: 400,
                                        lineHeight: 1.75,
                                        mb: { xs: 2, md: 4 },
                                        fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.25rem' },
                                        px: { xs: 0.5, md: 0 },
                                    }}
                                >
                                    With over 15 years of experience in language coaching, I've developed a methodology that focuses on natural acquisition rather than rote memorization. My goal is to help you break the barrier of hesitation and speak with authority.
                                </Typography>
                                <Stack direction="row" spacing={{ xs: 2, md: 3 }} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '1.35rem', md: '2.125rem' } }}>15+</Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Years Experience</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '1.35rem', md: '2.125rem' } }}>3K+</Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Students Trained</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '1.35rem', md: '2.125rem' } }}>1500+</Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Candidates Interviewed</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Card>
                </Container>
            </Box>

        </Box>
    );
};

export default LandingPage;
