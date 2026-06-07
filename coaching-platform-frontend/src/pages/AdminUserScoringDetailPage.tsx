import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScoringHistoryPanel from '../components/scoring/ScoringHistoryPanel';
import {
    getAdminUserScoringSummary,
    getAdminUserScoringHistory,
    type ScoringSummary,
    type ScoringHistoryEvent,
} from '../services/scoringHistoryService';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';

const AdminUserScoringDetailPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<ScoringSummary | null>(null);
    const [events, setEvents] = useState<ScoringHistoryEvent[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [category, setCategory] = useState('all');
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useAdminLayoutPage({ title: summary?.name ? `Scoring — ${summary.name}` : 'Scoring' });

    const loadSummary = useCallback(async () => {
        if (!userId) return;
        setSummaryLoading(true);
        try {
            const data = await getAdminUserScoringSummary(userId);
            setSummary(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to load summary.');
        } finally {
            setSummaryLoading(false);
        }
    }, [userId]);

    const loadHistory = useCallback(async () => {
        if (!userId) return;
        setEventsLoading(true);
        try {
            const data = await getAdminUserScoringHistory(userId, {
                page: page + 1,
                limit: rowsPerPage,
                category,
            });
            setEvents(data.events);
            setTotal(data.pagination.total);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to load history.');
        } finally {
            setEventsLoading(false);
        }
    }, [userId, page, rowsPerPage, category]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        setPage(0);
    }, [category]);

    if (!userId) {
        return (
            <Alert severity="error">Invalid user.</Alert>
        );
    }

    const displayName = summary?.name || 'User';

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <MuiLink component={RouterLink} to="/admin/rewards-scoring" underline="hover" color="inherit">
                        Rewards & Scoring
                    </MuiLink>
                    <Typography color="text.primary">{displayName}</Typography>
                </Breadcrumbs>

                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/rewards-scoring')}
                    sx={{ mb: 2, textTransform: 'none' }}
                >
                    Back to list
                </Button>

                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                    {displayName}
                </Typography>
                {summary?.email && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {summary.email}
                    </Typography>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <ScoringHistoryPanel
                    summary={summary}
                    summaryLoading={summaryLoading}
                    events={events}
                    eventsLoading={eventsLoading}
                    category={category}
                    onCategoryChange={setCategory}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    total={total}
                    onPageChange={setPage}
                    onRowsPerPageChange={setRowsPerPage}
                />
            </Box>
    );
};

export default AdminUserScoringDetailPage;
