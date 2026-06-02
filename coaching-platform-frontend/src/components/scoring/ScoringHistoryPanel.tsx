import React from 'react';
import {
    Box,
    Chip,
    LinearProgress,
    Paper,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import type { ScoringHistoryEvent, ScoringSummary } from '../../services/scoringHistoryService';
import { categoryLabel } from '../../services/scoringHistoryService';

const CATEGORY_TABS = [
    { value: 'all', label: 'All' },
    { value: 'participation', label: 'Participation' },
    { value: 'evaluation', label: 'Evaluation' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'module_quiz', label: 'Quiz' },
] as const;

const statusColor = (status: string): 'default' | 'success' | 'warning' | 'info' => {
    if (status === 'approved') return 'success';
    if (status === 'pending') return 'warning';
    return 'info';
};

const categoryChipColor = (
    category: string
): 'default' | 'primary' | 'secondary' | 'warning' => {
    switch (category) {
        case 'participation':
            return 'primary';
        case 'evaluation':
            return 'secondary';
        case 'puzzle':
            return 'warning';
        default:
            return 'default';
    }
};

export interface ScoringHistoryPanelProps {
    summary: ScoringSummary | null;
    summaryLoading?: boolean;
    events: ScoringHistoryEvent[];
    eventsLoading?: boolean;
    category: string;
    onCategoryChange: (c: string) => void;
    page: number;
    rowsPerPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
}

export const ScoringSummaryCards: React.FC<{ summary: ScoringSummary | null; loading?: boolean }> = ({
    summary,
    loading,
}) => {
    if (loading) {
        return (
            <Box sx={{ py: 2 }}>
                <LinearProgress />
            </Box>
        );
    }
    if (!summary) return null;

    const cards = [
        { label: 'Leaderboard points', value: summary.leaderboardPoints },
        { label: 'Evaluation score', value: summary.evaluationScore },
        { label: 'Pending reviews', value: summary.pendingReviewCount },
        {
            label: 'Last activity',
            value: summary.lastActivityAt
                ? new Date(summary.lastActivityAt).toLocaleString()
                : '—',
            isText: true,
        },
    ];

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 3,
            }}
        >
            {cards.map((c) => (
                <Paper key={c.label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {c.label}
                    </Typography>
                    <Typography variant={c.isText ? 'body2' : 'h6'} fontWeight={700} sx={{ lineHeight: 1.3 }}>
                        {c.value}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
};

const ScoringHistoryPanel: React.FC<ScoringHistoryPanelProps> = ({
    summary,
    summaryLoading,
    events,
    eventsLoading,
    category,
    onCategoryChange,
    page,
    rowsPerPage,
    total,
    onPageChange,
    onRowsPerPageChange,
}) => (
    <>
        <ScoringSummaryCards summary={summary} loading={summaryLoading} />

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ py: 1 }}>
                    Activity history
                </Typography>
                <Tabs
                    value={category}
                    onChange={(_, v) => onCategoryChange(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {CATEGORY_TABS.map((t) => (
                        <Tab key={t.value} value={t.value} label={t.label} sx={{ textTransform: 'none', minHeight: 44 }} />
                    ))}
                </Tabs>
            </Box>

            {eventsLoading ? (
                <LinearProgress />
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    Points
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            No activity in this category yet.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((e) => (
                                    <TableRow key={e.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                            {new Date(e.occurredAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 320 }}>
                                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                                {e.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={categoryLabel(e.category)}
                                                color={categoryChipColor(e.category)}
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                color={e.delta > 0 ? 'success.main' : e.delta < 0 ? 'error.main' : 'text.primary'}
                                            >
                                                {e.delta !== 0
                                                    ? `${e.delta > 0 ? '+' : ''}${e.delta}`
                                                    : e.points}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={e.status}
                                                color={statusColor(e.status)}
                                                sx={{ fontSize: '0.65rem', textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, p) => onPageChange(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    onRowsPerPageChange(parseInt(e.target.value, 10));
                    onPageChange(0);
                }}
                rowsPerPageOptions={[10, 25, 50]}
            />
        </Paper>
    </>
);

export default ScoringHistoryPanel;
