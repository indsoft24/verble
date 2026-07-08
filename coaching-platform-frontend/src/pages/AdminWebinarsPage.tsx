import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TiptapEditor from '../components/features/blog/LazyTiptapEditor';
import AdminImageUploadField from '../components/admin/AdminImageUploadField';
import type { Webinar, WebinarDraft } from '../services/webinarService';
import {
    createWebinarAdmin,
    getWebinarAdminById,
    listWebinarsAdmin,
    updateWebinarAdmin,
} from '../services/webinarService';

type WebinarForm = WebinarDraft;

const defaultForm = (): WebinarForm => ({
    title: '',
    slug: '',
    descriptionHtml: '',
    imageUrl: '',
    meetingLink: '',
    mode: 'FREE',
    price: 0,
    audience: 'ALL',
    topics: [],
    startsAt: '',
    endsAt: '',
    joinWindowBeforeMinutes: 15,
    joinWindowAfterMinutes: 30,
    isPublished: false,
    isArchived: false,
    sortPriority: 0,
});

const AdminWebinarsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [webinars, setWebinars] = useState<Webinar[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [topicsText, setTopicsText] = useState('');
    const [form, setForm] = useState<WebinarForm>(defaultForm());
    const [attachmentToInsert, setAttachmentToInsert] = useState<{ id: string; label: string } | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listWebinarsAdmin();
            setWebinars(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Could not load webinars');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setTopicsText('');
        setForm(defaultForm());
        setOpen(false);
    };

    const openCreate = () => {
        setSuccess(null);
        setError(null);
        setEditingId(null);
        setTopicsText('');
        setForm(defaultForm());
        setOpen(true);
    };

    const openEdit = async (id: string) => {
        setError(null);
        setSuccess(null);
        setSaving(true);
        try {
            const webinar = await getWebinarAdminById(id);
            setEditingId(id);
            setTopicsText((webinar.topics || []).join(', '));
            setForm({
                title: webinar.title,
                slug: webinar.slug,
                descriptionHtml: webinar.descriptionHtml || '',
                imageUrl: webinar.imageUrl || '',
                meetingLink: '',
                mode: webinar.mode,
                price: Number(webinar.price || 0),
                audience: webinar.audience,
                topics: webinar.topics || [],
                startsAt: webinar.startsAt ? new Date(webinar.startsAt).toISOString().slice(0, 16) : '',
                endsAt: webinar.endsAt ? new Date(webinar.endsAt).toISOString().slice(0, 16) : '',
                joinWindowBeforeMinutes: webinar.joinWindowBeforeMinutes || 15,
                joinWindowAfterMinutes: webinar.joinWindowAfterMinutes || 30,
                isPublished: Boolean(webinar.isPublished),
                isArchived: Boolean(webinar.isArchived),
                sortPriority: Number(webinar.sortPriority || 0),
            });
            setOpen(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Could not load webinar details.');
        } finally {
            setSaving(false);
        }
    };

    const formValid = useMemo(() => {
        if (!form.title.trim()) return false;
        if (!form.startsAt || !form.endsAt) return false;
        if (new Date(form.endsAt) <= new Date(form.startsAt)) return false;
        if (form.mode === 'PAID' && Number(form.price || 0) <= 0) return false;
        return true;
    }, [form]);

    const submit = async () => {
        if (!formValid) {
            setError('Please complete all required webinar fields.');
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        const payload: WebinarDraft = {
            ...form,
            topics: topicsText
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            startsAt: new Date(form.startsAt).toISOString(),
            endsAt: new Date(form.endsAt).toISOString(),
        };
        try {
            if (editingId) {
                await updateWebinarAdmin(editingId, payload);
                setSuccess('Webinar updated successfully.');
            } else {
                await createWebinarAdmin(payload);
                setSuccess('Webinar created successfully.');
            }
            await load();
            resetForm();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Could not save webinar.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Webinar Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create and manage multiple live webinars with controlled registration and join access.
                    </Typography>
                </Box>
                <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
                    New webinar
                </Button>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Paper variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Schedule</TableCell>
                            <TableCell>Mode</TableCell>
                            <TableCell>Audience</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6}>Loading webinars...</TableCell>
                            </TableRow>
                        ) : webinars.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>No webinars yet.</TableCell>
                            </TableRow>
                        ) : (
                            webinars.map((w) => (
                                <TableRow key={w._id}>
                                    <TableCell>{w.title}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{new Date(w.startsAt).toLocaleString('en-IN')}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            to {new Date(w.endsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={w.mode === 'PAID' ? `Paid ₹${w.price}` : 'Free'}
                                            color={w.mode === 'PAID' ? 'secondary' : 'success'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label={w.audience} variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Chip size="small" label={w.isPublished ? 'Published' : 'Draft'} color={w.isPublished ? 'primary' : 'default'} />
                                            {w.isArchived && <Chip size="small" label="Archived" color="warning" />}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button size="small" startIcon={<EditIcon />} onClick={() => void openEdit(w._id)} disabled={saving}>
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            <Dialog open={open} onClose={resetForm} maxWidth="md" fullWidth>
                <DialogTitle>{editingId ? 'Edit webinar' : 'Create webinar'}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ pt: 0.5 }}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <TextField
                                fullWidth
                                required
                                label="Title"
                                value={form.title}
                                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Slug"
                                value={form.slug || ''}
                                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                                helperText="Optional; auto-generated from title."
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Description
                            </Typography>
                            <TiptapEditor
                                content={form.descriptionHtml}
                                onChange={(html) => setForm((p) => ({ ...p, descriptionHtml: html }))}
                                onAddGatedFileClick={() => setAttachmentToInsert(null)}
                                attachmentToInsert={attachmentToInsert}
                                onAttachmentInserted={() => setAttachmentToInsert(null)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <AdminImageUploadField
                                label="Webinar image (optional)"
                                value={form.imageUrl || ''}
                                onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                                allowUrlEdit
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required={!editingId}
                                type="url"
                                label={editingId ? 'Meeting link (optional if unchanged)' : 'Meeting link'}
                                value={form.meetingLink}
                                onChange={(e) => setForm((p) => ({ ...p, meetingLink: e.target.value }))}
                                helperText="Google Meet URL. Kept hidden from learners until join window opens."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                fullWidth
                                select
                                label="Mode"
                                value={form.mode}
                                onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value as WebinarForm['mode'] }))}
                            >
                                <MenuItem value="FREE">Free</MenuItem>
                                <MenuItem value="PAID">Paid</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                fullWidth
                                label="Price (INR)"
                                type="number"
                                disabled={form.mode === 'FREE'}
                                value={form.price}
                                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value || 0) }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                fullWidth
                                select
                                label="Audience"
                                value={form.audience}
                                onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value as WebinarForm['audience'] }))}
                            >
                                <MenuItem value="ALL">All users</MenuItem>
                                <MenuItem value="FREE_ONLY">Free users only</MenuItem>
                                <MenuItem value="PAID_SUBSCRIBERS">Paid subscribers (Gold/Full course)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Sort priority"
                                value={form.sortPriority}
                                onChange={(e) => setForm((p) => ({ ...p, sortPriority: Number(e.target.value || 0) }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Topics (comma separated)"
                                value={topicsText}
                                onChange={(e) => setTopicsText(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                type="datetime-local"
                                label="Starts at"
                                InputLabelProps={{ shrink: true }}
                                value={form.startsAt}
                                onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                type="datetime-local"
                                label="Ends at"
                                InputLabelProps={{ shrink: true }}
                                value={form.endsAt}
                                onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Join opens (minutes before start)"
                                value={form.joinWindowBeforeMinutes}
                                onChange={(e) => setForm((p) => ({ ...p, joinWindowBeforeMinutes: Number(e.target.value || 0) }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Join closes (minutes after end)"
                                value={form.joinWindowAfterMinutes}
                                onChange={(e) => setForm((p) => ({ ...p, joinWindowAfterMinutes: Number(e.target.value || 0) }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                select
                                label="Published"
                                value={form.isPublished ? 'YES' : 'NO'}
                                onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.value === 'YES' }))}
                            >
                                <MenuItem value="NO">No (Draft)</MenuItem>
                                <MenuItem value="YES">Yes (Visible to users)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                select
                                label="Archived"
                                value={form.isArchived ? 'YES' : 'NO'}
                                onChange={(e) => setForm((p) => ({ ...p, isArchived: e.target.value === 'YES' }))}
                            >
                                <MenuItem value="NO">No</MenuItem>
                                <MenuItem value="YES">Yes</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={resetForm}>Cancel</Button>
                    <Button onClick={() => void submit()} variant="contained" disabled={saving || !formValid}>
                        {saving ? 'Saving...' : editingId ? 'Update webinar' : 'Create webinar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminWebinarsPage;

