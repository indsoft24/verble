// src/pages/AIPromptsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { alpha } from '@mui/material/styles';
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
    const richContentRef = useRef<HTMLDivElement | null>(null);

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

    const handleCopy = async () => {
        if (!selectedPrompt) return;
        try {
            const text = (selectedPrompt.prompt || '').trim();
            if (!text) return;
            await navigator.clipboard.writeText(text);
            await incrementPromptUsage(selectedPrompt._id);
            setCopyMessage('Prompt copied.');
        } catch {
            setCopyMessage('Could not copy prompt.');
        }
    };

    useEffect(() => {
        if (!selectedPrompt || !richContentRef.current) return;
        const root = richContentRef.current;
        const preBlocks = Array.from(root.querySelectorAll('pre'));

        const cleanup: Array<() => void> = [];

        preBlocks.forEach((pre, index) => {
            if (pre.dataset.copyableMounted === 'true') return;
            pre.dataset.copyableMounted = 'true';
            pre.style.position = 'relative';
            pre.style.background = '#f5f7fb';
            pre.style.padding = '14px 12px 12px';
            pre.style.borderRadius = '8px';
            pre.style.overflowX = 'auto';
            pre.style.border = '1px solid #d8e1ea';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = 'Copy';
            btn.style.position = 'absolute';
            btn.style.top = '8px';
            btn.style.right = '8px';
            btn.style.fontSize = '12px';
            btn.style.padding = '4px 8px';
            btn.style.borderRadius = '6px';
            btn.style.border = '1px solid #b8c7db';
            btn.style.background = '#fff';
            btn.style.cursor = 'pointer';

            const handler = async () => {
                const raw = pre.innerText || '';
                try {
                    await navigator.clipboard.writeText(raw);
                    await incrementPromptUsage(selectedPrompt._id);
                    setCopyMessage(`Code block ${index + 1} copied.`);
                } catch {
                    setCopyMessage('Could not copy code block.');
                }
            };

            btn.addEventListener('click', handler);
            pre.appendChild(btn);
            cleanup.push(() => {
                btn.removeEventListener('click', handler);
                btn.remove();
                delete pre.dataset.copyableMounted;
            });
        });

        return () => {
            cleanup.forEach((fn) => fn());
        };
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
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2, rowGap: 1 }}>
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
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5, rowGap: 1 }}>
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
                                    <Paper
                                        sx={{
                                            p: 1.5,
                                            maxHeight: { xs: 'unset', md: '72vh' },
                                            overflowY: 'auto',
                                            borderRadius: 3,
                                            border: `1px solid ${alpha(learnerBrandTheme.border, 0.72)}`,
                                            boxShadow: `0 12px 26px ${alpha('#10243A', 0.08)}`,
                                            position: { xs: 'relative', md: 'sticky' },
                                            top: { md: 84 },
                                        }}
                                    >
                                        <Stack spacing={1}>
                                            {filteredPrompts.map((item) => (
                                                <Card
                                                    key={item._id}
                                                    variant={selectedPromptId === item._id ? 'elevation' : 'outlined'}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        borderRadius: 2,
                                                        borderColor: selectedPromptId === item._id
                                                            ? alpha(learnerBrandTheme.accent, 0.45)
                                                            : alpha(learnerBrandTheme.border, 0.7),
                                                        backgroundColor: selectedPromptId === item._id
                                                            ? alpha(learnerBrandTheme.accent, 0.09)
                                                            : alpha('#fff', 0.95),
                                                        boxShadow: selectedPromptId === item._id
                                                            ? `0 8px 16px ${alpha(learnerBrandTheme.accent, 0.18)}`
                                                            : 'none',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: `0 8px 18px ${alpha('#152C43', 0.14)}`,
                                                        },
                                                    }}
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
                                    <Paper
                                        sx={{
                                            p: { xs: 1.75, md: 2.5 },
                                            borderRadius: 3,
                                            border: `1px solid ${alpha(learnerBrandTheme.border, 0.72)}`,
                                            boxShadow: `0 14px 30px ${alpha('#10243A', 0.1)}`,
                                            minHeight: { xs: 'auto', md: '72vh' },
                                        }}
                                    >
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
                                                <Box
                                                    ref={richContentRef}
                                                    sx={{
                                                        '& img': { maxWidth: '100%', borderRadius: 2, border: `1px solid ${alpha(learnerBrandTheme.border, 0.5)}` },
                                                        '& p': { mb: 1.25, lineHeight: 1.75, color: learnerBrandTheme.textPrimary },
                                                        '& h1,& h2,& h3,& h4': { mt: 2, mb: 1 },
                                                        '& ul,& ol': { pl: 3, mb: 1.25 },
                                                        '& blockquote': {
                                                            borderLeft: '3px solid',
                                                            borderColor: learnerBrandTheme.accent,
                                                            pl: 1.5,
                                                            color: learnerBrandTheme.textSecondary,
                                                            my: 1.5,
                                                            backgroundColor: alpha(learnerBrandTheme.accent, 0.05),
                                                            borderRadius: 1,
                                                            py: 1,
                                                        },
                                                        '& code': {
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.9rem',
                                                        },
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: selectedPrompt.contentHtml || '' }}
                                                />
                                                {!!selectedPrompt.prompt?.trim() && (
                                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                                                            <Typography variant="subtitle2" fontWeight={700}>
                                                                Legacy prompt snippet
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
                                                        <Typography component="pre" sx={{ mt: 1, mb: 0, whiteSpace: 'pre-wrap' }}>
                                                            {selectedPrompt.prompt}
                                                        </Typography>
                                                    </Paper>
                                                )}
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
