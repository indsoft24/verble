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
    Grid,
    Button,
    Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { getHelpArticles, getHelpCategories, type HelpArticle } from '../services/helpService';

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

    const handleArticleToggle = (articleId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
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

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: { xs: 4, md: 6 } }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <HelpOutlineIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
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

                {/* Articles */}
                {filteredArticles.length === 0 ? (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 6 }}>
                            <Typography variant="h6" color="text.secondary">
                                {searchTerm || selectedCategory !== 'all'
                                    ? 'No articles found matching your criteria.'
                                    : 'No help articles available at the moment.'}
                            </Typography>
                            {(searchTerm || selectedCategory !== 'all') && (
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
                            )}
                        </CardContent>
                    </Card>
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
