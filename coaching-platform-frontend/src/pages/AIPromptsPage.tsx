// src/pages/AIPromptsPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
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
import AIPromptGuideContent from '../components/common/AIPromptGuideContent';

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
    const [view, setView] = useState<'list' | 'detail'>('list');
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
            if (!item.isRichContent || !item.contentHtml?.trim()) return false;
            if (activeTopic && item.topic !== activeTopic) return false;
            if (activeTag && !(item.tags || []).includes(activeTag)) return false;
            if (!search.trim()) return true;
            const s = search.toLowerCase();
            return (
                item.title.toLowerCase().includes(s) ||
                (item.excerpt || '').toLowerCase().includes(s) ||
                (item.contentHtml || '').toLowerCase().includes(s) ||
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
    const selectedIndex = selectedPrompt ? filteredPrompts.findIndex((item) => item._id === selectedPrompt._id) : -1;
    const previousPrompt = selectedIndex > 0 ? filteredPrompts[selectedIndex - 1] : null;
    const nextPrompt = selectedIndex >= 0 && selectedIndex < filteredPrompts.length - 1 ? filteredPrompts[selectedIndex + 1] : null;

    const openPromptDetail = (promptId: string) => {
        setSelectedPromptId(promptId);
        setView('detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePromptCopied = useCallback(async () => {
        if (!selectedPrompt) return;
        try {
            await incrementPromptUsage(selectedPrompt._id);
            setCopyMessage('Prompt copied — paste it into ChatGPT, Gemini, or Claude.');
        } catch {
            setCopyMessage('Copied to clipboard.');
        }
    }, [selectedPrompt]);

    return (
        <UserLayout title="AI Prompt Guides">
            <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 2.5,
                        borderRadius: 3,
                        border: `1px solid ${alpha(learnerBrandTheme.accent, 0.18)}`,
                        background: `linear-gradient(135deg, ${alpha(learnerBrandTheme.accent, 0.13)} 0%, ${alpha(learnerBrandTheme.surface, 0.98)} 50%, ${alpha(learnerBrandTheme.accent, 0.06)} 100%)`,
                    }}
                >
                    <Typography variant="h4" fontWeight={800} sx={{ color: learnerBrandTheme.textPrimary, mb: 0.75 }}>
                        AI Prompt Guides
                    </Typography>
                    <Typography variant="body1" sx={{ color: learnerBrandTheme.textSecondary }}>
                        Learn how to ask better questions to ChatGPT, Gemini, Claude, and Perplexity for English learning.
                    </Typography>
                </Paper>

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
                        <Paper
                            sx={{
                                p: { xs: 1.5, md: 2.25 },
                                mb: 2,
                                borderRadius: 3,
                                border: `1px solid ${alpha(learnerBrandTheme.border, 0.7)}`,
                                boxShadow: `0 10px 24px ${alpha('#0B1726', 0.08)}`,
                            }}
                        >
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    placeholder="Search by topic, tag, title, or content..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: alpha('#ffffff', 0.9),
                                        },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>
                            <Stack
                                spacing={2}
                                sx={{
                                    mt: 2,
                                    p: '10px',
                                    borderRadius: 2,
                                    bgcolor: alpha(learnerBrandTheme.accent, 0.04),
                                }}
                            >
                                <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
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
                                <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
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
                            </Stack>
                        </Paper>

                        {loading ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            view === 'list' ? (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: `1px solid ${alpha(learnerBrandTheme.border, 0.72)}`,
                                        boxShadow: `0 8px 22px ${alpha('#10243A', 0.06)}`,
                                        overflow: 'hidden',
                                        bgcolor: learnerBrandTheme.surface,
                                    }}
                                >
                                    {filteredPrompts.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
                                            No prompts found.
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={2} sx={{ p: 2 }}>
                                            {filteredPrompts.map((item) => (
                                                <Grid key={item._id} size={{ xs: 12, md: 6 }}>
                                                    <Box
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => openPromptDetail(item._id)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault();
                                                                openPromptDetail(item._id);
                                                            }
                                                        }}
                                                        sx={{
                                                            p: 2,
                                                            height: '100%',
                                                            borderRadius: 2,
                                                            cursor: 'pointer',
                                                            bgcolor: '#fff',
                                                            border: `1px solid ${alpha(learnerBrandTheme.border, 0.65)}`,
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                borderColor: alpha(learnerBrandTheme.accent, 0.45),
                                                                boxShadow: `0 6px 16px ${alpha('#152C43', 0.1)}`,
                                                                transform: 'translateY(-1px)',
                                                            },
                                                        }}
                                                    >
                                                        <Typography fontWeight={700} variant="subtitle1">
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                            {item.topic} {item.category ? `• ${item.category}` : ''}
                                                        </Typography>
                                                        {!!item.excerpt && (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ mt: 1.25, color: learnerBrandTheme.textSecondary, lineHeight: 1.6 }}
                                                            >
                                                                {item.excerpt}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </Paper>
                            ) : (
                                <Paper
                                    sx={{
                                        p: { xs: 1.25, md: 2 },
                                        borderRadius: 3,
                                        border: `1px solid ${alpha(learnerBrandTheme.border, 0.72)}`,
                                        boxShadow: `0 14px 30px ${alpha('#10243A', 0.1)}`,
                                    }}
                                >
                                    {selectedPrompt ? (
                                        <Stack spacing={2} sx={{ p: '10px' }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                                                <Button
                                                    startIcon={<ArrowBackIcon />}
                                                    variant="outlined"
                                                    onClick={() => setView('list')}
                                                    sx={{ alignSelf: 'flex-start' }}
                                                >
                                                    Back to listing
                                                </Button>
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<NavigateBeforeIcon />}
                                                        disabled={!previousPrompt}
                                                        onClick={() => previousPrompt && openPromptDetail(previousPrompt._id)}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={<NavigateNextIcon />}
                                                        disabled={!nextPrompt}
                                                        onClick={() => nextPrompt && openPromptDetail(nextPrompt._id)}
                                                    >
                                                        Next
                                                    </Button>
                                                </Stack>
                                            </Stack>
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
                                                {selectedPrompt.contentHtml?.trim() ? (
                                                    <AIPromptGuideContent
                                                        contentHtml={selectedPrompt.contentHtml}
                                                        legacyPrompt={selectedPrompt.prompt || ''}
                                                        onCopied={() => void handlePromptCopied()}
                                                        sx={{
                                                            color: learnerBrandTheme.textPrimary,
                                                            '& .tiptap-rendered-content p': {
                                                                color: learnerBrandTheme.textPrimary,
                                                            },
                                                        }}
                                                    />
                                                ) : null}
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    flexWrap="wrap"
                                                    sx={{ display: 'flex', flexFlow: 'wrap', mt: 2, p: '10px', rowGap: '8px' }}
                                                >
                                                    {(selectedPrompt.tags || []).map((tag) => (
                                                        <Chip key={`${selectedPrompt._id}-${tag}`} label={tag} size="small" />
                                                    ))}
                                                </Stack>
                                        </Stack>
                                    ) : (
                                        <Typography color="text.secondary">Select a prompt to read.</Typography>
                                    )}
                                </Paper>
                            )
                        )}
                    </>
                )}
            </Box>
        </UserLayout>
    );
};

export default AIPromptsPage;
