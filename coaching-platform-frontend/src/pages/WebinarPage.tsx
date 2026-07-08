import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    Link as MuiLink,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SellIcon from '@mui/icons-material/Sell';
import { useAuth } from '../contexts/AuthContext';
import {
    createWebinarPaymentOrder,
    getWebinarBySlug,
    getWebinarJoinAccess,
    registerForWebinar,
    type Webinar,
} from '../services/webinarService';

const WebinarPage: React.FC = () => {
    const { slug = '' } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [webinar, setWebinar] = useState<Webinar | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const item = await getWebinarBySlug(slug);
            setWebinar(item);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Could not load webinar.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [slug]);

    const statusLabel = useMemo(() => {
        if (!webinar) return 'WEBINAR';
        const now = Date.now();
        const start = new Date(webinar.startsAt).getTime();
        const end = new Date(webinar.endsAt).getTime();
        if (now >= start && now <= end) return 'LIVE';
        if (now < start) return 'UPCOMING';
        return 'ENDED';
    }, [webinar]);

    const registrationStatus = webinar?.registration?.status ?? null;

    const handleRegister = async () => {
        if (!isAuthenticated) {
            navigate(`/register?redirect=/webinar/${encodeURIComponent(slug)}`);
            return;
        }
        if (!webinar?._id) return;
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const data = await registerForWebinar(webinar._id);
            if (data?.requiresPayment) {
                const orderData = await createWebinarPaymentOrder(webinar._id);
                const maybeOrderId = orderData?.order?.id;
                if (maybeOrderId) {
                    setNotice(
                        `Payment order created (₹${data.paymentAmount}). Complete payment in your checkout flow, then refresh this page.`
                    );
                } else {
                    setNotice('You are eligible without payment due to subscription access.');
                }
            } else {
                setNotice('Registration successful. Join button unlocks automatically in live window.');
            }
            await load();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Registration failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleJoin = async () => {
        if (!isAuthenticated) {
            navigate(`/register?redirect=/webinar/${encodeURIComponent(slug)}`);
            return;
        }
        if (!webinar?._id) return;
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const access = await getWebinarJoinAccess(webinar._id);
            if (!access.canJoin || !access.joinRedirectUrl) {
                setNotice('Join is locked right now. It opens only in the configured live window.');
                return;
            }
            const absolute = access.joinRedirectUrl.startsWith('http')
                ? access.joinRedirectUrl
                : `${window.location.origin}${access.joinRedirectUrl}`;
            window.open(absolute, '_blank', 'noopener,noreferrer');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Join failed.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!webinar || error) {
        return (
            <Container maxWidth="md" sx={{ py: 5 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || 'Webinar not found.'}
                </Alert>
                <Button component={RouterLink} to="/webinars" startIcon={<ArrowBackIcon />}>
                    Back to webinars
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} to="/dashboard" underline="hover" color="inherit">
                    Dashboard
                </MuiLink>
                <MuiLink component={RouterLink} to="/webinars" underline="hover" color="inherit">
                    Webinars
                </MuiLink>
                <Typography color="text.primary">{webinar.title}</Typography>
            </Breadcrumbs>

            {notice && (
                <Alert severity="info" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
                    {notice}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                            <Chip label={statusLabel} color={statusLabel === 'LIVE' ? 'success' : 'primary'} />
                            <Chip label={webinar.mode === 'PAID' ? `Paid • ₹${webinar.price}` : 'Free'} variant="outlined" />
                            <Chip label={webinar.audience} variant="outlined" />
                        </Stack>
                        <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5 }}>
                            {webinar.title}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CalendarTodayIcon fontSize="small" />
                                <Typography variant="body2">{new Date(webinar.startsAt).toLocaleString('en-IN')}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <AccessTimeIcon fontSize="small" />
                                <Typography variant="body2">
                                    Join window: {webinar.joinWindowBeforeMinutes} min before to {webinar.joinWindowAfterMinutes} min after
                                </Typography>
                            </Stack>
                        </Stack>
                        {webinar.topics?.length ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                {webinar.topics.map((topic) => (
                                    <Chip key={topic} size="small" variant="outlined" label={topic} icon={<SellIcon />} />
                                ))}
                            </Stack>
                        ) : null}
                        <Divider sx={{ mb: 2 }} />
                        <Box
                            sx={{ '& img': { maxWidth: '100%' }, '& p': { lineHeight: 1.7 } }}
                            dangerouslySetInnerHTML={{ __html: webinar.descriptionHtml || '<p>No description provided.</p>' }}
                        />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 3, position: 'sticky', top: 90 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                            Registration & Join
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Meeting link is hidden. You can join only in the live access window.
                        </Typography>
                        {registrationStatus ? (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Registered ({registrationStatus})
                            </Alert>
                        ) : (
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => void handleRegister()}
                                disabled={busy}
                                sx={{ mb: 1.5 }}
                            >
                                {webinar.mode === 'PAID' ? 'Register / Pay' : 'Register now'}
                            </Button>
                        )}
                        <Button
                            fullWidth
                            variant="outlined"
                            endIcon={<OpenInNewIcon />}
                            onClick={() => void handleJoin()}
                            disabled={busy || !registrationStatus}
                        >
                            Join webinar
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default WebinarPage;
