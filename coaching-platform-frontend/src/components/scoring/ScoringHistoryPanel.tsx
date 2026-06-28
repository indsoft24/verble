import React from 'react';
import {
    Box,
    Chip,
    Divider,
    LinearProgress,
    Paper,
    Stack,
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
    useMediaQuery,
    useTheme,
} from '@mui/material';
import type { ScoringHistoryEvent, ScoringSummary } from '../../services/scoringHistoryService';
import {
    categoryLabel,
    formatActivityTitle,
    formatPointsDisplay,
    statusLabel,
} from '../../services/scoringHistoryService';

const CATEGORY_TABS = [
    { value: 'all', label: 'All' },
    { value: 'participation', label: 'Participation' },
    { value: 'evaluation', label: 'Evaluation' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'module_quiz', label: 'Quiz' },
] as const;

const statusColor = (status: string): 'default' | 'success' | 'warning' | 'info' => {
    const normalized = status.toLowerCase();
    if (normalized === 'approved' || normalized === 'passed') return 'success';
    if (normalized === 'pending') return 'warning';
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

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

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
            value: summary.lastActivityAt ? formatDate(summary.lastActivityAt) : '—',
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

const HistoryEventRow: React.FC<{ event: ScoringHistoryEvent; mobile?: boolean }> = ({ event, mobile }) => {
    const displayTitle = formatActivityTitle(event.title, event.category);
    const pointsText = formatPointsDisplay(event.points, event.delta);
    const displayStatus = statusLabel(event.status, event.category);
    const pointsValue = event.delta !== 0 ? event.delta : event.points;

    if (mobile) {
        return (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4, flex: 1, minWidth: 0 }}>
                            {displayTitle}
                        </Typography>
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            color={pointsValue > 0 ? 'success.main' : pointsValue < 0 ? 'error.main' : 'text.secondary'}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            {pointsText}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {formatDate(event.occurredAt)}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        <Chip
                            size="small"
                            label={categoryLabel(event.category)}
                            color={categoryChipColor(event.category)}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 24 }}
                        />
                        <Chip
                            size="small"
                            label={displayStatus}
                            color={statusColor(displayStatus)}
                            sx={{ fontSize: '0.65rem', height: 24, textTransform: 'capitalize' }}
                        />
                    </Box>
                </Stack>
            </Paper>
        );
    }

    return (
        <TableRow hover>
            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', verticalAlign: 'top', py: 1.5 }}>
                {formatDate(event.occurredAt)}
            </TableCell>
            <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.45 }}>
                    {displayTitle}
                </Typography>
            </TableCell>
            <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                <Chip
                    size="small"
                    label={categoryLabel(event.category)}
                    color={categoryChipColor(event.category)}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                />
            </TableCell>
            <TableCell align="right" sx={{ verticalAlign: 'top', py: 1.5, whiteSpace: 'nowrap' }}>
                <Typography
                    variant="body2"
                    fontWeight={700}
                    color={pointsValue > 0 ? 'success.main' : pointsValue < 0 ? 'error.main' : 'text.secondary'}
                >
                    {pointsText}
                </Typography>
            </TableCell>
            <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                <Chip
                    size="small"
                    label={displayStatus}
                    color={statusColor(displayStatus)}
                    sx={{ fontSize: '0.65rem', textTransform: 'capitalize' }}
                />
            </TableCell>
        </TableRow>
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
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <>
            <ScoringSummaryCards summary={summary} loading={summaryLoading} />

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ py: 1 }}>
                        Activity history
                    </Typography>
                    <Tabs
                        value={category}
                        onChange={(_, v) => onCategoryChange(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        {CATEGORY_TABS.map((t) => (
                            <Tab
                                key={t.value}
                                value={t.value}
                                label={t.label}
                                sx={{ textTransform: 'none', minHeight: 44, minWidth: { xs: 72, sm: 90 } }}
                            />
                        ))}
                    </Tabs>
                </Box>

                {eventsLoading ? (
                    <LinearProgress />
                ) : events.length === 0 ? (
                    <Box sx={{ py: 5, px: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">No activity in this category yet.</Typography>
                    </Box>
                ) : isMobile ? (
                    <Stack spacing={1.25} sx={{ p: 1.5 }}>
                        {events.map((e) => (
                            <HistoryEventRow key={e.id} event={e} mobile />
                        ))}
                    </Stack>
                ) : (
                    <TableContainer>
                        <Table size="small" sx={{ tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, width: '18%' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: '36%' }}>Activity</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: '16%' }}>Category</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, width: '12%' }}>
                                        Points
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: '14%' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {events.map((e) => (
                                    <HistoryEventRow key={e.id} event={e} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {!eventsLoading && events.length > 0 && <Divider />}

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
                    sx={{
                        '.MuiTablePagination-toolbar': {
                            flexWrap: 'wrap',
                            gap: 0.5,
                            px: { xs: 1, sm: 2 },
                        },
                    }}
                />
            </Paper>
        </>
    );
};

export default ScoringHistoryPanel;
