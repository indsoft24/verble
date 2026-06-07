import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import {
    createAIPrompt,
    deleteAIPrompt,
    getAllAIPromptsAdmin,
    type AIPrompt,
    type AIPromptInput,
    updateAIPrompt,
} from '../services/aiPromptService';
import CommaSeparatedTextField from '../components/common/CommaSeparatedTextField';
import TiptapEditor from '../components/features/blog/TiptapEditor';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';

const EMPTY_FORM: AIPromptInput = {
    topic: '',
    title: '',
    contentHtml: '',
    excerpt: '',
    description: '',
    category: '',
    tags: [],
    level: 'GOLD',
    isActive: true,
};

const AdminAIPromptsPage: React.FC = () => {
    useAdminLayoutPage({ title: 'AI Prompt Library' });
    const [prompts, setPrompts] = useState<AIPrompt[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<AIPrompt | null>(null);
    const [form, setForm] = useState<AIPromptInput>(EMPTY_FORM);
    const [attachmentToInsert, setAttachmentToInsert] = useState<{ id: string; label: string } | null>(null);

    const fetchPrompts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllAIPromptsAdmin({ search, page: 1, limit: 200 });
            setPrompts(data.prompts || []);
        } catch (err: unknown) {
            const e = err as { message?: string; response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || e.message || 'Failed to load AI prompts.');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        void fetchPrompts();
    }, [fetchPrompts]);

    const filteredPrompts = useMemo(() => prompts, [prompts]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpenForm(true);
    };

    const openEdit = (prompt: AIPrompt) => {
        setEditing(prompt);
        const tags = prompt.tags || [];
        setForm({
            topic: prompt.topic || '',
            title: prompt.title || '',
            contentHtml: prompt.contentHtml || '',
            excerpt: prompt.excerpt || '',
            description: prompt.description || '',
            category: prompt.category || '',
            tags,
            level: 'GOLD',
            isActive: prompt.isActive ?? true,
        });
        setOpenForm(true);
    };

    const handleSave = async () => {
        if (!form.topic?.trim() || !form.title?.trim() || !form.contentHtml?.trim()) {
            setError('Topic, title, and rich content are required.');
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const payload: AIPromptInput = {
                ...form,
                topic: form.topic.trim(),
                title: form.title.trim(),
                contentHtml: form.contentHtml,
                tags: form.tags || [],
                level: 'GOLD',
            };
            if (editing?._id) {
                await updateAIPrompt(editing._id, payload);
                setSuccess('AI prompt updated.');
            } else {
                await createAIPrompt(payload);
                setSuccess('AI prompt created.');
            }
            setOpenForm(false);
            await fetchPrompts();
        } catch (err: unknown) {
            const e = err as { message?: string; response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || e.message || 'Failed to save AI prompt.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (prompt: AIPrompt) => {
        if (!window.confirm(`Delete "${prompt.title}"?`)) return;
        setError(null);
        setSuccess(null);
        try {
            await deleteAIPrompt(prompt._id);
            setSuccess('AI prompt deleted.');
            await fetchPrompts();
        } catch (err: unknown) {
            const e = err as { message?: string; response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || e.message || 'Failed to delete AI prompt.');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            AI Prompt Library
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage GOLD-only prompt guides for learners.
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Add prompt
                    </Button>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

                <Paper sx={{ p: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title, topic, tags, content..."
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                    />
                </Paper>

                <Paper sx={{ p: 2 }}>
                    {loading ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredPrompts.length === 0 ? (
                        <Typography color="text.secondary">No prompts found.</Typography>
                    ) : (
                        <Stack spacing={1.5}>
                            {filteredPrompts.map((prompt) => (
                                <Paper key={prompt._id} variant="outlined" sx={{ p: 2 }}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                {prompt.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Topic: {prompt.topic} {prompt.category ? `• Category: ${prompt.category}` : ''}
                                            </Typography>
                                            {prompt.excerpt && (
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    {prompt.excerpt}
                                                </Typography>
                                            )}
                                            <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
                                                {(prompt.tags || []).map((tag) => (
                                                    <Chip key={`${prompt._id}-${tag}`} size="small" label={tag} />
                                                ))}
                                                {prompt.isLegacy && (
                                                    <Chip size="small" color="warning" label="Legacy (hidden for learners)" />
                                                )}
                                                <Chip
                                                    size="small"
                                                    color={prompt.isActive ? 'success' : 'default'}
                                                    label={prompt.isActive ? 'Active' : 'Inactive'}
                                                />
                                            </Stack>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(prompt)}>
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => void handleDelete(prompt)}
                                            >
                                                Delete
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Paper>

                <Dialog open={openForm} onClose={() => !saving && setOpenForm(false)} fullWidth maxWidth="md">
                    <DialogTitle>{editing ? 'Edit AI prompt' : 'Add AI prompt'}</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <TextField
                                label="Topic"
                                value={form.topic}
                                onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                                required
                                fullWidth
                            />
                            <TextField
                                label="Category"
                                value={form.category || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Title"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                required
                                fullWidth
                            />
                            <TextField
                                label="Excerpt"
                                value={form.excerpt || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                            />
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Rich content article (single field)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                                    Write instructions + code/prompt blocks + images in one editor. Learner page will show copy buttons for code blocks.
                                </Typography>
                                <TiptapEditor
                                    content={form.contentHtml || ''}
                                    onChange={(newContent) => setForm((prev) => ({ ...prev, contentHtml: newContent }))}
                                    onAddGatedFileClick={() => {
                                        // AI prompts do not use gated-download attachments.
                                        setAttachmentToInsert(null);
                                    }}
                                    attachmentToInsert={attachmentToInsert}
                                    onAttachmentInserted={() => setAttachmentToInsert(null)}
                                />
                            </Box>
                            <TextField
                                label="Description"
                                value={form.description || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                            />
                            <CommaSeparatedTextField
                                label="Tags"
                                value={form.tags || []}
                                syncKey={editing?._id ?? 'new'}
                                onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                                fullWidth
                                placeholder="e.g. writing, creative, blog"
                            />
                            <FormControl fullWidth disabled>
                                <InputLabel>Level</InputLabel>
                                <Select value="GOLD" label="Level">
                                    <MenuItem value="GOLD">GOLD</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={Boolean(form.isActive)}
                                        onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                                    />
                                }
                                label="Active"
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenForm(false)} disabled={saving}>Cancel</Button>
                        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
                            {saving ? <CircularProgress size={20} /> : editing ? 'Save changes' : 'Create prompt'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
    );
};

export default AdminAIPromptsPage;
