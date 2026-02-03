// src/components/features/AIPromptsSection.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    CircularProgress,
    Chip,
    TextField,
    InputAdornment,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import { getAllAIPrompts, incrementPromptUsage, type AIPrompt } from '../../services/aiPromptService';

const AIPromptsSection: React.FC = () => {
    const [topics, setTopics] = useState<string[]>([]);
    const [promptsByTopic, setPromptsByTopic] = useState<Record<string, AIPrompt[]>>({});
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllAIPrompts('GOLD'); // Gold level prompts
            setTopics(data.topics);
            setPromptsByTopic(data.promptsByTopic);
            // Expand first topic by default
            if (data.topics.length > 0) {
                setExpandedTopics(new Set([data.topics[0]]));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load AI prompts.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopicToggle = (topic: string) => {
        setExpandedTopics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(topic)) {
                newSet.delete(topic);
            } else {
                newSet.add(topic);
            }
            return newSet;
        });
    };

    const handleCopyPrompt = async (prompt: AIPrompt) => {
        try {
            // Copy to clipboard
            await navigator.clipboard.writeText(prompt.prompt);
            setCopySuccess(`Copied: ${prompt.title}`);

            // Increment usage count
            try {
                await incrementPromptUsage(prompt._id);
            } catch (err) {
                // Silently fail if usage increment fails
                console.error('Failed to increment usage:', err);
            }
        } catch (err) {
            setError('Failed to copy to clipboard.');
        }
    };

    const handleCloseSnackbar = () => {
        setCopySuccess(null);
    };

    // Filter prompts based on search term
    const filteredTopics = topics.filter(topic => {
        if (searchTerm.trim() === '') return true;

        const prompts = promptsByTopic[topic] || [];
        return prompts.some(prompt =>
            prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    const getFilteredPromptsForTopic = (topic: string): AIPrompt[] => {
        const prompts = promptsByTopic[topic] || [];
        if (searchTerm.trim() === '') return prompts;

        return prompts.filter(prompt =>
            prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
                Ready to Use AI Prompts
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Explore AI prompts organized by topics. Click on any topic to expand and view prompts.
                Use the copy button to copy prompts for use in ChatGPT or Gemini.
            </Typography>

            {/* Search Bar */}
            <TextField
                fullWidth
                placeholder="Search prompts by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 4 }}
            />

            {/* Topics Accordion */}
            {filteredTopics.length > 0 ? (
                <Box>
                    {filteredTopics.map((topic) => {
                        const prompts = getFilteredPromptsForTopic(topic);
                        if (prompts.length === 0) return null;

                        return (
                            <Accordion
                                key={topic}
                                expanded={expandedTopics.has(topic)}
                                onChange={() => handleTopicToggle(topic)}
                                sx={{
                                    mb: 2,
                                    '&:before': {
                                        display: 'none',
                                    },
                                    boxShadow: 2,
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        backgroundColor: 'primary.light',
                                        color: 'primary.contrastText',
                                        '&:hover': {
                                            backgroundColor: 'primary.main',
                                        },
                                    }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {topic} ({prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'})
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {prompts.map((prompt) => (
                                            <Card key={prompt._id} elevation={2}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                                {prompt.title}
                                                            </Typography>
                                                            {prompt.description && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                                    {prompt.description}
                                                                </Typography>
                                                            )}
                                                            {prompt.tags.length > 0 && (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                                                    {prompt.tags.map((tag, index) => (
                                                                        <Chip
                                                                            key={index}
                                                                            label={tag}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            color="primary"
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                        <Tooltip title="Copy prompt">
                                                            <IconButton
                                                                color="primary"
                                                                onClick={() => handleCopyPrompt(prompt)}
                                                                sx={{ ml: 2 }}
                                                            >
                                                                <ContentCopyIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            p: 2,
                                                            backgroundColor: 'grey.100',
                                                            borderRadius: 1,
                                                            border: '1px solid',
                                                            borderColor: 'grey.300',
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            component="pre"
                                                            sx={{
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.875rem',
                                                                margin: 0,
                                                            }}
                                                        >
                                                            {prompt.prompt}
                                                        </Typography>
                                                    </Box>
                                                    {prompt.usageCount > 0 && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                            Used {prompt.usageCount} {prompt.usageCount === 1 ? 'time' : 'times'}
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        {searchTerm
                            ? 'No prompts found matching your search.'
                            : 'No AI prompts available.'}
                    </Typography>
                </Box>
            )}

            {/* Success Snackbar */}
            <Snackbar
                open={!!copySuccess}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {copySuccess}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AIPromptsSection;
