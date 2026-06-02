// src/pages/HelpPage.tsx
import React, { useMemo, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Button,
    Divider,
    Link as MuiLink,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DocumentHead from '../components/seo/DocumentHead';
import UserLayout from '../components/layout/UserLayout';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';

const HELP_SECTIONS = [
    {
        id: 'getting-started',
        title: 'Getting started with Verble',
        content: 'Verble is an online English speaking and learning platform. To get started, create an account, explore our courses, and visit your dashboard for daily activities like Word of the Day, Phrase of the Day, and speaking practice. You can browse courses from the main menu and subscribe to a plan that fits your goals.',
        keywords: ['getting started', 'sign up', 'dashboard', 'English learning'],
    },
    {
        id: 'account-profile',
        title: 'Account and profile',
        content: 'Manage your account from the profile or settings menu. You can update your name, email, and preferences. If you need to reset your password or change login details, use the account settings. For security, we recommend using a strong password and keeping your contact details up to date.',
        keywords: ['account', 'profile', 'settings', 'password'],
    },
    {
        id: 'dashboard-activities',
        title: 'Dashboard and daily activities',
        content: 'Your dashboard shows daily activities designed to improve English fluency: Word of the Day for vocabulary, Phrase of the Day for conversation, reading and speaking exercises, and grammar practice. Complete activities regularly to build streaks and track your progress. Content is often tailored to your level.',
        keywords: ['dashboard', 'daily practice', 'vocabulary', 'speaking', 'streaks'],
    },
    {
        id: 'courses-learning',
        title: 'Courses and learning content',
        content: 'Verble offers structured courses and modules for English speaking, exam preparation, and general fluency. After subscribing, you get access to video lessons, practice materials, and sometimes live sessions. Use the Courses section to browse by topic and level. You can learn at your own pace on desktop or mobile.',
        keywords: ['courses', 'modules', 'video lessons', 'English speaking', 'exam preparation'],
    },
    {
        id: 'subscription-payment',
        title: 'Subscription and payment',
        content: 'Subscriptions give you access to premium courses and features. We support secure payment methods including cards, UPI, and net banking. Check the subscription or pricing page for current plans. For refunds and billing questions, refer to our Terms of Service or contact support.',
        keywords: ['subscription', 'payment', 'pricing', 'refund'],
    },
    {
        id: 'technical-support',
        title: 'Technical support and contact',
        content: 'If you face login issues, playback errors, or other technical problems, try refreshing the page or using a supported browser (Chrome, Safari, Firefox). For further help, use the Contact Us page or email our support team. We aim to respond to queries as quickly as possible.',
        keywords: ['support', 'contact', 'technical help', 'troubleshooting'],
    },
];

const HelpPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedArticle, setExpandedArticle] = useState<string | false>(false);

    const filteredSections = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return HELP_SECTIONS;
        return HELP_SECTIONS.filter((section) => {
            const matchesTitle = section.title.toLowerCase().includes(q);
            const matchesContent = section.content.toLowerCase().includes(q);
            const matchesKeywords = section.keywords.some((k) => k.toLowerCase().includes(q));
            return matchesTitle || matchesContent || matchesKeywords;
        });
    }, [searchTerm]);

    const canonicalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/help`;

    return (
        <UserLayout title="Help Center">
            <DocumentHead
                title="Help Center | Verble - English Speaking & Learning Support"
                description="Find answers about Verble: get started, use your dashboard, manage your account, access courses, and get support for English speaking practice and online learning."
                canonicalUrl={canonicalUrl}
            />
            <Container maxWidth="lg" component="main" sx={{ py: { xs: 3, md: 5 } }}>
                <Box sx={{ textAlign: 'center', mb: 4 }} component="header">
                    <HelpOutlineIcon sx={{ fontSize: 60, color: learnerBrandTheme.accent, mb: 2 }} aria-hidden />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Help Center
                    </Typography>
                    <Typography variant="h6" sx={{ color: learnerBrandTheme.textSecondary }}>
                        Find answers to common questions and learn how to use our platform
                    </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <TextField
                        fullWidth
                        placeholder="Search for help articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            backgroundColor: learnerBrandTheme.surface,
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        }}
                    />
                </Box>

                <Divider sx={{ my: 4 }} />

                {filteredSections.length === 0 ? (
                    <Card sx={{ border: `1px solid ${learnerBrandTheme.border}` }}>
                        <CardContent sx={{ textAlign: 'center', py: 6 }}>
                            <Typography variant="h6" sx={{ color: learnerBrandTheme.textSecondary }}>
                                No topics match your search.
                            </Typography>
                            <Button variant="outlined" onClick={() => setSearchTerm('')} sx={{ mt: 2 }}>
                                Clear search
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Box component="section" aria-label="Help topics">
                        <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                            Popular topics
                        </Typography>
                        {filteredSections.map((section) => (
                            <Accordion
                                key={section.id}
                                expanded={expandedArticle === section.id}
                                onChange={(_e, isExpanded) => setExpandedArticle(isExpanded ? section.id : false)}
                                sx={{ mb: 2, border: `1px solid ${learnerBrandTheme.border}` }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography sx={{ fontWeight: 'bold' }} component="h3" variant="subtitle1">
                                        {section.title}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                                        {section.content}
                                    </Typography>
                                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ mr: 1, color: learnerBrandTheme.textMuted }}>
                                            Related:
                                        </Typography>
                                        {section.keywords.map((keyword) => (
                                            <Chip
                                                key={keyword}
                                                label={keyword}
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                        <Card variant="outlined" sx={{ mt: 4, p: 2 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ color: learnerBrandTheme.textSecondary }} gutterBottom>
                                    Can&apos;t find what you need?
                                </Typography>
                                <Button component={MuiLink} href="/contact-us" variant="outlined" size="small">
                                    Contact us
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Container>
        </UserLayout>
    );
};

export default HelpPage;
