// src/pages/AdminSentenceValidationPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container,
    Typography,
    Box,
    Paper,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    List,
    ListItem,
    FormControlLabel,
    Checkbox,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    alpha,
    Slider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import CommentIcon from '@mui/icons-material/Comment';
import {
    getPendingSubmissions,
    getAllSubmissions,
    validateSubmission,
    validateStorySentences,
    validateVocabSentences,
    validateSceneSubmission,
    type SentenceSubmission,
} from '../services/sentenceValidationService';
import VocabSubmissionPreview from '../components/admin/VocabSubmissionPreview';
import { formatVocabSubmissionPlain, normalizeVocabSentences } from '../utils/vocabSubmissionDisplay';
import {
    formatSceneSummariesForAdmin,
    getSceneSubmissionSummaries,
    SCENE_MAX_EVALUATION_SCORE,
} from '../utils/sceneActivityUtils';
import { format } from 'date-fns';
import {
    VALIDATION_ACTIVITY_TABS,
    getActivityRowLabel,
    getContentTypeLabel,
    getLinkedContentType,
    getOriginalReferenceText,
    getUserPhone,
    getValidationContentDetails,
    submissionMatchesTab,
    type ValidationTabId,
} from '../utils/validationActivityTabs';
import { getContentTypeConfig, type ContentType } from '../utils/contentTypeConfig';

type SubmissionStatus = 'all' | 'pending' | 'reviewed';

