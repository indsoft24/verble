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
    Tabs,
    Tab,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, isValid } from 'date-fns';
import { toScheduleDateKey, toScheduleDateParam } from '../utils/scheduleDateUtils';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
    getAllDailyContentAdmin,
    getDailyContentSequencePreviewAdmin,
    createDailyContentAdmin,
    DailyContentDuplicateError,
    updateDailyContentAdmin,
    deleteDailyContentAdmin,
    type CreateDailyContentPayload,
    type DailyContentPagination,
    type DailyContentAdminListParams,
    type DailyContentSequencePreview,
} from '../services/dailyContentAdminService';
import { buildAutoDisplayTitle, getDisplayTag } from '../utils/dailyContentDisplayNumber';
import AdminDailyContentBrowsePanel, {
    defaultBrowseFilters,
    type BrowseFilters,
} from '../components/admin/AdminDailyContentBrowsePanel';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import TableRowsIcon from '@mui/icons-material/TableRows';
import type { DailyContent } from '../services/dailyContentService';
import { getContentTypeConfig, type ContentType } from '../utils/contentTypeConfig';
import {
    DAILY_CONTENT_CATALOG,
    LEVEL_CARD_COLORS,
    contentMatchesCatalogSlot,
    getAdminContentPreview,
    resolveAdminKeyFromContent,
    getCatalogEntry,
    findContentForSlot,
    findSlotConflictOnDate,
    type AdminContentTypeKey,
} from '../utils/dailyContentTypeCatalog';
import { defaultMetadataForAdminKey } from '../utils/adminDailyContentDefaults';
import { normalizeQuestionOptions } from '../utils/quizOptionUtils';
import AdminDailyContentMetadataForm from '../components/admin/AdminDailyContentMetadataForm';
import AdminDailyContentBulkDialog from '../components/admin/AdminDailyContentBulkDialog';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

type DailyContentFormState = Partial<CreateDailyContentPayload> & {
    _id?: string;
    adminKey: AdminContentTypeKey;
    sequenceNumber?: number;
};

type ViewMode = 'daily' | 'browse';

const AdminDailyContentPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [content, setContent] = useState<DailyContent[]>([]);
    const [browseContent, setBrowseContent] = useState<DailyContent[]>([]);
    const [browsePagination, setBrowsePagination] = useState<DailyContentPagination | null>(null);
    const [browseFilters, setBrowseFilters] = useState<BrowseFilters>(defaultBrowseFilters);
    const [browsePage, setBrowsePage] = useState(0);
    const [browseRowsPerPage, setBrowseRowsPerPage] = useState(25);
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
    const [sequenceInfo, setSequenceInfo] = useState<DailyContentSequencePreview | null>(null);
    const [sequenceLoading, setSequenceLoading] = useState(false);
    const [slotDuplicateMessage, setSlotDuplicateMessage] = useState<string | null>(null);

    const buildBrowseParams = useCallback(
        (filters: BrowseFilters, pageIndex: number, rows: number): DailyContentAdminListParams => {
            const params: DailyContentAdminListParams = {
                page: pageIndex + 1,
                limit: rows,
                sortOrder: filters.sortOrder,
            };
            if (filters.startDate) {
                params.scheduleStartDate = toScheduleDateParam(filters.startDate);
            }
            if (filters.endDate) {
                params.scheduleEndDate = toScheduleDateParam(filters.endDate);
            }
            if (filters.level) params.level = filters.level;
            if (filters.type) params.type = filters.type;
            if (filters.search.trim()) params.search = filters.search.trim();
            if (filters.isActive) params.isActive = filters.isActive;
            return params;
        },
        []
    );

    const fetchDailyContent = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: DailyContentAdminListParams = {};
            if (selectedDate) {
                params.date = format(selectedDate, 'yyyy-MM-dd');
            }
            const { content: data } = await getAllDailyContentAdmin(params);
            setContent(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load daily content.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    const fetchBrowseContent = useCallback(
        async (filtersOverride?: BrowseFilters, pageIndex?: number) => {
            const filters = filtersOverride ?? browseFilters;
            const pageIdx = pageIndex ?? browsePage;
            setIsLoading(true);
            setError(null);
            try {
                const result = await getAllDailyContentAdmin(
                    buildBrowseParams(filters, pageIdx, browseRowsPerPage)
                );
                setBrowseContent(result.content);
                setBrowsePagination(result.pagination ?? null);
            } catch (err: any) {
                setError(err.message || 'Failed to load content.');
            } finally {
                setIsLoading(false);
            }
        },
        [browseFilters, browsePage, browseRowsPerPage, buildBrowseParams]
    );

    const handleApplyBrowseFilters = (patch?: Partial<BrowseFilters>) => {
        const merged = patch ? { ...browseFilters, ...patch } : browseFilters;
        if (patch) {
            setBrowseFilters(merged);
        }
        setBrowsePage(0);
        fetchBrowseContent(merged, 0);
    };

    const handleResetBrowseFilters = () => {
        const defaults = defaultBrowseFilters();
        setBrowseFilters(defaults);
        setBrowsePage(0);
        fetchBrowseContent(defaults, 0);
    };

    const refreshCurrentView = useCallback(() => {
        if (viewMode === 'daily') {
            fetchDailyContent();
        } else {
            fetchBrowseContent();
        }
    }, [viewMode, fetchDailyContent, fetchBrowseContent]);

    useEffect(() => {
        if (viewMode === 'daily') {
            fetchDailyContent();
        }
    }, [viewMode, fetchDailyContent]);

    useEffect(() => {
        if (viewMode === 'browse') {
            fetchBrowseContent();
        }
    }, [viewMode, fetchBrowseContent]);

    useEffect(() => {
        if (!openDialog || !currentContent) {
            setSequenceInfo(null);
            return;
        }

        const entry = getCatalogEntry(currentContent.adminKey);
        const apiType = entry.apiType;
        const catalogLevel = entry.level;
        const puzzleType =
            entry.puzzleType ||
            (currentContent.metadata as { puzzleType?: string } | undefined)?.puzzleType;

        if (isEditMode && currentContent.sequenceNumber) {
            const seq = currentContent.sequenceNumber;
            setSequenceInfo({
                sequenceNumber: seq,
                displayTag: getDisplayTag(seq),
                displayTitle:
                    currentContent.title?.trim() ||
                    buildAutoDisplayTitle(apiType, seq, currentContent.metadata as Record<string, unknown>),
                level: currentContent.level || catalogLevel,
            });
            setSequenceLoading(false);
            return;
        }

        let cancelled = false;
        setSequenceLoading(true);
        getDailyContentSequencePreviewAdmin(apiType, catalogLevel, puzzleType)
            .then((data) => {
                if (!cancelled) setSequenceInfo(data);
            })
            .catch(() => {
                if (!cancelled) setSequenceInfo(null);
            })
            .finally(() => {
                if (!cancelled) setSequenceLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [
        openDialog,
        isEditMode,
        currentContent?.adminKey,
        currentContent?.sequenceNumber,
        currentContent?.title,
        currentContent?.level,
        currentContent?.metadata,
    ]);

    const loadContentIntoEditForm = useCallback((contentItem: DailyContent, duplicateNote?: string) => {
        const adminKey = resolveAdminKeyFromContent(contentItem);
        const meta = {
            ...defaultMetadataForAdminKey(adminKey),
            ...(contentItem.metadata || {}),
        };
        const dateKey = toScheduleDateKey(contentItem.date);
        setIsEditMode(true);
        setCurrentContent({
            _id: contentItem._id,
            adminKey,
            type: contentItem.type,
            date: dateKey,
            level: contentItem.level,
            title: contentItem.title,
            sequenceNumber: contentItem.sequenceNumber,
            metadata: meta,
            isActive: contentItem.isActive,
        });
        setSlotDuplicateMessage(
            duplicateNote ||
                `Content for "${getCatalogEntry(adminKey).label}" is already scheduled on ${dateKey}. Edit the existing entry below.`
        );
        setFormError(null);
    }, []);

    /** Resolve one catalog slot for a date: load existing item or blank create form. */
    const applySlotSelection = useCallback(
        (adminKey: AdminContentTypeKey, dateStr: string) => {
            if (!dateStr) return;

            const slot = getCatalogEntry(adminKey);
            const existing = findContentForSlot(content, dateStr, slot);

            if (existing) {
                loadContentIntoEditForm(
                    existing,
                    `Content for "${slot.label}" is already scheduled on ${dateStr}. Edit the existing entry below.`
                );
                return;
            }

            setIsEditMode(false);
            setSlotDuplicateMessage(null);
            setFormError(null);
            const entry = getCatalogEntry(adminKey);
            setCurrentContent({
                adminKey,
                type: entry.apiType,
                date: dateStr,
                title: '',
                metadata: defaultMetadataForAdminKey(adminKey),
                isActive: true,
            });
        },
        [content, loadContentIntoEditForm]
    );

    const formatSlotConflictMessage = useCallback((adminKey: AdminContentTypeKey, dateStr: string) => {
        const label = getCatalogEntry(adminKey).label;
        const displayDate = format(parseISO(dateStr), 'MMMM d, yyyy');
        return `${label} is already scheduled on ${displayDate}. Choose a different date.`;
    }, []);

    const resolveItemsForSlotCheck = useCallback(
        async (dateStr: string): Promise<DailyContent[]> => {
            const merged = [...content, ...browseContent];
            const seen = new Set<string>();
            const local = merged.filter((item) => {
                if (!item._id || seen.has(item._id)) return false;
                seen.add(item._id);
                return true;
            });
            const hasDateLocally = local.some(
                (item) => toScheduleDateKey(item.date) === dateStr
            );
            if (hasDateLocally) return local;
            const { content: fetched } = await getAllDailyContentAdmin({ date: dateStr });
            return fetched;
        },
        [content, browseContent]
    );

    const checkSlotAssignable = useCallback(
        async (
            dateStr: string,
            adminKey: AdminContentTypeKey,
            excludeId?: string
        ): Promise<DailyContent | undefined> => {
            const items = await resolveItemsForSlotCheck(dateStr);
            return findSlotConflictOnDate(items, dateStr, adminKey, excludeId);
        },
        [resolveItemsForSlotCheck]
    );

    const handleDatePickerChange = useCallback(
        async (newValue: Date | null) => {
            if (!newValue || !isValid(newValue) || !currentContent?.adminKey) return;

            const dateStr = format(newValue, 'yyyy-MM-dd');
            if (currentContent.date === dateStr) return;

            try {
                const conflict = await checkSlotAssignable(
                    dateStr,
                    currentContent.adminKey,
                    currentContent._id
                );
                if (conflict) {
                    setFormError(formatSlotConflictMessage(currentContent.adminKey, dateStr));
                    setSlotDuplicateMessage(null);
                    return;
                }

                setFormError(null);
                setSlotDuplicateMessage(null);
                setCurrentContent((prev) => (prev ? { ...prev, date: dateStr } : null));
            } catch {
                setFormError('Could not verify date availability. Please try again.');
            }
        },
        [currentContent, checkSlotAssignable, formatSlotConflictMessage]
    );

    const handleOpenDialog = (contentItem?: DailyContent, initialAdminKey?: AdminContentTypeKey) => {
        setFormError(null);
        const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

        if (contentItem) {
            loadContentIntoEditForm(contentItem);
            setSlotDuplicateMessage(null);
        } else {
            applySlotSelection(initialAdminKey ?? 'WORD', dateStr);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentContent(null);
        setFormError(null);
        setIsEditMode(false);
        setSlotDuplicateMessage(null);
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
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i] as { question?: string; prompt?: string; options?: string[] };
                const text = String(q.question ?? q.prompt ?? '').trim();
                const opts = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
                if (!text) {
                    setFormError(`Question ${i + 1}: question text is required.`);
                    return;
                }
                if (opts.length < 2) {
                    setFormError(`Question ${i + 1}: add at least two answer choices.`);
                    return;
                }
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
            const dialogue = (currentContent.metadata?.dialogue || []) as {
                speaker?: string;
                text_en?: string;
            }[];
            const filled = dialogue.filter(
                (l) => String(l.text_en || '').trim() && String(l.speaker || '').trim()
            );
            if (filled.length === 0) {
                setFormError('Add at least one dialogue line with speaker and English text.');
                return;
            }
            if (currentContent.adminKey !== 'PROFESSIONAL_CONVERSATION') {
                if (!String(currentContent.metadata?.participant1 || '').trim() ||
                    !String(currentContent.metadata?.participant2 || '').trim()) {
                    setFormError('Person 1 and Person 2 are required.');
                    return;
                }
                if (!String(currentContent.metadata?.scenarioTitle || currentContent.title || '').trim()) {
                    setFormError('Scenario title is required.');
                    return;
                }
            }
        } else if (currentContent.type === 'VOCAB_SET') {
            if (!String(currentContent.metadata?.theme || '').trim()) {
                setFormError('Theme is required for vocabulary sets.');
                return;
            }
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
        if (payload.type === 'PUZZLE' && payload.metadata?.questions) {
            payload.metadata = {
                ...payload.metadata,
                questions: (payload.metadata.questions as { question?: string; prompt?: string; options?: string[]; correct_idx?: number }[]).map(
                    (q) => {
                        const { options, correctIndex } = normalizeQuestionOptions(
                            q.options,
                            q.correct_idx ?? 0
                        );
                        return {
                            question: String(q.question ?? q.prompt ?? '').trim(),
                            options,
                            correct_idx: correctIndex,
                        };
                    }
                ),
            };
        }
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
        if (payload.type === 'CONVERSATION' && payload.metadata) {
            const p1 = String(payload.metadata.participant1 || '').trim();
            const p2 = String(payload.metadata.participant2 || '').trim();
            const rawDialogue = (payload.metadata.dialogue || []) as {
                speaker?: string;
                text_en?: string;
                text_hi?: string;
                audio?: string;
            }[];
            payload.metadata = {
                ...payload.metadata,
                dialogue: rawDialogue
                    .filter((l) => String(l.text_en || '').trim())
                    .map((l) => ({
                        speaker: String(l.speaker || p1).trim(),
                        text_en: String(l.text_en || '').trim(),
                        text_hi: String(l.text_hi || '').trim(),
                        ...(l.audio ? { audio: String(l.audio).trim() } : {}),
                    })),
                participants: [p1, p2].filter(Boolean),
            };
            if (payload.adminKey !== 'PROFESSIONAL_CONVERSATION') {
                const scenario = String(payload.metadata.scenarioTitle || payload.title || '').trim();
                if (scenario) {
                    payload.title = scenario;
                    payload.metadata.scenarioTitle = scenario;
                }
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
            refreshCurrentView();
            handleCloseDialog();
        } catch (err: unknown) {
            if (err instanceof DailyContentDuplicateError) {
                setFormError(err.message);
                refreshCurrentView();
                return;
            }
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setFormError(
                axiosErr.response?.data?.message || axiosErr.message || 'Failed to save content.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await deleteDailyContentAdmin(deleteId);
            refreshCurrentView();
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
            const dateKey = toScheduleDateKey(item.date);
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(item);
        });
        return grouped;
    }, [content]);

    const handleAdminKeyChange = async (adminKey: AdminContentTypeKey) => {
        if (!currentContent) return;

        const dateStr =
            currentContent.date ||
            (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));

        try {
            const conflict = await checkSlotAssignable(dateStr, adminKey, currentContent._id);
            if (conflict) {
                setFormError(formatSlotConflictMessage(adminKey, dateStr));
                setSlotDuplicateMessage(null);
                return;
            }

            setFormError(null);
            setSlotDuplicateMessage(null);
            const entry = getCatalogEntry(adminKey);

            if (isEditMode && currentContent._id) {
                setCurrentContent((prev) =>
                    prev
                        ? {
                              ...prev,
                              adminKey,
                              type: entry.apiType,
                              level: entry.level,
                              metadata: {
                                  ...defaultMetadataForAdminKey(adminKey),
                                  ...(prev.metadata || {}),
                              },
                          }
                        : null
                );
                return;
            }

            setCurrentContent((prev) =>
                prev
                    ? {
                          ...prev,
                          adminKey,
                          type: entry.apiType,
                          level: entry.level,
                          date: dateStr,
                          title: '',
                          metadata: defaultMetadataForAdminKey(adminKey),
                      }
                    : null
            );
        } catch {
            setFormError('Could not verify type availability for this date. Please try again.');
        }
    };

    // Render dynamic form based on type
    const renderDynamicForm = () => {
        if (!currentContent) return null;

        return (
            <AdminDailyContentMetadataForm
                type={currentContent.type || 'WORD'}
                adminKey={currentContent.adminKey}
                metadata={(currentContent.metadata || {}) as Record<string, unknown>}
                displayTitle={currentContent.title || ''}
                syncKey={currentContent._id ?? `new-${currentContent.adminKey ?? currentContent.type}`}
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

                {error && viewMode === 'daily' && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Tabs
                        value={viewMode}
                        onChange={(_, value: ViewMode) => setViewMode(value)}
                        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab icon={<ViewDayIcon />} iconPosition="start" label="Daily schedule" value="daily" />
                        <Tab icon={<TableRowsIcon />} iconPosition="start" label="Browse all content" value="browse" />
                    </Tabs>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary">
                            {viewMode === 'daily'
                                ? 'Plan and edit the 12 content slots for a single day.'
                                : 'Search, filter by date range, and paginate through all scheduled content.'}
                        </Typography>
                    </Box>
                </Paper>

                {viewMode === 'browse' ? (
                    <AdminDailyContentBrowsePanel
                        content={browseContent}
                        pagination={browsePagination}
                        isLoading={isLoading}
                        error={error}
                        filters={browseFilters}
                        page={browsePage}
                        rowsPerPage={browseRowsPerPage}
                        onFiltersChange={(patch) => setBrowseFilters((prev) => ({ ...prev, ...patch }))}
                        onPageChange={setBrowsePage}
                        onRowsPerPageChange={setBrowseRowsPerPage}
                        onApplyFilters={handleApplyBrowseFilters}
                        onResetFilters={handleResetBrowseFilters}
                        onEdit={handleOpenDialog}
                        onDelete={setDeleteId}
                    />
                ) : (
                    <>
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
                                    toScheduleDateKey(c.date) === dateKey &&
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
                                                handleOpenDialog(undefined, slot.adminKey);
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
                                                    <Typography
                                                        variant="caption"
                                                        display="block"
                                                        sx={{ mt: 1, lineHeight: 1.45 }}
                                                        title={getAdminContentPreview(item)}
                                                    >
                                                        {getAdminContentPreview(item)}
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
                                                                        <Typography
                                                                            variant="body1"
                                                                            sx={{
                                                                                fontWeight: 600,
                                                                                lineHeight: 1.45,
                                                                                display: '-webkit-box',
                                                                                WebkitLineClamp: 2,
                                                                                WebkitBoxOrient: 'vertical',
                                                                                overflow: 'hidden',
                                                                            }}
                                                                            title={getAdminContentPreview(item)}
                                                                        >
                                                                            {getAdminContentPreview(item)}
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
                    </>
                )}

                {/* Add/Edit Dialog */}
                <Dialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    maxWidth={currentContent?.type === 'PUZZLE' ? 'lg' : 'md'}
                    fullWidth
                >
                    <DialogTitle>
                        {isEditMode ? 'Edit' : 'Add'} —{' '}
                        {currentContent
                            ? getCatalogEntry(currentContent.adminKey).label
                            : 'Daily Content'}
                    </DialogTitle>
                    <DialogContent dividers sx={{ pt: 2 }}>
                        {slotDuplicateMessage && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                {slotDuplicateMessage}
                            </Alert>
                        )}
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
                                            {DAILY_CONTENT_CATALOG.map((slot) => {
                                                const dateKey = currentContent.date;
                                                const scheduled =
                                                    dateKey &&
                                                    findContentForSlot(content, dateKey, slot);
                                                return (
                                                    <MenuItem key={slot.adminKey} value={slot.adminKey}>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                width: '100%',
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <span>{slot.label}</span>
                                                            {scheduled ? (
                                                                <Chip
                                                                    label="Scheduled"
                                                                    size="small"
                                                                    color="success"
                                                                    sx={{ height: 22 }}
                                                                />
                                                            ) : null}
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="Date"
                                            value={currentContent.date ? parseISO(currentContent.date) : null}
                                            onChange={(newValue) => {
                                                void handleDatePickerChange(newValue);
                                            }}
                                            sx={{ width: '100%' }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Alert
                                        severity="info"
                                        icon={false}
                                        sx={{
                                            '& .MuiAlert-message': { width: '100%' },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                gap: 1.5,
                                            }}
                                        >
                                            {sequenceLoading ? (
                                                <CircularProgress size={20} />
                                            ) : sequenceInfo ? (
                                                <Chip
                                                    label={sequenceInfo.displayTag}
                                                    color="primary"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        fontWeight: 700,
                                                        fontSize: '0.95rem',
                                                    }}
                                                />
                                            ) : null}
                                            <Box sx={{ flex: 1, minWidth: 200 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {isEditMode
                                                        ? 'Display number & level'
                                                        : 'Next display number on save'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {sequenceLoading
                                                        ? 'Calculating next number…'
                                                        : sequenceInfo
                                                          ? isEditMode
                                                            ? `Level ${sequenceInfo.level}. Display title: ${sequenceInfo.displayTitle}. This number is fixed for this item.`
                                                            : `Level ${sequenceInfo.level} is assigned automatically. Saving will use display title ${sequenceInfo.displayTitle} unless you enter a custom title (e.g. story headline).`
                                                          : 'Could not preview the display number. It will still be assigned when you save.'}
                                                </Typography>
                                            </Box>
                                        </Box>
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
                        refreshCurrentView();
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
