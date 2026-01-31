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
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Chip,
    IconButton,
    Paper,
    LinearProgress
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

const CONTENT_TYPES = [
    'WORD',
    'PHRASE',
    'STORY',
    'VOCAB_SET',
    'CONVERSATION',
    'PUZZLE',
    'SCENE',
    'SPEECH',
    'LYRICS',
    'FEED'
] as const;

const LEVELS = ['FREE', 'BRONZE', 'SILVER', 'GOLD'] as const;

const AdminDailyContentPage: React.FC = () => {
    const [content, setContent] = useState<DailyContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentContent, setCurrentContent] = useState<(Partial<CreateDailyContentPayload> & { _id?: string }) | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
            setCurrentContent({
                _id: contentItem._id,
                type: contentItem.type,
                date: contentItem.date,
                level: contentItem.level,
                title: contentItem.title,
                metadata: contentItem.metadata,
                isActive: contentItem.isActive
            });
        } else {
            setIsEditMode(false);
            setCurrentContent({
                type: 'WORD',
                date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                level: 'FREE',
                title: '',
                metadata: {},
                isActive: true
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

        if (!currentContent.type || !currentContent.date || !currentContent.level || !currentContent.title) {
            setFormError('Type, date, level, and title are required.');
            return;
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
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            if (isEditMode && currentContent._id) {
                await updateDailyContentAdmin(currentContent._id, currentContent);
            } else {
                await createDailyContentAdmin(currentContent as CreateDailyContentPayload);
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

    // Render dynamic form based on type
    const renderDynamicForm = () => {
        if (!currentContent) return null;

        const type = currentContent.type;
        const metadata = currentContent.metadata || {};

        if (type === 'WORD' || type === 'PHRASE') {
            return (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Word/Phrase Text"
                            value={metadata.text || ''}
                            onChange={(e) => handleMetadataChange('text', e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="English Meaning"
                            value={metadata.meaning_en || ''}
                            onChange={(e) => handleMetadataChange('meaning_en', e.target.value)}
                            required
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Hindi Meaning"
                            value={metadata.meaning_hi || ''}
                            onChange={(e) => handleMetadataChange('meaning_hi', e.target.value)}
                            required
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Audio URL (Optional)"
                            value={metadata.audio || ''}
                            onChange={(e) => handleMetadataChange('audio', e.target.value)}
                        />
                    </Grid>
                    {type === 'WORD' && (
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Part of Speech (Optional)"
                                placeholder="e.g., noun, verb, adjective"
                                value={metadata.partOfSpeech || ''}
                                onChange={(e) => handleMetadataChange('partOfSpeech', e.target.value)}
                                helperText="e.g., noun, verb, adjective, adverb"
                            />
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Examples (Optional)</Typography>
                        <Button
                            size="small"
                            onClick={() => {
                                const examples = metadata.examples || [];
                                handleMetadataChange('examples', [...examples, { en: '', hi: '', audio: '' }]);
                            }}
                        >
                            Add Example
                        </Button>
                        {(metadata.examples || []).map((example: any, idx: number) => (
                            <Box key={idx} sx={{ mt: 1, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                <TextField
                                    fullWidth
                                    label="English"
                                    value={example.en || ''}
                                    onChange={(e) => {
                                        const examples = [...(metadata.examples || [])];
                                        examples[idx] = { ...examples[idx], en: e.target.value };
                                        handleMetadataChange('examples', examples);
                                    }}
                                    sx={{ mb: 1 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Hindi"
                                    value={example.hi || ''}
                                    onChange={(e) => {
                                        const examples = [...(metadata.examples || [])];
                                        examples[idx] = { ...examples[idx], hi: e.target.value };
                                        handleMetadataChange('examples', examples);
                                    }}
                                />
                            </Box>
                        ))}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Synonyms (comma-separated)"
                            value={Array.isArray(metadata.synonyms) ? metadata.synonyms.join(', ') : ''}
                            onChange={(e) => handleMetadataChange('synonyms', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Antonyms (comma-separated)"
                            value={Array.isArray(metadata.antonyms) ? metadata.antonyms.join(', ') : ''}
                            onChange={(e) => handleMetadataChange('antonyms', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        />
                    </Grid>
                </Grid>
            );
        }

        if (type === 'STORY') {
            return (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Story Title"
                            value={metadata.title || ''}
                            onChange={(e) => handleMetadataChange('title', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Story Content"
                            value={metadata.text_content || ''}
                            onChange={(e) => handleMetadataChange('text_content', e.target.value)}
                            required
                            multiline
                            rows={10}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Audio URL (Optional)"
                            value={metadata.audio || ''}
                            onChange={(e) => handleMetadataChange('audio', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Moral (English)"
                            value={metadata.moral_en || ''}
                            onChange={(e) => handleMetadataChange('moral_en', e.target.value)}
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Moral (Hindi)"
                            value={metadata.moral_hi || ''}
                            onChange={(e) => handleMetadataChange('moral_hi', e.target.value)}
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Sentence Translations (Hindi) - One per line, matching story sentences
                        </Typography>
                        <TextField
                            fullWidth
                            label="Hindi Translations"
                            value={Array.isArray(metadata.sentence_translations) 
                                ? metadata.sentence_translations.join('\n') 
                                : ''}
                            onChange={(e) => {
                                const translations = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
                                handleMetadataChange('sentence_translations', translations);
                            }}
                            multiline
                            rows={8}
                            helperText="Enter Hindi translation for each sentence, one per line. Order should match the story sentences."
                        />
                    </Grid>
                </Grid>
            );
        }

        if (type === 'CONVERSATION') {
            return (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Participants (comma-separated)"
                            value={Array.isArray(metadata.participants) ? metadata.participants.join(', ') : ''}
                            onChange={(e) => handleMetadataChange('participants', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                            helperText="e.g., Waiter, Customer"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Dialogue</Typography>
                        <Button
                            size="small"
                            onClick={() => {
                                const dialogue = metadata.dialogue || [];
                                handleMetadataChange('dialogue', [...dialogue, { speaker: '', text_en: '', text_hi: '', audio: '' }]);
                            }}
                        >
                            Add Dialogue Entry
                        </Button>
                        {(metadata.dialogue || []).map((dialogue: any, idx: number) => (
                            <Box key={idx} sx={{ mt: 1, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Speaker"
                                    value={dialogue.speaker || ''}
                                    onChange={(e) => {
                                        const dialogueList = [...(metadata.dialogue || [])];
                                        dialogueList[idx] = { ...dialogueList[idx], speaker: e.target.value };
                                        handleMetadataChange('dialogue', dialogueList);
                                    }}
                                    sx={{ mb: 1 }}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="English Text"
                                    value={dialogue.text_en || ''}
                                    onChange={(e) => {
                                        const dialogueList = [...(metadata.dialogue || [])];
                                        dialogueList[idx] = { ...dialogueList[idx], text_en: e.target.value };
                                        handleMetadataChange('dialogue', dialogueList);
                                    }}
                                    sx={{ mb: 1 }}
                                    required
                                    multiline
                                    rows={2}
                                />
                                <TextField
                                    fullWidth
                                    label="Hindi Text"
                                    value={dialogue.text_hi || ''}
                                    onChange={(e) => {
                                        const dialogueList = [...(metadata.dialogue || [])];
                                        dialogueList[idx] = { ...dialogueList[idx], text_hi: e.target.value };
                                        handleMetadataChange('dialogue', dialogueList);
                                    }}
                                    sx={{ mb: 1 }}
                                    required
                                    multiline
                                    rows={2}
                                />
                                <TextField
                                    fullWidth
                                    label="Audio URL (Optional)"
                                    value={dialogue.audio || ''}
                                    onChange={(e) => {
                                        const dialogueList = [...(metadata.dialogue || [])];
                                        dialogueList[idx] = { ...dialogueList[idx], audio: e.target.value };
                                        handleMetadataChange('dialogue', dialogueList);
                                    }}
                                />
                            </Box>
                        ))}
                    </Grid>
                </Grid>
            );
        }

        // Default form for other types
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Metadata (JSON)"
                        value={JSON.stringify(metadata, null, 2)}
                        onChange={(e) => {
                            try {
                                const parsed = JSON.parse(e.target.value);
                                handleMetadataChange('', parsed);
                            } catch {
                                // Invalid JSON, ignore
                            }
                        }}
                        multiline
                        rows={10}
                        helperText="Enter metadata as JSON"
                    />
                </Grid>
            </Grid>
        );
    };

    return (
        <AdminLayout title="Daily Content Management">
            <Container maxWidth="xl">
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Daily Content Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add New Content
                    </Button>
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
                                            
                                            return (
                                            <Grid item xs={12} md={6} lg={4} key={item._id}>
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
                                                                        label={item.type} 
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
                    <DialogContent>
                        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                        {currentContent && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            value={currentContent.type || ''}
                                            label="Type"
                                            onChange={(e) => handleFormChange('type', e.target.value)}
                                        >
                                            {CONTENT_TYPES.map(type => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
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
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Level</InputLabel>
                                        <Select
                                            value={currentContent.level || ''}
                                            label="Level"
                                            onChange={(e) => handleFormChange('level', e.target.value)}
                                        >
                                            {LEVELS.map(level => (
                                                <MenuItem key={level} value={level}>{level}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Title"
                                        value={currentContent.title || ''}
                                        onChange={(e) => handleFormChange('title', e.target.value)}
                                        required
                                    />
                                </Grid>
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
