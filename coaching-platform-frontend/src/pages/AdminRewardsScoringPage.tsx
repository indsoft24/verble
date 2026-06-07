import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    getAdminScoringUsers,
    type AdminScoringUserRow,
    type ScoringHistoryPagination,
} from '../services/scoringHistoryService';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';

const DEFAULT_ROWS = 25;

const AdminRewardsScoringPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Rewards & Scoring' });
    const navigate = useNavigate();
    const [users, setUsers] = useState<AdminScoringUserRow[]>([]);
    const [pagination, setPagination] = useState<ScoringHistoryPagination>({
        page: 1,
        limit: DEFAULT_ROWS,
        total: 0,
        totalPages: 1,
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAdminScoringUsers({
                search: debouncedSearch || undefined,
                page: page + 1,
                limit: rowsPerPage,
            });
            setUsers(result.users);
            setPagination(result.pagination);
        } catch (err: unknown) {
            const e = err as { message?: string; response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || e.message || 'Failed to load scoring data.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, rowsPerPage]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmojiEventsIcon color="primary" />
                    <Typography variant="h5" fontWeight={800}>
                        Rewards & Scoring
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Leaderboard participation points, evaluation scores from admin reviews, puzzles, and module
                    quizzes — per learner.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Search by name, email, or phone"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    {loading && <CircularProgress size={24} sx={{ m: 2 }} />}
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    Leaderboard
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    Evaluation
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    Pending
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Last activity</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!loading && users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No users found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u) => (
                                    <TableRow
                                        key={u._id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/admin/users/${u._id}/scoring`)}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {u.name || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block">
                                                {u.email}
                                            </Typography>
                                            {u.phoneNumber && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {u.phoneNumber}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">{u.leaderboardPoints}</TableCell>
                                        <TableCell align="right">{u.evaluationScore}</TableCell>
                                        <TableCell align="center">
                                            {u.pendingReviewCount > 0 ? (
                                                <Chip
                                                    size="small"
                                                    label={u.pendingReviewCount}
                                                    color="warning"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                '0'
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                            {u.lastActivityAt
                                                ? new Date(u.lastActivityAt).toLocaleString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => navigate(`/admin/users/${u._id}/scoring`)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                History
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={pagination.total}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[10, 25, 50]}
                    />
                </TableContainer>
            </Box>
    );
};

export default AdminRewardsScoringPage;
