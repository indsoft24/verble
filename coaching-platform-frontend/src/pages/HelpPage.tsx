// src/pages/HelpPage.tsx
import React, { useState, useEffect } from 'react';
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
    CircularProgress,
    Alert,
    Button,
    Divider,
    Link as MuiLink,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { getHelpArticles, getHelpCategories, type HelpArticle } from '../services/helpService';
import DocumentHead from '../components/seo/DocumentHead';

/** SEO-friendly default help content when no articles are loaded from the API */
const DEFAULT_HELP_SECTIONS = [
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
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedArticle, setExpandedArticle] = useState<string | false>(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterArticles();
    }, [articles, selectedCategory, searchTerm]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [articlesData, categoriesData] = await Promise.all([
                getHelpArticles(),
                getHelpCategories(),
            ]);
            setArticles(articlesData);
            setCategories(categoriesData);
        } catch (err: any) {
            setError(err.message || 'Failed to load help articles.');
        } finally {
            setIsLoading(false);
        }
    };

    const filterArticles = () => {
        let filtered = [...articles];

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(article => article.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(article => {
                const matchesTitle = article.title.toLowerCase().includes(searchLower);
                const matchesContent = article.content.toLowerCase().includes(searchLower);
                const matchesKeywords = article.keywords.some(keyword =>
                    keyword.toLowerCase().includes(searchLower)
                );
                return matchesTitle || matchesContent || matchesKeywords;
            });
        }

        setFilteredArticles(filtered);
    };

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        setExpandedArticle(false); // Close any expanded article
    };

    const handleArticleToggle = (articleId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedArticle(isExpanded ? articleId : false);
    };

    const formatContent = (content: string) => {
        // Split by double newlines to create paragraphs
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
        return paragraphs.map((paragraph, index) => (
            <Typography key={index} variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                {paragraph.trim()}
            </Typography>
        ));
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    const showDefaultContent = filteredArticles.length === 0 && !searchTerm.trim() && selectedCategory === 'all';
    const canonicalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/help`;

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: { xs: 4, md: 6 } }}>
            <DocumentHead
                title="Help Center | Verble - English Speaking & Learning Support"
                description="Find answers about Verble: get started, use your dashboard, manage your account, access courses, and get support for English speaking practice and online learning."
                canonicalUrl={canonicalUrl}
            />
            <Container maxWidth="lg" component="main">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }} component="header">
                    <HelpOutlineIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} aria-hidden />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Help Center
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Find answers to common questions and learn how to use our platform
                    </Typography>
                </Box>

                {/* Search Bar */}
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
                            backgroundColor: 'white',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        }}
                    />
                </Box>

                {/* Categories */}
                {categories.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                            Browse by Category
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                label="All"
                                onClick={() => handleCategoryClick('all')}
                                color={selectedCategory === 'all' ? 'primary' : 'default'}
                                variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                                sx={{ cursor: 'pointer' }}
                            />
                            {categories.map((category) => (
                                <Chip
                                    key={category}
                                    label={category}
                                    onClick={() => handleCategoryClick(category)}
                                    color={selectedCategory === category ? 'primary' : 'default'}
                                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Articles or default SEO content */}
                {filteredArticles.length === 0 ? (
                    showDefaultContent ? (
                        <Box component="section" aria-label="Help topics">
                            <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                                Popular topics
                            </Typography>
                            {DEFAULT_HELP_SECTIONS.map((section) => (
                                <Accordion
                                    key={section.id}
                                    sx={{ mb: 2 }}
                                    aria-labelledby={`help-${section.id}-header`}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls={`help-${section.id}-content`}
                                        id={`help-${section.id}-header`}
                                    >
                                        <Typography sx={{ fontWeight: 'bold' }} component="h3" variant="subtitle1">
                                            {section.title}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                                            {section.content}
                                        </Typography>
                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                                Related:
                                            </Typography>
                                            {section.keywords.map((keyword, index) => (
                                                <Chip
                                                    key={index}
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
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Can&apos;t find what you need?
                                    </Typography>
                                    <Button component={MuiLink} href="/contact-us" variant="outlined" size="small">
                                        Contact us
                                    </Button>
                                </CardContent>
                            </Card>
                        </Box>
                    ) : (
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="h6" color="text.secondary">
                                    No articles found matching your criteria.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                    }}
                                    sx={{ mt: 2 }}
                                >
                                    Clear Filters
                                </Button>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                            {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'}
                        </Typography>
                        {filteredArticles.map((article) => (
                            <Accordion
                                key={article._id}
                                expanded={expandedArticle === article._id}
                                onChange={handleArticleToggle(article._id)}
                                sx={{ mb: 2 }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={`panel-${article._id}-content`}
                                    id={`panel-${article._id}-header`}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                        <Typography sx={{ fontWeight: 'bold', flex: 1 }}>
                                            {article.title}
                                        </Typography>
                                        {article.category && (
                                            <Chip
                                                label={article.category}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ mb: 2 }}>
                                        {formatContent(article.content)}
                                    </Box>
                                    {article.keywords && article.keywords.length > 0 && (
                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                                Tags:
                                            </Typography>
                                            {article.keywords.map((keyword, index) => (
                                                <Chip
                                                    key={index}
                                                    label={keyword}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default HelpPage;