const AdminSentenceValidationPage: React.FC = () => {
    const [submissions, setSubmissions] = useState<SentenceSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ValidationTabId>('sentence');
    const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus>('pending');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const [selectedSubmission, setSelectedSubmission] = useState<SentenceSubmission | null>(null);
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationFeedback, setValidationFeedback] = useState('');
    const [isCorrect, setIsCorrect] = useState<boolean>(true);
    const [storySentenceValidations, setStorySentenceValidations] = useState<boolean[]>([]);
    const [vocabSentenceValidations, setVocabSentenceValidations] = useState<boolean[]>([]);
    const [sceneEvaluationScore, setSceneEvaluationScore] = useState(0);

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const tab = VALIDATION_ACTIVITY_TABS.find((t) => t.id === activeTab);
            const singleType =
                tab && tab.submissionTypes.length === 1 ? tab.submissionTypes[0] : undefined;

            let fetched: SentenceSubmission[];
            if (selectedStatus === 'pending') {
                fetched = await getPendingSubmissions(singleType, 500);
            } else {
                fetched = await getAllSubmissions(singleType, selectedStatus, 500);
            }

            fetched.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setSubmissions(fetched);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load submissions.');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, selectedStatus]);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('adminSentenceValidationView');
            if (raw) {
                const saved = JSON.parse(raw) as { activeTab?: ValidationTabId; selectedStatus?: SubmissionStatus };
                if (saved.activeTab) setActiveTab(saved.activeTab);
                if (saved.selectedStatus) setSelectedStatus(saved.selectedStatus);
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const filteredSubmissions = useMemo(
        () => submissions.filter((s) => submissionMatchesTab(s, activeTab)),
        [submissions, activeTab]
    );

    const getSubmissionContent = (submission: SentenceSubmission) => {
        switch (submission.submissionType) {
            case 'sentence':
                return submission.sentence || '';
            case 'story':
                return submission.summary?.join('\n') || '';
            case 'vocab':
                return formatVocabSubmissionPlain(submission.sentences);
            case 'scene':
                return formatSceneSummariesForAdmin(getSceneSubmissionSummaries(submission));
            case 'speech':
                return submission.description || submission.sentences?.join('\n') || '';
            default:
                return '';
        }
    };

    const handleOpenValidationDialog = (submission: SentenceSubmission) => {
        sessionStorage.setItem(
            'adminSentenceValidationView',
            JSON.stringify({ activeTab, selectedStatus })
        );
        setSelectedSubmission(submission);
        setIsCorrect(true);
        setValidationFeedback(submission.feedback || '');
        if (submission.submissionType === 'story' && submission.summary) {
            const existing = submission.sentenceValidations || [];
            setStorySentenceValidations(
                submission.summary.map((_, idx) => {
                    const found = existing.find((v) => v.sentenceIndex === idx);
                    return found ? found.isCorrect : true;
                })
            );
            setVocabSentenceValidations([]);
            setSceneEvaluationScore(0);
        } else if (submission.submissionType === 'vocab') {
            const entries = normalizeVocabSentences(submission.sentences);
            const existing = submission.sentenceValidations || [];
            setVocabSentenceValidations(
                entries.map((_, idx) => {
                    const found = existing.find((v) => v.sentenceIndex === idx);
                    return found ? found.isCorrect : true;
                })
            );
            setStorySentenceValidations([]);
            setSceneEvaluationScore(0);
        } else if (submission.submissionType === 'scene') {
            const reviewed = submission.evaluationPoints ?? submission.pointsEarned;
            setSceneEvaluationScore(
                typeof reviewed === 'number' && submission.reviewedAt ? reviewed : 0
            );
            setStorySentenceValidations([]);
            setVocabSentenceValidations([]);
        } else {
            setStorySentenceValidations([]);
            setVocabSentenceValidations([]);
            setSceneEvaluationScore(0);
        }
        setValidationDialogOpen(true);
    };

    const handleCloseValidationDialog = () => {
        setValidationDialogOpen(false);
        setSelectedSubmission(null);
        setValidationFeedback('');
        setStorySentenceValidations([]);
        setVocabSentenceValidations([]);
        setSceneEvaluationScore(0);
    };

    const handleQuickValidate = async (submission: SentenceSubmission, correct: boolean) => {
        if (
            submission.submissionType === 'story' ||
            submission.submissionType === 'vocab' ||
            submission.submissionType === 'scene'
        ) {
            handleOpenValidationDialog(submission);
            return;
        }
        setActionLoadingId(submission._id);
        setError(null);
        try {
            await validateSubmission(submission._id, { isCorrect: correct });
            await fetchSubmissions();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to validate submission.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleValidate = async () => {
        if (!selectedSubmission) return;

        setIsValidating(true);
        try {
            if (selectedSubmission.submissionType === 'story' && selectedSubmission.summary) {
                const sentenceValidations = storySentenceValidations.map((ok, index) => ({
                    sentenceIndex: index,
                    isCorrect: ok,
                }));
                await validateStorySentences(selectedSubmission._id, {
                    sentenceValidations,
                    feedback: validationFeedback || undefined,
                });
            } else if (selectedSubmission.submissionType === 'vocab') {
                const sentenceValidations = vocabSentenceValidations.map((ok, index) => ({
                    sentenceIndex: index,
                    isCorrect: ok,
                }));
                await validateVocabSentences(selectedSubmission._id, {
                    sentenceValidations,
                    feedback: validationFeedback || undefined,
                });
            } else if (selectedSubmission.submissionType === 'scene') {
                await validateSceneSubmission(selectedSubmission._id, {
                    score: sceneEvaluationScore,
                    feedback: validationFeedback || undefined,
                });
            } else {
                await validateSubmission(selectedSubmission._id, {
                    isCorrect,
                    feedback: validationFeedback || undefined,
                });
            }
            await fetchSubmissions();
            handleCloseValidationDialog();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to validate submission.');
        } finally {
            setIsValidating(false);
        }
    };

    const getStatusChip = (submission: SentenceSubmission) => {
        if (submission.isCorrect === null) {
            return <Chip label="Pending" color="warning" size="small" />;
        }
        if (submission.isCorrect === true) {
            return <Chip label="Correct" color="success" size="small" icon={<CheckCircleIcon />} />;
        }
        return <Chip label="Incorrect" color="error" size="small" icon={<CancelIcon />} />;
    };

    const stats = {
        total: filteredSubmissions.length,
        pending: filteredSubmissions.filter((s) => s.isCorrect === null).length,
        correct: filteredSubmissions.filter((s) => s.isCorrect === true).length,
        incorrect: filteredSubmissions.filter((s) => s.isCorrect === false).length,
    };

    return (
        <AdminLayout title="Sentence Validation">
            <Container maxWidth="xl" sx={{ pb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Sentence Validation Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Review user submissions in chronological order. Use tabs to match daily content
                    activities.
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total Submissions', value: stats.total, color: 'primary.main' },
                        { label: 'Pending Review', value: stats.pending, color: 'warning.dark' },
                        { label: 'Correct', value: stats.correct, color: 'success.dark' },
                        { label: 'Incorrect', value: stats.incorrect, color: 'error.dark' },
                    ].map((stat) => (
                        <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ color: stat.color, fontWeight: 700 }}>
                                    {stat.value}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {stat.label}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Paper sx={{ mb: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v as ValidationTabId)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
                    >
                        {VALIDATION_ACTIVITY_TABS.map((tab) => (
                            <Tab key={tab.id} label={tab.label} value={tab.id} />
                        ))}
                    </Tabs>
                </Paper>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={selectedStatus}
                                    label="Status"
                                    onChange={(e) =>
                                        setSelectedStatus(e.target.value as SubmissionStatus)
                                    }
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="reviewed">Reviewed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={fetchSubmissions}
                                fullWidth
                            >
                                Refresh
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredSubmissions.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No submissions in this tab.</Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 320px)' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Activity</TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>User</TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>
                                        User submission
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 260 }}>
                                        Daily content (prompt)
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: 150 }}>Submitted</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: 140 }} align="center">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSubmissions.map((submission) => {
                                    const contentType = getLinkedContentType(submission);
                                    const config = contentType
                                        ? getContentTypeConfig(contentType as ContentType)
                                        : null;
                                    const IconComponent = config?.icon;
                                    const isPending = submission.isCorrect === null;
                                    const busy = actionLoadingId === submission._id;
                                    const contentDetails = getValidationContentDetails(submission);

                                    return (
                                        <TableRow
                                            key={submission._id}
                                            hover
                                            sx={{
                                                bgcolor:
                                                    submission.isCorrect === null
                                                        ? 'warning.50'
                                                        : submission.isCorrect
                                                          ? 'success.50'
                                                          : 'error.50',
                                            }}
                                        >
                                            <TableCell>
                                                <Chip
                                                    label={getContentTypeLabel(submission)}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600, maxWidth: '100%' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {IconComponent && (
                                                        <IconComponent
                                                            sx={{
                                                                fontSize: 20,
                                                                color: config?.color,
                                                            }}
                                                        />
                                                    )}
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {getActivityRowLabel(submission)}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                            {getStatusChip(submission)}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {submission.userId?.name || 'Unknown'}
                                                </Typography>
                                                {submission.userId?.email && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                    >
                                                        {submission.userId.email}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{getUserPhone(submission)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {submission.submissionType === 'vocab' ? (
                                                    <Box sx={{ maxWidth: 300 }}>
                                                        <VocabSubmissionPreview
                                                            sentences={submission.sentences}
                                                            compact
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            maxWidth: 280,
                                                        }}
                                                    >
                                                        {getSubmissionContent(submission) || '—'}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ maxWidth: 320 }}>
                                                    {contentDetails
                                                        .filter((line) => line.label !== 'Activity type')
                                                        .slice(0, 4)
                                                        .map((line) => (
                                                            <Box key={line.label} sx={{ mb: 0.75 }}>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    display="block"
                                                                >
                                                                    {line.label}
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        whiteSpace: 'pre-wrap',
                                                                        wordBreak: 'break-word',
                                                                    }}
                                                                >
                                                                    {line.value.length > 200
                                                                        ? `${line.value.slice(0, 200)}…`
                                                                        : line.value}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    {contentDetails.length <= 1 && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {getOriginalReferenceText(submission)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" display="block">
                                                    {format(
                                                        new Date(submission.createdAt),
                                                        'MMM d, yyyy'
                                                    )}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(submission.createdAt), 'HH:mm')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {isPending ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 0.5,
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Tooltip title="Mark correct">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    disabled={busy}
                                                                    onClick={() =>
                                                                        handleQuickValidate(
                                                                            submission,
                                                                            true
                                                                        )
                                                                    }
                                                                >
                                                                    {busy ? (
                                                                        <CircularProgress size={18} />
                                                                    ) : (
                                                                        <CheckCircleIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Mark incorrect">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    disabled={busy}
                                                                    onClick={() =>
                                                                        handleQuickValidate(
                                                                            submission,
                                                                            false
                                                                        )
                                                                    }
                                                                >
                                                                    <CancelIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip
                                                            title={
                                                                submission.submissionType === 'scene'
                                                                    ? 'Score answers'
                                                                    : 'Edit / story detail'
                                                            }
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() =>
                                                                    handleOpenValidationDialog(
                                                                        submission
                                                                    )
                                                                }
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ) : (
                                                    <Tooltip title="View / add feedback">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                handleOpenValidationDialog(submission)
                                                            }
                                                        >
                                                            <CommentIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog
                    open={validationDialogOpen}
                    onClose={handleCloseValidationDialog}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 2, maxHeight: '90vh' },
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                        Review submission
                        {selectedSubmission && (
                            <Chip
                                label={getContentTypeLabel(selectedSubmission)}
                                size="small"
                                sx={{ ml: 1.5, fontWeight: 600 }}
                            />
                        )}
                    </DialogTitle>
                    <DialogContent dividers>
                        {selectedSubmission && (
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                    {selectedSubmission.userId?.name} · {getUserPhone(selectedSubmission)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {getContentTypeLabel(selectedSubmission)} ·{' '}
                                    {getActivityRowLabel(selectedSubmission)} ·{' '}
                                    {format(new Date(selectedSubmission.createdAt), 'PPp')}
                                </Typography>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        bgcolor: alpha('#0f172a', 0.04),
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        Daily content students responded to
                                    </Typography>
                                    {getValidationContentDetails(selectedSubmission).map((line) => (
                                        <Box key={line.label} sx={{ mb: 1.25 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {line.label}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                            >
                                                {line.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Paper>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                    Student submission
                                </Typography>
                                {selectedSubmission.submissionType === 'vocab' ? (
                                    <Box sx={{ mb: 2 }}>
                                        <VocabSubmissionPreview sentences={selectedSubmission.sentences} />
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                                        {getSubmissionContent(selectedSubmission) || '—'}
                                    </Typography>
                                )}
                                {selectedSubmission.reviewedAt && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Reviewed{' '}
                                        {format(new Date(selectedSubmission.reviewedAt), 'PPp')}
                                        {typeof selectedSubmission.reviewedBy === 'object' &&
                                        selectedSubmission.reviewedBy?.name
                                            ? ` by ${selectedSubmission.reviewedBy.name}`
                                            : ''}
                                        {selectedSubmission.feedback
                                            ? ` — Feedback: ${selectedSubmission.feedback}`
                                            : ''}
                                    </Alert>
                                )}
                                <Divider sx={{ my: 2 }} />
                                {selectedSubmission.submissionType === 'story' &&
                                selectedSubmission.summary ? (
                                    <List dense>
                                        {selectedSubmission.summary.map((sentence, idx) => (
                                            <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={
                                                                storySentenceValidations[idx] ||
                                                                false
                                                            }
                                                            onChange={(e) => {
                                                                const next = [
                                                                    ...storySentenceValidations,
                                                                ];
                                                                next[idx] = e.target.checked;
                                                                setStorySentenceValidations(next);
                                                            }}
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="body2">
                                                            {idx + 1}. {sentence}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : selectedSubmission.submissionType === 'vocab' ? (
                                    <List dense>
                                        {normalizeVocabSentences(selectedSubmission.sentences).map(
                                            (entry, idx) => (
                                                <ListItem key={idx} disablePadding sx={{ mb: 1, flexDirection: 'column', alignItems: 'stretch' }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={vocabSentenceValidations[idx] || false}
                                                                onChange={(e) => {
                                                                    const next = [...vocabSentenceValidations];
                                                                    next[idx] = e.target.checked;
                                                                    setVocabSentenceValidations(next);
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                                {idx + 1}. {entry.sentence}
                                                                {entry.vocabWordsUsed.length > 0
                                                                    ? ` [${entry.vocabWordsUsed.join(', ')}]`
                                                                    : ''}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            )
                                        )}
                                    </List>
                                ) : selectedSubmission.submissionType === 'scene' ? (
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                            Overall score (0–{SCENE_MAX_EVALUATION_SCORE})
                                        </Typography>
                                        <List dense sx={{ mb: 2 }}>
                                            {getSceneSubmissionSummaries(selectedSubmission).map((text, idx) => (
                                                <ListItem
                                                    key={idx}
                                                    sx={{
                                                        flexDirection: 'column',
                                                        alignItems: 'stretch',
                                                        mb: 1,
                                                        p: 1.5,
                                                        bgcolor: 'action.hover',
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    <Typography variant="caption" color="text.secondary">
                                                        Summary {idx + 1}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                        {text}
                                                    </Typography>
                                                </ListItem>
                                            ))}
                                        </List>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Slider
                                                value={sceneEvaluationScore}
                                                min={0}
                                                max={SCENE_MAX_EVALUATION_SCORE}
                                                step={1}
                                                valueLabelDisplay="auto"
                                                onChange={(_, v) => setSceneEvaluationScore(v as number)}
                                                sx={{ flex: 1 }}
                                            />
                                            <Chip
                                                label={`${sceneEvaluationScore}/${SCENE_MAX_EVALUATION_SCORE}`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Box>
                                ) : (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isCorrect}
                                                onChange={(e) => setIsCorrect(e.target.checked)}
                                            />
                                        }
                                        label="Mark as correct"
                                    />
                                )}
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Feedback (optional)"
                                    value={validationFeedback}
                                    onChange={(e) => setValidationFeedback(e.target.value)}
                                    sx={{ mt: 2 }}
                                />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseValidationDialog} disabled={isValidating}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleValidate}
                            variant="contained"
                            disabled={isValidating}
                            startIcon={
                                isValidating ? <CircularProgress size={20} /> : <CheckCircleIcon />
                            }
                        >
                            {isValidating ? 'Saving…' : 'Save review'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </AdminLayout>
    );
};

export default AdminSentenceValidationPage;
