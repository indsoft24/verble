// src/pages/AdminSentenceValidationPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container,
    Typography,
    Box,
    Paper,

    CircularProgress,
    Alert,
    Card,
    CardContent,
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
    ListItemText,
    Checkbox,
    FormControlLabel,
    IconButton,
    Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    getPendingSubmissions,
    getAllSubmissions,
    validateSubmission,
    validateStorySentences,
    type SentenceSubmission,
} from '../services/sentenceValidationService';
import { getContentTypeConfig, type ContentType } from '../utils/contentTypeConfig';
import { format } from 'date-fns';

type SubmissionType = 'all' | 'sentence' | 'story' | 'vocab' | 'scene' | 'speech';
type SubmissionStatus = 'all' | 'pending' | 'reviewed';

const AdminSentenceValidationPage: React.FC = () => {
    const [submissions, setSubmissions] = useState<SentenceSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<SubmissionType>('all');
    const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus>('all');

    const [selectedSubmission, setSelectedSubmission] = useState<SentenceSubmission | null>(null);
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationFeedback, setValidationFeedback] = useState('');
    const [isCorrect, setIsCorrect] = useState<boolean>(true);
    const [storySentenceValidations, setStorySentenceValidations] = useState<boolean[]>([]);

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let fetchedSubmissions: SentenceSubmission[];
            if (selectedStatus === 'pending') {
                fetchedSubmissions = await getPendingSubmissions(
                    selectedType === 'all' ? undefined : selectedType,
                    100
                );
            } else {
                // Use getAllSubmissions for all/reviewed status
                fetchedSubmissions = await getAllSubmissions(
                    selectedType === 'all' ? undefined : selectedType,
                    selectedStatus,
                    100
                );
            }

            setSubmissions(fetchedSubmissions);
        } catch (err: any) {
            setError(err.message || 'Failed to load submissions.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedType, selectedStatus]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleOpenValidationDialog = (submission: SentenceSubmission) => {
        setSelectedSubmission(submission);
        setIsCorrect(true);
        setValidationFeedback('');

        // For story submissions, initialize sentence validations
        if (submission.submissionType === 'story' && submission.summary) {
            setStorySentenceValidations(new Array(submission.summary.length).fill(true));
        }

        setValidationDialogOpen(true);
    };

    const handleCloseValidationDialog = () => {
        setValidationDialogOpen(false);
        setSelectedSubmission(null);
        setValidationFeedback('');
        setStorySentenceValidations([]);
    };

    const handleValidate = async () => {
        if (!selectedSubmission) return;

        setIsValidating(true);
        try {
            if (selectedSubmission.submissionType === 'story' && selectedSubmission.summary) {
                // Validate story sentences individually
                const sentenceValidations = storySentenceValidations.map((isCorrect, index) => ({
                    sentenceIndex: index,
                    isCorrect,
                }));
                await validateStorySentences(selectedSubmission._id, { sentenceValidations });
            } else {
                // Validate single submission
                await validateSubmission(selectedSubmission._id, {
                    isCorrect,
                    feedback: validationFeedback || undefined,
                });
            }

            // Refresh submissions
            await fetchSubmissions();
            handleCloseValidationDialog();
        } catch (err: any) {
            setError(err.message || 'Failed to validate submission.');
        } finally {
            setIsValidating(false);
        }
    };

    const getSubmissionContent = (submission: SentenceSubmission) => {
        switch (submission.submissionType) {
            case 'sentence':
                return submission.sentence || '';
            case 'story':
                return submission.summary?.join(' ') || '';
            case 'vocab':
                return submission.sentences?.join(' ') || '';
            case 'scene':
            case 'speech':
                return submission.description || '';
            default:
                return '';
        }
    };

    const getSubmissionTitle = (submission: SentenceSubmission) => {
        const contentId = submission.wordId || submission.storyId || submission.vocabSetId ||
            submission.sceneId || submission.speechId;
        return contentId?.title || 'Unknown Content';
    };

    const getSubmissionTypeLabel = (type: string) => {
        const typeMap: Record<string, string> = {
            sentence: 'Sentence',
            story: 'Story Summary',
            vocab: 'Vocabulary',
            scene: 'Scene Description',
            speech: 'Speech Description',
        };
        return typeMap[type] || type;
    };

    const getStatusChip = (submission: SentenceSubmission) => {
        if (submission.isCorrect === null) {
            return <Chip label="Pending" color="warning" size="small" />;
        } else if (submission.isCorrect === true) {
            return <Chip label="Correct" color="success" size="small" icon={<CheckCircleIcon />} />;
        } else {
            return <Chip label="Incorrect" color="error" size="small" icon={<CancelIcon />} />;
        }
    };

    const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s.isCorrect === null).length,
        correct: submissions.filter(s => s.isCorrect === true).length,
        incorrect: submissions.filter(s => s.isCorrect === false).length,
    };

    return (
        <AdminLayout title="Sentence Validation">
            <Container maxWidth="xl">
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Sentence Validation Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Review and validate user sentence submissions
                    </Typography>

                    {/* Statistics */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" color="primary">
                                    {stats.total}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Submissions
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                                <Typography variant="h4" color="warning.dark">
                                    {stats.pending}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Pending Review
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                                <Typography variant="h4" color="success.dark">
                                    {stats.correct}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Correct
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                                <Typography variant="h4" color="error.dark">
                                    {stats.incorrect}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Incorrect
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Filters */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Submission Type</InputLabel>
                                    <Select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value as SubmissionType)}
                                        label="Submission Type"
                                    >
                                        <MenuItem value="all">All Types</MenuItem>
                                        <MenuItem value="sentence">Sentence</MenuItem>
                                        <MenuItem value="story">Story</MenuItem>
                                        <MenuItem value="vocab">Vocabulary</MenuItem>
                                        <MenuItem value="scene">Scene</MenuItem>
                                        <MenuItem value="speech">Speech</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value as SubmissionStatus)}
                                        label="Status"
                                    >
                                        <MenuItem value="all">All</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="reviewed">Reviewed</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

                    {/* Submissions List */}
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                    ) : submissions.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No submissions found.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {submissions.map((submission) => {
                                const contentType = (submission.wordId?.type ||
                                    submission.storyId?.type ||
                                    submission.vocabSetId?.type ||
                                    submission.sceneId?.type ||
                                    submission.speechId?.type) as ContentType;
                                const config = contentType ? getContentTypeConfig(contentType) : null;
                                const IconComponent = config?.icon;

                                return (
                                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={submission._id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                border: submission.isCorrect === null
                                                    ? '2px solid orange'
                                                    : submission.isCorrect
                                                        ? '2px solid green'
                                                        : '2px solid red',
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                                    <Box sx={{ flex: 1 }}>
                                                        {IconComponent && (
                                                            <IconComponent
                                                                sx={{
                                                                    fontSize: 24,
                                                                    color: config.color,
                                                                    mb: 1
                                                                }}
                                                            />
                                                        )}
                                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                            {getSubmissionTitle(submission)}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label={getSubmissionTypeLabel(submission.submissionType)}
                                                                size="small"
                                                                color={config?.chipColor || 'default'}
                                                            />
                                                            {getStatusChip(submission)}
                                                        </Box>
                                                    </Box>
                                                    {submission.isCorrect === null && (
                                                        <Tooltip title="Validate">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleOpenValidationDialog(submission)}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>

                                                <Divider sx={{ my: 2 }} />

                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                        User:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {submission.userId?.name || 'Unknown'} ({submission.userId?.email || 'N/A'})
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                        Submission:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{
                                                        bgcolor: 'grey.100',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {getSubmissionContent(submission)}
                                                    </Typography>
                                                </Box>

                                                {submission.submissionType === 'story' && submission.summary && (
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Sentences ({submission.summary.length}):
                                                        </Typography>
                                                        <List dense>
                                                            {submission.summary.map((sentence, idx) => (
                                                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                                                    <ListItemText
                                                                        primary={`${idx + 1}. ${sentence}`}
                                                                        primaryTypographyProps={{ variant: 'body2' }}
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    </Box>
                                                )}

                                                {submission.pointsEarned !== undefined && (
                                                    <Box sx={{ mb: 1 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Points: {submission.pointsEarned}
                                                            {submission.sentencesCorrect !== undefined &&
                                                                ` (${submission.sentencesCorrect} correct sentences)`}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {submission.feedback && (
                                                    <Box sx={{ mb: 1 }}>
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Feedback:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                            {submission.feedback}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Typography variant="caption" color="text.secondary">
                                                    Submitted: {format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}
                                                </Typography>
                                                {submission.reviewedAt && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Reviewed: {format(new Date(submission.reviewedAt), 'MMM d, yyyy HH:mm')}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>

                {/* Validation Dialog */}
                <Dialog
                    open={validationDialogOpen}
                    onClose={handleCloseValidationDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Validate Submission
                    </DialogTitle>
                    <DialogContent>
                        {selectedSubmission && (
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    {getSubmissionTitle(selectedSubmission)}
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        User: {selectedSubmission.userId?.name} ({selectedSubmission.userId?.email})
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Type: {getSubmissionTypeLabel(selectedSubmission.submissionType)}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {selectedSubmission.submissionType === 'story' && selectedSubmission.summary ? (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                                            Validate Individual Sentences:
                                        </Typography>
                                        <List>
                                            {selectedSubmission.summary.map((sentence, idx) => (
                                                <ListItem key={idx}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={storySentenceValidations[idx] || false}
                                                                onChange={(e) => {
                                                                    const newValidations = [...storySentenceValidations];
                                                                    newValidations[idx] = e.target.checked;
                                                                    setStorySentenceValidations(newValidations);
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                                {sentence}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                            Points: 10 base + {storySentenceValidations.filter(v => v).length} × 2 = {10 + (storySentenceValidations.filter(v => v).length * 2)} points
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                            Submission:
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            bgcolor: 'grey.100',
                                            p: 2,
                                            borderRadius: 1,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            mb: 2
                                        }}>
                                            {getSubmissionContent(selectedSubmission)}
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={isCorrect}
                                                    onChange={(e) => setIsCorrect(e.target.checked)}
                                                />
                                            }
                                            label="Mark as correct"
                                        />
                                    </Box>
                                )}

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Feedback (Optional)"
                                    value={validationFeedback}
                                    onChange={(e) => setValidationFeedback(e.target.value)}
                                    sx={{ mt: 2 }}
                                    placeholder="Provide feedback to the user..."
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
                            color="primary"
                            disabled={isValidating}
                            startIcon={isValidating ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                        >
                            {isValidating ? 'Validating...' : 'Validate'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </AdminLayout>
    );
};

export default AdminSentenceValidationPage;
