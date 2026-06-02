import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import UserLayout from '../components/layout/UserLayout';
import ScoringHistoryPanel from '../components/scoring/ScoringHistoryPanel';
import {
    getMyScoringSummary,
    getMyScoringHistory,
    type ScoringSummary,
    type ScoringHistoryEvent,
} from '../services/scoringHistoryService';

const MyRewardsPage: React.FC = () => {
    const [summary, setSummary] = useState<ScoringSummary | null>(null);
    const [events, setEvents] = useState<ScoringHistoryEvent[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [category, setCategory] = useState('all');
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            setSummary(await getMyScoringSummary());
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to load rewards summary.');
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const loadHistory = useCallback(async () => {
        setEventsLoading(true);
        try {
            const data = await getMyScoringHistory({
                page: page + 1,
                limit: rowsPerPage,
                category,
            });
            setEvents(data.events);
            setTotal(data.pagination.total);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to load activity history.');
        } finally {
            setEventsLoading(false);
        }
    }, [page, rowsPerPage, category]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        setPage(0);
    }, [category]);

    return (
        <UserLayout title="My Rewards">
            <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 1, sm: 0 }, pb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmojiEventsIcon color="primary" />
                    <Typography variant="h5" fontWeight={800}>
                        Rewards & scoring
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Leaderboard points are earned when you complete daily activities. Evaluation scores are added
                    after an admin reviews your submissions.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {summary && summary.pendingReviewCount > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        You have {summary.pendingReviewCount} submission
                        {summary.pendingReviewCount === 1 ? '' : 's'} awaiting review. Evaluation points appear
                        here once reviewed.
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

                <Button component={RouterLink} to="/dashboard" sx={{ mt: 2, textTransform: 'none' }}>
                    Back to dashboard
                </Button>
            </Box>
        </UserLayout>
    );
};

export default MyRewardsPage;
