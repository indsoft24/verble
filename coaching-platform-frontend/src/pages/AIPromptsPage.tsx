// src/pages/AIPromptsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UserLayout from '../components/layout/UserLayout';
import { useAuth } from '../contexts/AuthContext';
import { canAccessGoldTierContent } from '../utils/userAccessState';
import {
    getAllAIPrompts,
    getAIPromptTopics,
    incrementPromptUsage,
    type AIPrompt,
} from '../services/aiPromptService';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';

const AIPromptsPage: React.FC = () => {
    const { user } = useAuth();
    const [prompts, setPrompts] = useState<AIPrompt[]>([]);
    const [topics, setTopics] = useState<Array<{ value: string; count: number }>>([]);
    const [tags, setTags] = useState<Array<{ value: string; count: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeTopic, setActiveTopic] = useState('');
    const [activeTag, setActiveTag] = useState('');
    const [selectedPromptId, setSelectedPromptId] = useState<string>('');
    const [copyMessage, setCopyMessage] = useState<string | null>(null);

    const hasAccess = canAccessGoldTierContent(user);

    useEffect(() => {
        if (!hasAccess) return;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const [meta, list] = await Promise.all([
                    getAIPromptTopics(),
                    getAllAIPrompts({ sort: 'recent', page: 1, limit: 200 }),
                ]);
                setTopics(meta.topics || []);
                setTags(meta.tags || []);
                setPrompts(list.prompts || []);
                if ((list.prompts || []).length > 0) {
                    setSelectedPromptId(list.prompts[0]._id);
                }
            } catch (err: unknown) {
                const e = err as { message?: string; response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || e.message || 'Failed to load AI prompt guides.');
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [hasAccess]);

    const filteredPrompts = useMemo(() => {
        return prompts.filter((item) => {
            if (activeTopic && item.topic !== activeTopic) return false;
            if (activeTag && !(item.tags || []).includes(activeTag)) return false;
            if (!search.trim()) return true;
            const s = search.toLowerCase();
            return (
                item.title.toLowerCase().includes(s) ||
                (item.excerpt || '').toLowerCase().includes(s) ||
                (item.content || '').toLowerCase().includes(s) ||
                item.prompt.toLowerCase().includes(s) ||
                (item.tags || []).some((tag) => tag.toLowerCase().includes(s))
            );
        });
    }, [prompts, activeTopic, activeTag, search]);

    useEffect(() => {
        if (!filteredPrompts.some((p) => p._id === selectedPromptId)) {
            setSelectedPromptId(filteredPrompts[0]?._id || '');
        }
    }, [filteredPrompts, selectedPromptId]);

    const selectedPrompt = filteredPrompts.find((item) => item._id === selectedPromptId) || null;

    const handleCopy = async () => {
        if (!selectedPrompt) return;
        try {
            await navigator.clipboard.writeText(selectedPrompt.prompt);
            await incrementPromptUsage(selectedPrompt._id);
            setCopyMessage('Prompt copied.');
        } catch {
            setCopyMessage('Could not copy prompt.');
        }
    };

    return (
        <UserLayout title="AI Prompt Guides">
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2, maxWidth: 1400, mx: 'auto' }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: learnerBrandTheme.textPrimary, mb: 0.75 }}>
                    AI Prompt Guides
                </Typography>
                <Typography variant="body2" sx={{ color: learnerBrandTheme.textSecondary, mb: 2.5 }}>
                    Learn how to ask better questions to ChatGPT, Gemini, Claude, and Perplexity for English learning.
                </Typography>

                {!hasAccess && (
                    <Alert severity="warning">
                        This section is available only for GOLD / Full Course subscribers.
                    </Alert>
                )}

                {hasAccess && (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {copyMessage && (
                            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCopyMessage(null)}>
                                {copyMessage}
                            </Alert>
                        )}
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    placeholder="Search by topic, tag, title, or content..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                                <Chip
                                    label="All topics"
                                    color={activeTopic ? 'default' : 'primary'}
                                    onClick={() => setActiveTopic('')}
                                />
                                {topics.map((topic) => (
                                    <Chip
                                        key={topic.value}
                                        label={`${topic.value} (${topic.count})`}
                                        color={activeTopic === topic.value ? 'primary' : 'default'}
                                        onClick={() => setActiveTopic(topic.value)}
                                    />
                                ))}
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                                <Chip
                                    label="All tags"
                                    color={activeTag ? 'default' : 'primary'}
                                    onClick={() => setActiveTag('')}
                                />
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag.value}
                                        size="small"
                                        label={`${tag.value} (${tag.count})`}
                                        color={activeTag === tag.value ? 'primary' : 'default'}
                                        onClick={() => setActiveTag(tag.value)}
                                    />
                                ))}
                            </Stack>
                        </Paper>

                        {loading ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Paper sx={{ p: 1.5, maxHeight: '70vh', overflowY: 'auto' }}>
                                        <Stack spacing={1}>
                                            {filteredPrompts.map((item) => (
                                                <Card
                                                    key={item._id}
                                                    variant={selectedPromptId === item._id ? 'elevation' : 'outlined'}
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={() => setSelectedPromptId(item._id)}
                                                >
                                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                        <Typography fontWeight={700} variant="subtitle2">
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.topic} {item.category ? `• ${item.category}` : ''}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {filteredPrompts.length === 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                                    No prompts found.
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Paper sx={{ p: 2 }}>
                                        {selectedPrompt ? (
                                            <Stack spacing={2}>
                                                <Box>
                                                    <Typography variant="h5" fontWeight={800}>
                                                        {selectedPrompt.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {selectedPrompt.topic}
                                                        {selectedPrompt.category ? ` • ${selectedPrompt.category}` : ''}
                                                    </Typography>
                                                </Box>
                                                {selectedPrompt.excerpt && (
                                                    <Typography variant="body1" sx={{ color: learnerBrandTheme.textPrimary }}>
                                                        {selectedPrompt.excerpt}
                                                    </Typography>
                                                )}
                                                {(selectedPrompt.content || '')
                                                    .split('\n')
                                                    .filter((line) => line.trim().length > 0)
                                                    .map((line, idx) => (
                                                        <Typography key={`${selectedPrompt._id}-line-${idx}`} variant="body1">
                                                            {line}
                                                        </Typography>
                                                    ))}
                                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                                                        <Typography variant="subtitle2" fontWeight={700}>
                                                            Copyable prompt
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<ContentCopyIcon />}
                                                            onClick={() => void handleCopy()}
                                                        >
                                                            Copy prompt
                                                        </Button>
                                                    </Stack>
                                                    <Typography
                                                        component="pre"
                                                        sx={{
                                                            mt: 1,
                                                            mb: 0,
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        {selectedPrompt.prompt}
                                                    </Typography>
                                                </Paper>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {(selectedPrompt.tags || []).map((tag) => (
                                                        <Chip key={`${selectedPrompt._id}-${tag}`} label={tag} size="small" />
                                                    ))}
                                                </Stack>
                                            </Stack>
                                        ) : (
                                            <Typography color="text.secondary">Select a prompt to read.</Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}
                    </>
                )}
            </Box>
        </UserLayout>
    );
};

export default AIPromptsPage;
