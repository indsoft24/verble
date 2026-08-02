import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';
import {
    formatWebinarPrice,
    listWebinarRegistrationsAdmin,
    listWebinarsAdmin,
    type Webinar,
    type WebinarRegistrationAdminRow,
    type WebinarRegistrationStatus,
} from '../services/webinarService';
import { getApiErrorMessage } from '../utils/webinarDateTime';

const STATUS_OPTIONS: Array<{ value: '' | WebinarRegistrationStatus; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'REGISTERED', label: 'Registered' },
    { value: 'PAYMENT_DONE', label: 'Payment done' },
    { value: 'PAYMENT_PENDING', label: 'Payment pending' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const statusColor = (status: WebinarRegistrationStatus) => {
    if (status === 'REGISTERED' || status === 'PAYMENT_DONE') return 'success';
    if (status === 'PAYMENT_PENDING') return 'warning';
    return 'default';
};

const AdminWebinarRegistrationsPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Webinar Registrations' });
    const [searchParams, setSearchParams] = useSearchParams();

    const [webinars, setWebinars] = useState<Webinar[]>([]);
    const [rows, setRows] = useState<WebinarRegistrationAdminRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<WebinarRegistrationAdminRow | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState({
        total: 0,
        registered: 0,
        paymentPending: 0,
        paymentDone: 0,
        cancelled: 0,
    });

    const webinarId = searchParams.get('webinarId') || '';
    const status = (searchParams.get('status') || '') as '' | WebinarRegistrationStatus;
    const search = searchParams.get('search') || '';
    const [searchInput, setSearchInput] = useState(search);

    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    useEffect(() => {
        listWebinarsAdmin()
            .then(setWebinars)
            .catch(() => setWebinars([]));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listWebinarRegistrationsAdmin({
                webinarId: webinarId || undefined,
                status: status || undefined,
                search: search || undefined,
                page: page + 1,
                limit: rowsPerPage,
            });
            setRows(data.registrations || []);
            setTotal(data.pagination?.total || 0);
            setSummary(
                data.summary || {
                    total: 0,
                    registered: 0,
                    paymentPending: 0,
                    paymentDone: 0,
                    cancelled: 0,
                }
            );
        } catch (e: unknown) {
            setError(getApiErrorMessage(e, 'Could not load webinar registrations.'));
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [webinarId, status, search, page, rowsPerPage]);

    useEffect(() => {
        void load();
    }, [load]);

    const updateFilters = (next: { webinarId?: string; status?: string; search?: string }) => {
        const params = new URLSearchParams(searchParams);
        const setOrDelete = (key: string, value?: string) => {
            if (value) params.set(key, value);
            else params.delete(key);
        };
        if (next.webinarId !== undefined) setOrDelete('webinarId', next.webinarId);
        if (next.status !== undefined) setOrDelete('status', next.status);
        if (next.search !== undefined) setOrDelete('search', next.search.trim());
        setPage(0);
        setSearchParams(params);
    };

    const selectedWebinarTitle = useMemo(() => {
        if (!webinarId) return 'All webinars';
        return webinars.find((w) => w._id === webinarId)?.title || 'Selected webinar';
    }, [webinarId, webinars]);

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', md: 'center' }}
                spacing={2}
                sx={{ mb: 2 }}
            >
                <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <PeopleAltIcon color="primary" />
                        <Typography variant="h4" fontWeight={800}>
                            Webinar Registrations
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        View registered users across webinars, filter by session/status, and open full contact details.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button component={RouterLink} to="/admin/webinars" variant="outlined">
                        Manage webinars
                    </Button>
                    <Button startIcon={<RefreshIcon />} variant="contained" onClick={() => void load()} disabled={loading}>
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                {[
                    { label: 'Total', value: summary.total, color: 'primary.main' },
                    { label: 'Registered', value: summary.registered, color: 'success.main' },
                    { label: 'Paid', value: summary.paymentDone, color: 'info.main' },
                    { label: 'Payment pending', value: summary.paymentPending, color: 'warning.main' },
                ].map((card) => (
                    <Grid key={card.label} size={{ xs: 6, md: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                {card.label}
                            </Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ color: card.color }}>
                                {card.value}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Webinar"
                            value={webinarId}
                            onChange={(e) => updateFilters({ webinarId: e.target.value })}
                        >
                            <MenuItem value="">All webinars</MenuItem>
                            {webinars.map((w) => (
                                <MenuItem key={w._id} value={w._id}>
                                    {w.title}
                                    {typeof w.registrationCount === 'number' ? ` (${w.registrationCount})` : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Status"
                            value={status}
                            onChange={(e) => updateFilters({ status: e.target.value })}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <MenuItem key={opt.label} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Search name, email, or phone"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') updateFilters({ search: searchInput });
                                }}
                            />
                            <Button variant="outlined" onClick={() => updateFilters({ search: searchInput })}>
                                Search
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    Showing: {selectedWebinarTitle}
                </Typography>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper variant="outlined">
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Webinar</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Payment</TableCell>
                                    <TableCell>Registered at</TableCell>
                                    <TableCell align="right">Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7}>No registrations found for these filters.</TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => (
                                        <TableRow key={row._id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {row.user?.name || '—'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.user?.membershipLevel || 'FREE'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{row.user?.email || '—'}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.user?.phone || 'No phone'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {row.webinar?.title || 'Deleted webinar'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.webinar?.mode === 'PAID'
                                                        ? formatWebinarPrice(row.webinar.price)
                                                        : 'Free'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" color={statusColor(row.status)} label={row.status} />
                                                {row.accessGrantedBySubscription ? (
                                                    <Chip size="small" sx={{ ml: 0.5 }} variant="outlined" label="Sub access" />
                                                ) : null}
                                            </TableCell>
                                            <TableCell>
                                                {row.payment?.amount
                                                    ? formatWebinarPrice(row.payment.amount)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(row.createdAt).toLocaleString('en-IN', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button size="small" onClick={() => setSelected(row)}>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(_, next) => setPage(next)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[25, 50, 100]}
                        />
                    </>
                )}
            </Paper>

            <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Registration details</DialogTitle>
                <DialogContent dividers>
                    {selected ? (
                        <Stack spacing={1.5}>
                            <Typography variant="subtitle2" color="text.secondary">
                                User
                            </Typography>
                            <Typography>
                                <strong>Name:</strong> {selected.user?.name || '—'}
                            </Typography>
                            <Typography>
                                <strong>Email:</strong> {selected.user?.email || '—'}
                            </Typography>
                            <Typography>
                                <strong>Phone:</strong> {selected.user?.phone || '—'}
                            </Typography>
                            <Typography>
                                <strong>Membership:</strong> {selected.user?.membershipLevel || 'FREE'}
                            </Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
                                Webinar
                            </Typography>
                            <Typography>
                                <strong>Title:</strong> {selected.webinar?.title || '—'}
                            </Typography>
                            <Typography>
                                <strong>Mode:</strong>{' '}
                                {selected.webinar?.mode === 'PAID'
                                    ? `Paid (${formatWebinarPrice(selected.webinar.price)})`
                                    : 'Free'}
                            </Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
                                Registration
                            </Typography>
                            <Typography>
                                <strong>Status:</strong> {selected.status}
                            </Typography>
                            <Typography>
                                <strong>Registered at:</strong>{' '}
                                {new Date(selected.createdAt).toLocaleString('en-IN')}
                            </Typography>
                            {selected.payment?.paymentId ? (
                                <Typography>
                                    <strong>Payment ID:</strong> {selected.payment.paymentId}
                                </Typography>
                            ) : null}
                            {selected.payment?.orderId ? (
                                <Typography>
                                    <strong>Order ID:</strong> {selected.payment.orderId}
                                </Typography>
                            ) : null}
                            {selected.user?._id ? (
                                <Button
                                    component={RouterLink}
                                    to={`/admin/users/${selected.user._id}/manage-subscription`}
                                    variant="outlined"
                                    size="small"
                                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                                >
                                    Open user subscription
                                </Button>
                            ) : null}
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelected(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminWebinarRegistrationsPage;
