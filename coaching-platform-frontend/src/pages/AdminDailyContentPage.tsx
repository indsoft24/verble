// src/pages/AdminDailyContentPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container,
    Typography,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Chip,
    IconButton,
    Paper,

} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, isValid } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
    getAllDailyContentAdmin,
    createDailyContentAdmin,
    updateDailyContentAdmin,
    deleteDailyContentAdmin,
    type CreateDailyContentPayload
} from '../services/dailyContentAdminService';
import type { DailyContent } from '../services/dailyContentService';
import { getContentTypeConfig, type ContentType } from '../utils/contentTypeConfig';
import {
    DAILY_CONTENT_CATALOG,
    LEVEL_CARD_COLORS,
    contentMatchesCatalogSlot,
    getAdminCardDisplayTitle,
    apiTypeForAdminKey,
    resolveAdminKeyFromContent,
    getCatalogEntry,
    type AdminContentTypeKey,
} from '../utils/dailyContentTypeCatalog';
import { defaultMetadataForAdminKey } from '../utils/adminDailyContentDefaults';
import AdminDailyContentMetadataForm from '../components/admin/AdminDailyContentMetadataForm';
import AdminDailyContentBulkDialog from '../components/admin/AdminDailyContentBulkDialog';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

type DailyContentFormState = Partial<CreateDailyContentPayload> & {
    _id?: string;
    adminKey: AdminContentTypeKey;
};

const AdminDailyContentPage: React.FC = () => {
    const [content, setContent] = useState<DailyContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContentFormState | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

    const fetchContent = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (selectedDate) {
                params.date = format(selectedDate, 'yyyy-MM-dd');
            }
            const data = await getAllDailyContentAdmin(params);
            setContent(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load daily content.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleOpenDialog = (contentItem?: DailyContent) => {
        if (contentItem) {
            setIsEditMode(true);
            const adminKey = resolveAdminKeyFromContent(contentItem);
            const meta = {
                ...defaultMetadataForAdminKey(adminKey),
                ...(contentItem.metadata || {}),
            };
            setCurrentContent({
                _id: contentItem._id,
                adminKey,
                type: contentItem.type,
                date: contentItem.date,
                level: contentItem.level,
                title: contentItem.title,
                metadata: meta,
                isActive: contentItem.isActive,
            });
        } else {
            setIsEditMode(false);
            const adminKey: AdminContentTypeKey = 'WORD';
            setCurrentContent({
                adminKey,
                type: apiTypeForAdminKey(adminKey),
                date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                title: '',
                metadata: defaultMetadataForAdminKey(adminKey),
                isActive: true,
            });
        }
        setFormError(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentContent(null);
        setFormError(null);
        setIsEditMode(false);
    };

    const handleFormChange = (field: string, value: any) => {
        setCurrentContent(prev => {
            if (!prev) return null;
            if (field === 'metadata') {
                return { ...prev, metadata: { ...prev.metadata, ...value } };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleMetadataChange = (field: string, value: any) => {
        setCurrentContent(prev => {
            if (!prev) return null;
            return {
                ...prev,
                metadata: {
                    ...prev.metadata,
                    [field]: value
                }
            };
        });
    };

    const handleFormSubmit = async () => {
        if (!currentContent) return;

        if (!currentContent.type || !currentContent.date) {
            setFormError('Type and date are required.');
            return;
        }

        if (currentContent.type === 'PUZZLE') {
            const questions = currentContent.metadata?.questions || [];
            if (questions.length !== 5) {
                setFormError('Puzzle must have exactly 5 questions.');
                return;
            }
        }

        // Validate metadata based on type
        if (currentContent.type === 'WORD' || currentContent.type === 'PHRASE') {
            if (!currentContent.metadata?.text || !currentContent.metadata?.meaning_en || !currentContent.metadata?.meaning_hi) {
                setFormError('Text, English meaning, and Hindi meaning are required for words/phrases.');
                return;
            }
        } else if (currentContent.type === 'STORY') {
            if (!currentContent.metadata?.text_content) {
                setFormError('Story content is required.');
                return;
            }
        } else if (currentContent.type === 'CONVERSATION') {
            if (!currentContent.metadata?.dialogue || !Array.isArray(currentContent.metadata.dialogue) || currentContent.metadata.dialogue.length === 0) {
                setFormError('At least one dialogue entry is required for conversations.');
                return;
            }
        } else if (currentContent.type === 'VOCAB_SET') {
            const items = currentContent.metadata?.vocabItems || [];
            if (!Array.isArray(items) || !items.some((v: { word?: string }) => String(v?.word || '').trim())) {
                setFormError('Add at least one vocabulary word.');
                return;
            }
        } else if (currentContent.type === 'SCENE') {
            if (!String(currentContent.metadata?.explanation || '').trim()) {
                setFormError('Scene explanation is required.');
                return;
            }
        }

        const payload = { ...currentContent };
        if (payload.type === 'SCENE') {
            const headline = String(payload.metadata?.title || payload.title || '').trim();
            if (headline) {
                payload.title = headline;
            }
        }
        if (payload.type === 'STORY') {
            const storyTitle = String(payload.metadata?.title || '').trim();
            if (storyTitle) {
                payload.title = storyTitle;
            }
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            if (isEditMode && currentContent._id) {
                await updateDailyContentAdmin(currentContent._id, payload);
            } else {
                await createDailyContentAdmin(payload as CreateDailyContentPayload);
            }
            fetchContent();
            handleCloseDialog();
        } catch (err: any) {
            setFormError(err.response?.data?.message || err.message || 'Failed to save content.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await deleteDailyContentAdmin(deleteId);
            fetchContent();
            setDeleteId(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete content.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group content by date
    const contentByDate = useMemo(() => {
        const grouped: { [key: string]: DailyContent[] } = {};
        content.forEach(item => {
            const dateKey = format(parseISO(item.date), 'yyyy-MM-dd');
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(item);
        });
        return grouped;
    }, [content]);

    const handleAdminKeyChange = (adminKey: AdminContentTypeKey) => {
        const entry = getCatalogEntry(adminKey);
        setCurrentContent((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                adminKey,
                type: entry.apiType,
                metadata: defaultMetadataForAdminKey(adminKey),
                title: entry.apiType === 'SCENE' ? '' : prev.title,
            };
        });
    };

    // Render dynamic form based on type
    const renderDynamicForm = () => {
        if (!currentContent) return null;

        return (
            <AdminDailyContentMetadataForm
                type={currentContent.type || 'WORD'}
                metadata={(currentContent.metadata || {}) as Record<string, unknown>}
                displayTitle={currentContent.title || ''}
                onDisplayTitleChange={(value) =>
                    setCurrentContent((prev) => (prev ? { ...prev, title: value } : null))
                }
                onChange={handleMetadataChange}
            />
        );
    };


    return (
        <AdminLayout title="Daily Content Management">
            <Container maxWidth="xl">
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Daily Content Management
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            onClick={() => setBulkDialogOpen(true)}
                        >
                            Add Bulk Content
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add New Content
                        </Button>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {/* Calendar/Date Picker */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CalendarTodayIcon />
                        <Typography variant="h6">Select Date</Typography>
                    </Box>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="View content for date"
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue)}
                            sx={{ mt: 2, width: 300 }}
                        />
                    </LocalizationProvider>
                </Paper>

                {/* 12-slot catalog for selected date */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Content slots ({selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'today'})
                    </Typography>
                    <Grid container spacing={2}>
                        {DAILY_CONTENT_CATALOG.map((slot) => {
                            const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                            const item = content.find(
                                (c) =>
                                    format(parseISO(c.date), 'yyyy-MM-dd') === dateKey &&
                                    contentMatchesCatalogSlot(c, slot)
                            );
                            const colors = LEVEL_CARD_COLORS[slot.level];
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={slot.adminKey}>
                                    <Card
                                        sx={{
                                            border: `2px solid ${colors.borderColor}`,
                                            backgroundColor: colors.backgroundColor,
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => {
                                            if (item) {
                                                handleOpenDialog(item);
                                            } else {
                                                setIsEditMode(false);
                                                setCurrentContent({
                                                    adminKey: slot.adminKey,
                                                    type: apiTypeForAdminKey(slot.adminKey),
                                                    date: dateKey,
                                                    title: '',
                                                    metadata: defaultMetadataForAdminKey(slot.adminKey),
                                                    isActive: true,
                                                });
                                                setFormError(null);
                                                setOpenDialog(true);
                                            }
                                        }}
                                    >
                                        <CardContent>
                                            <Typography variant="subtitle2" fontWeight={700} color={colors.color}>
                                                {slot.label}
                                            </Typography>
                                            <Chip label={slot.level} size="small" sx={{ mt: 1, mr: 0.5 }} />
                                            {item ? (
                                                <>
                                                    <Chip label="Scheduled" color="success" size="small" sx={{ mt: 1 }} />
                                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                        {getAdminCardDisplayTitle(item)}
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                                    {slot.emptyHint}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>

                {/* Content List */}
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        {Object.keys(contentByDate).length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    No content found for the selected date.
                                </Typography>
                            </Paper>
                        ) : (
                            Object.entries(contentByDate).map(([date, items]) => (
                                <Box key={date} sx={{ mb: 4 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {items.map((item) => {
                                            const contentType = item.type as ContentType;
                                            const config = getContentTypeConfig(contentType);
                                            const IconComponent = config.icon;
                                            const slotLabel = getCatalogEntry(resolveAdminKeyFromContent(item)).label;

                                            return (
                                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item._id}>
                                                    <Card
                                                        sx={{
                                                            border: `2px solid ${config.borderColor}`,
                                                            backgroundColor: config.backgroundColor,
                                                        }}
                                                    >
                                                        <CardContent>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                        <IconComponent sx={{ fontSize: 24, color: config.color }} />
                                                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                                            {item.title}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                                                        <Chip
                                                                            label={slotLabel}
                                                                            size="small"
                                                                            color={config.chipColor}
                                                                            sx={{
                                                                                backgroundColor: config.color,
                                                                                color: 'white',
                                                                                fontWeight: 'bold'
                                                                            }}
                                                                        />
                                                                        <Chip label={item.level} size="small" color="secondary" />
                                                                        {!item.isActive && <Chip label="Inactive" size="small" />}
                                                                    </Box>
                                                                </Box>
                                                                <Box>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleOpenDialog(item)}
                                                                    >
                                                                        <EditIcon />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => setDeleteId(item._id)}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Box>
                                                            </Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Created: {format(parseISO(item.createdAt), 'MMM d, yyyy')}
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            ))
                        )}
                    </Box>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{isEditMode ? 'Edit Daily Content' : 'Add New Daily Content'}</DialogTitle>
                    <DialogContent dividers sx={{ pt: 2 }}>
                        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                        {currentContent && (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel id="daily-content-type-label">Type</InputLabel>
                                        <Select
                                            labelId="daily-content-type-label"
                                            value={currentContent.adminKey}
                                            label="Type"
                                            onChange={(e) =>
                                                handleAdminKeyChange(e.target.value as AdminContentTypeKey)
                                            }
                                        >
                                            {DAILY_CONTENT_CATALOG.map((slot) => (
                                                <MenuItem key={slot.adminKey} value={slot.adminKey}>
                                                    {slot.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="Date"
                                            value={currentContent.date ? parseISO(currentContent.date) : null}
                                            onChange={(newValue) => {
                                                if (newValue && isValid(newValue)) {
                                                    handleFormChange('date', format(newValue, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            sx={{ width: '100%' }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Alert severity="info">
                                        Level and display title (#1111+) are assigned automatically when you save.
                                    </Alert>
                                </Grid>
                                {isEditMode && (
                                    <Grid size={{ xs: 12 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={currentContent.isActive !== false}
                                                    onChange={(e) =>
                                                        handleFormChange('isActive', e.target.checked)
                                                    }
                                                />
                                            }
                                            label="Active (visible to learners)"
                                        />
                                    </Grid>
                                )}
                                {renderDynamicForm()}
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleFormSubmit} variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24} /> : isEditMode ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <AdminDailyContentBulkDialog
                    open={bulkDialogOpen}
                    onClose={() => setBulkDialogOpen(false)}
                    onImported={() => {
                        setBulkDialogOpen(false);
                        fetchContent();
                    }}
                    calendarDate={selectedDate}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>Are you sure you want to delete this content? This action cannot be undone.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button onClick={handleDelete} color="error" variant="contained" disabled={isSubmitting}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </AdminLayout>
    );
};

export default AdminDailyContentPage;
