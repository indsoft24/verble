import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../contexts/AuthContext';
import DocumentHead from '../components/seo/DocumentHead';
import { brandAssets } from '../assets/brandAssets';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';
import { resolveBackendMediaUrl, getSplashImageUrl } from '../utils/imageUtils';
import {
    createWebinarPaymentOrder,
    formatWebinarPrice,
    getWebinarBySlug,
    getWebinarJoinAccess,
    getWebinarJoinMeetingUrl,
    registerForWebinar,
    verifyWebinarPayment,
    type Webinar,
} from '../services/webinarService';
import { getApiErrorMessage } from '../utils/webinarDateTime';

const getWebinarImage = (imageUrl?: string) => resolveBackendMediaUrl(imageUrl);

const WebinarPage: React.FC = () => {
    const { slug = '' } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [webinar, setWebinar] = useState<Webinar | null>(null);

    const webinarPath = `/webinar/${encodeURIComponent(slug)}`;
    const canonicalUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://verble.in'}${webinarPath}`;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const item = await getWebinarBySlug(slug);
            setWebinar(item);
        } catch (e: unknown) {
            setError(getApiErrorMessage(e, 'Could not load webinar.'));
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        void load();
    }, [load]);

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
    const isPaidWebinar = webinar?.mode === 'PAID';
    const isRegistered =
        registrationStatus === 'REGISTERED' || registrationStatus === 'PAYMENT_DONE';
    const needsPayment = isPaidWebinar && registrationStatus === 'PAYMENT_PENDING';

    const redirectToLogin = () => {
        navigate(`/login?redirect=${encodeURIComponent(webinarPath)}`);
    };

    const openRazorpayCheckout = async (webinarItem: Webinar) => {
        if (webinarItem.mode !== 'PAID') {
            throw new Error('This webinar is free — no payment needed.');
        }
        if (typeof window === 'undefined' || !(window as unknown as { Razorpay?: unknown }).Razorpay) {
            throw new Error('Payment checkout is loading. Please try again in a moment.');
        }
        const orderData = await createWebinarPaymentOrder(webinarItem._id);
        if (orderData?.bypassedBySubscription) {
            setNotice('You are eligible without payment due to your subscription.');
            await load();
            return;
        }
        const order = orderData?.order;
        if (!order?.id) {
            throw new Error('Could not create payment order.');
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Verble',
            description: `Webinar: ${webinarItem.title}`,
            image: brandAssets.primaryLogo,
            order_id: order.id,
            handler: async (response: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
            }) => {
                try {
                    await verifyWebinarPayment(webinarItem._id, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                    });
                    setNotice('Payment successful. You are registered for this webinar.');
                    await load();
                } catch (e: unknown) {
                    setError(getApiErrorMessage(e, 'Payment verification failed.'));
                }
            },
            prefill: {
                name: user?.name || '',
                email: user?.email || '',
                contact: user?.phoneNumber || user?.mobile || '',
            },
            notes: { webinar_id: webinarItem._id, user_id: user?._id },
            theme: { color: learnerBrandTheme.accent },
        };

        const rzp = new (window as unknown as {
            Razorpay: new (o: object) => {
                open: () => void;
                on: (e: string, cb: (r: { error: { description: string } }) => void) => void;
            };
        }).Razorpay(options);
        rzp.on('payment.failed', (response) => {
            setError(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
    };

    const handleRegister = async () => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        if (webinar?.canRegister === false) {
            setError(webinar.registrationBlockedMessage || 'You are not eligible to register for this webinar.');
            return;
        }
        if (!webinar?._id) return;
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const data = await registerForWebinar(webinar._id);
            if (data?.requiresPayment) {
                await openRazorpayCheckout(webinar);
            } else {
                setNotice('Registration successful. The join button unlocks in the live window.');
                await load();
            }
        } catch (e: unknown) {
            setError(getApiErrorMessage(e, 'Registration failed.'));
        } finally {
            setBusy(false);
        }
    };

    const handlePay = async () => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        if (!webinar?._id) return;
        if (webinar.mode !== 'PAID') {
            await handleRegister();
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await openRazorpayCheckout(webinar);
        } catch (e: unknown) {
            setError(getApiErrorMessage(e, 'Could not start payment.'));
        } finally {
            setBusy(false);
        }
    };

    const handleJoin = async () => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }
        if (!webinar?._id) return;
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const access = await getWebinarJoinAccess(webinar._id);
            if (!access.canJoin) {
                setNotice('Join is locked right now. It opens only in the configured live window.');
                return;
            }
            const joinData = await getWebinarJoinMeetingUrl(webinar._id);
            if (!joinData.meetingUrl) {
                setError('Meeting link is not available right now.');
                return;
            }
            window.open(joinData.meetingUrl, '_blank', 'noopener,noreferrer');
        } catch (e: unknown) {
            setError(getApiErrorMessage(e, 'Join failed.'));
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

    if (!webinar) {
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
        <>
            <DocumentHead
                title={`${webinar.title} | Verble Webinars`}
                description={webinar.topics?.join(', ') || 'Join this Verble English learning webinar.'}
                canonicalUrl={canonicalUrl}
            />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">
                        Home
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
                        {webinar.imageUrl ? (
                            <Box
                                component="img"
                                src={getWebinarImage(webinar.imageUrl)}
                                alt={webinar.title}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = getSplashImageUrl();
                                }}
                                sx={{
                                    width: '100%',
                                    maxHeight: 360,
                                    objectFit: 'cover',
                                    borderRadius: 2,
                                    mb: 2,
                                }}
                            />
                        ) : null}
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                <Chip label={statusLabel} color={statusLabel === 'LIVE' ? 'success' : 'primary'} />
                                <Chip
                                    label={webinar.mode === 'PAID' ? formatWebinarPrice(webinar.price) : 'Free'}
                                    variant="outlined"
                                />
                            </Stack>
                            <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5 }}>
                                {webinar.title}
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CalendarTodayIcon fontSize="small" />
                                    <Typography variant="body2">
                                        {new Date(webinar.startsAt).toLocaleString('en-IN', {
                                            dateStyle: 'full',
                                            timeStyle: 'short',
                                        })}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AccessTimeIcon fontSize="small" />
                                    <Typography variant="body2">
                                        Join window: {webinar.joinWindowBeforeMinutes} min before to{' '}
                                        {webinar.joinWindowAfterMinutes} min after
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
                                dangerouslySetInnerHTML={{
                                    __html: webinar.descriptionHtml || '<p>No description provided.</p>',
                                }}
                            />
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper variant="outlined" sx={{ p: 3, position: 'sticky', top: 90 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                Registration & Join
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {isAuthenticated
                                    ? 'Meeting link stays hidden until the live join window opens.'
                                    : 'Anyone can view this page. Sign in only when you want to register.'}
                            </Typography>

                            {isAuthenticated && webinar.canRegister === false && !isRegistered && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {webinar.registrationBlockedMessage ||
                                        'You are not eligible to register for this webinar.'}
                                </Alert>
                            )}

                            {!isAuthenticated ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<LoginIcon />}
                                    onClick={redirectToLogin}
                                    sx={{ mb: 1.5 }}
                                >
                                    Sign in to register
                                </Button>
                            ) : isRegistered ? (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Registered
                                    {webinar.registration?.accessGrantedBySubscription
                                        ? ' (included with your subscription)'
                                        : ''}
                                </Alert>
                            ) : needsPayment ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => void handlePay()}
                                    disabled={busy}
                                    sx={{ mb: 1.5 }}
                                >
                                    Pay {formatWebinarPrice(webinar.price)} to register
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => void handleRegister()}
                                    disabled={busy || statusLabel === 'ENDED' || webinar.canRegister === false}
                                    sx={{ mb: 1.5 }}
                                >
                                    {isPaidWebinar ? 'Register / Pay' : 'Register free'}
                                </Button>
                            )}

                            {isAuthenticated && isRegistered && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    endIcon={<OpenInNewIcon />}
                                    onClick={() => void handleJoin()}
                                    disabled={busy}
                                >
                                    Join webinar
                                </Button>
                            )}

                            {!isAuthenticated && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                                    Free webinars register instantly after login. Paid webinars open secure Razorpay checkout.
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
};

export default WebinarPage;
