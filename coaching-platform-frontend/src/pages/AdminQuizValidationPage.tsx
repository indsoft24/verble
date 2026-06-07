import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminLayout from '../components/layout/AdminLayout';
import {
    getModuleQuizSubmissionAdmin,
    listModuleQuizSubmissionsAdmin,
    updateModuleQuizSubmissionNotesAdmin,
    type ModuleQuizSubmissionRow,
} from '../services/moduleQuizAdminService';
import { getFilledOptionEntries, getOptionLabelAt } from '../utils/quizOptionUtils';

const AdminQuizValidationPage: React.FC = () => {
    const [rows, setRows] = useState<ModuleQuizSubmissionRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [error, setError] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detail, setDetail] = useState<Awaited<ReturnType<typeof getModuleQuizSubmissionAdmin>> | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        try {
            const data = await listModuleQuizSubmissionsAdmin({ page: page + 1, limit: rowsPerPage });
            setRows(data.submissions);
            setTotal(data.pagination.total);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to load submissions');
        }
    }, [page, rowsPerPage]);

    useEffect(() => {
        void load();
    }, [load]);

    const openDetail = async (id: string) => {
        try {
            const sub = await getModuleQuizSubmissionAdmin(id);
            setDetail(sub);
            setAdminNotes(sub.adminNotes || '');
            setDetailOpen(true);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to load submission');
        }
    };

    const saveNotes = async () => {
        if (!detail?._id) return;
        setSavingNotes(true);
        try {
            await updateModuleQuizSubmissionNotesAdmin(detail._id, adminNotes);
            setDetailOpen(false);
            void load();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to save notes');
        } finally {
            setSavingNotes(false);
        }
    };

    return (
        <AdminLayout title="Quiz Validation">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Module quizzes are auto-graded. Use this view to audit attempts and add internal notes.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Course / Module</TableCell>
                            <TableCell>Quiz</TableCell>
                            <TableCell>Score</TableCell>
                            <TableCell>Result</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row._id}>
                                <TableCell>
                                    {typeof row.user === 'object' ? row.user?.name : '—'}
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                        {typeof row.user === 'object' ? row.user?.email : ''}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {typeof row.module === 'object' && row.module?.course && typeof row.module.course === 'object'
                                        ? row.module.course.title
                                        : '—'}
                                    <br />
                                    {typeof row.module === 'object' ? row.module?.title : '—'}
                                </TableCell>
                                <TableCell>
                                    {typeof row.quiz === 'object' ? row.quiz?.title : '—'}
                                </TableCell>
                                <TableCell>{row.score}%</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={row.passed ? 'Passed' : 'Failed'}
                                        color={row.passed ? 'success' : 'error'}
                                    />
                                </TableCell>
                                <TableCell>{new Date(row.submittedAt).toLocaleString()}</TableCell>
                                <TableCell align="right">
                                    <Button size="small" startIcon={<VisibilityIcon />} onClick={() => void openDetail(row._id)}>
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Quiz attempt</DialogTitle>
                <DialogContent dividers>
                    {detail && (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Score: {detail.score}% · {detail.passed ? 'Passed' : 'Failed'} ·{' '}
                                {detail.correctAnswers}/{detail.totalQuestions} correct
                            </Typography>
                            {detail.detailedAnswers?.map((a, i) => {
                                const filledOptions = getFilledOptionEntries(a.options);
                                const selectedLabel = getOptionLabelAt(a.options, a.selectedAnswer);
                                const correctLabel = getOptionLabelAt(a.options, a.correctAnswer);
                                return (
                                    <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                                        <Typography fontWeight={600}>{i + 1}. {a.question}</Typography>
                                        {filledOptions.length > 0 && (
                                            <Box component="ul" sx={{ m: 0, pl: 2.25, mt: 1, mb: 1 }}>
                                                {filledOptions.map(({ text, index: optIdx }) => (
                                                    <Typography
                                                        key={optIdx}
                                                        component="li"
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mb: 0.25 }}
                                                    >
                                                        {text}
                                                        {a.selectedAnswer === optIdx ? ' (selected)' : ''}
                                                        {a.correctAnswer === optIdx ? ' (correct)' : ''}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        )}
                                        <Typography variant="body2" color={a.isCorrect ? 'success.main' : 'error.main'}>
                                            Selected: {selectedLabel || '—'}
                                            {!a.isCorrect && a.correctAnswer != null && (
                                                <> · Correct: {correctLabel || '—'}</>
                                            )}
                                        </Typography>
                                        {a.explanation && (
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                {a.explanation}
                                            </Typography>
                                        )}
                                    </Paper>
                                );
                            })}
                            <TextField
                                label="Admin notes"
                                fullWidth
                                multiline
                                minRows={2}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailOpen(false)}>Close</Button>
                    <Button variant="contained" onClick={() => void saveNotes()} disabled={savingNotes}>
                        Save notes
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminQuizValidationPage;
