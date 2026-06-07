import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Button,
    CircularProgress,
    Alert,
    Box,
    Chip,
    Card,
    CardContent,
    Grid,
    Stack,
    alpha,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMySubscriptionDetailsUser,
    type UserSubscriptionInstance,
} from '../services/subscriptionService';
import {
    getActiveSubscriptionPlans,
    type SubscriptionPlanPublic,
} from '../services/subscriptionPlanService';
import { useAuth } from '../contexts/AuthContext';
import { brandAssets } from '../assets/brandAssets';
import { getPlanTierStyle, formatDurationLabel } from '../utils/planTierStyles';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';

const SubscriptionPlansPage: React.FC = () => {
    useUserLayoutPage({ title: 'Plans' });
    const navigate = useNavigate();
    const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);
    const [currentUserSubscriptions, setCurrentUserSubscriptions] = useState<UserSubscriptionInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);

    const { user, refreshUser } = useAuth();

    const paidPlans = useMemo(
        () => plans.filter((p) => typeof p.price === 'number' && p.price > 0),
        [plans]
    );

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedPlans, userSubs] = await Promise.all([
                getActiveSubscriptionPlans(),
                getMySubscriptionDetailsUser(),
            ]);
            setPlans(fetchedPlans || []);
            setCurrentUserSubscriptions(userSubs || []);
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e.message || 'Failed to load plans.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatPrice = (price: number, currency: string) =>
        (price / 100).toLocaleString('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

    const handleSubscribe = async (plan: SubscriptionPlanPublic) => {
        if (!user) {
            setSubscribeError('You must be logged in to subscribe.');
            return;
        }
        if (!plan.price || plan.price <= 0) {
            setSubscribeError('This plan is free — use your dashboard after registration.');
            return;
        }

        setSubscribeLoading(plan._id);
        setSubscribeError(null);
        setSubscribeSuccess(null);

        try {
            const { order } = await createRazorpayOrder(plan._id);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Verble',
                description: `Payment for ${plan.name}`,
                image: brandAssets.primaryLogo,
                order_id: order.id,
                handler: async function (response: {
                    razorpay_payment_id: string;
                    razorpay_order_id: string;
                    razorpay_signature: string;
                }) {
                    try {
                        const verificationResponse = await verifyRazorpayPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: plan._id,
                        });
                        setSubscribeSuccess(verificationResponse.message);
                        if (refreshUser) await refreshUser();
                        await fetchData();
                    } catch (err: unknown) {
                        const e = err as { message?: string };
                        setSubscribeError(e.message || 'Payment verification failed.');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phoneNumber || user.mobile || '',
                },
                notes: { plan_id: plan._id, user_id: user._id },
                theme: { color: learnerBrandTheme.accent },
            };

            const rzp = new (window as unknown as { Razorpay: new (o: object) => { open: () => void; on: (e: string, cb: (r: { error: { description: string } }) => void) => void } }).Razorpay(options);
            rzp.on('payment.failed', (response) => {
                setSubscribeError(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setSubscribeError(e.message || 'Could not start payment.');
        } finally {
            setSubscribeLoading(null);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
        );
    }

    return (
        <>
        <Box
                sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    mb: 4,
                    p: { xs: 3, md: 5 },
                    background: `linear-gradient(165deg, ${alpha(learnerBrandTheme.accent, 0.96)} 0%, ${alpha(
                        '#0f766e',
                        0.92
                    )} 40%, ${alpha('#134e4a', 0.96)} 100%)`,
                    color: '#fff',
                    position: 'relative',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: -80,
                        right: -40,
                        width: 280,
                        height: 280,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}
                />
                <Stack spacing={2} sx={{ position: 'relative', maxWidth: 640 }}>
                    <Chip
                        icon={<AutoAwesomeRoundedIcon sx={{ color: '#c7d2fe !important' }} />}
                        label="Upgrade your English journey"
                        size="small"
                        sx={{
                            alignSelf: 'flex-start',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            color: '#e0e7ff',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                    />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        Choose your learning plan
                    </Typography>
                    <Typography variant="body1" sx={{ color: alpha('#fff', 0.85), lineHeight: 1.6 }}>
                        Paid tiers unlock Bronze, Silver, Gold, and Full Course content on your dashboard.
                        Free Foundation is already yours when you sign up — no payment needed.
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/dashboard')}
                        sx={{
                            alignSelf: 'flex-start',
                            color: '#fff',
                            borderColor: alpha('#fff', 0.4),
                            '&:hover': { borderColor: '#fff', bgcolor: alpha('#fff', 0.08) },
                        }}
                    >
                        Back to dashboard
                    </Button>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {subscribeSuccess && <Alert severity="success" sx={{ mb: 2 }}>{subscribeSuccess}</Alert>}
            {subscribeError && <Alert severity="error" sx={{ mb: 2 }}>{subscribeError}</Alert>}

            {paidPlans.length === 0 ? (
                <Alert severity="info">
                    No paid plans are available right now. Your free tier is active on the dashboard.
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {paidPlans.map((plan) => {
                        const tier = getPlanTierStyle(plan.name);
                        const isActive = currentUserSubscriptions.some(
                            (sub) =>
                                sub.status === 'active' &&
                                (sub.planId as SubscriptionPlanPublic)?._id === plan._id
                        );
                        const durationLabel = formatDurationLabel(
                            plan.duration?.value ?? 1,
                            plan.duration?.unit ?? 'month'
                        );

                        return (
                            <Grid key={plan._id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3,
                                        border: '2px solid',
                                        borderColor: isActive
                                            ? 'success.main'
                                            : tier.featured
                                              ? tier.accent
                                              : 'divider',
                                        background: tier.gradient,
                                        boxShadow: tier.featured
                                            ? `0 12px 40px ${alpha(tier.accent, 0.25)}`
                                            : '0 4px 20px rgba(15,23,42,0.06)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        position: 'relative',
                                        overflow: 'visible',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 16px 48px ${alpha(tier.accent, 0.2)}`,
                                        },
                                    }}
                                >
                                    {tier.featured && !isActive && (
                                        <Chip
                                            icon={<StarRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                            label="Popular"
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: -12,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                bgcolor: tier.accent,
                                                color: '#fff',
                                                fontWeight: 700,
                                                zIndex: 1,
                                            }}
                                        />
                                    )}
                                    {isActive && (
                                        <Chip
                                            label="Your plan"
                                            size="small"
                                            color="success"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                fontWeight: 700,
                                                zIndex: 1,
                                            }}
                                        />
                                    )}

                                    <CardContent
                                        sx={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            pt: tier.featured ? 3.5 : 2.5,
                                            pb: 2,
                                        }}
                                    >
                                        <Chip
                                            label={durationLabel}
                                            size="small"
                                            sx={{
                                                alignSelf: 'flex-start',
                                                mb: 1.5,
                                                bgcolor: tier.chipBg,
                                                color: tier.accent,
                                                fontWeight: 600,
                                            }}
                                        />

                                        <Typography
                                            variant="h5"
                                            component="h2"
                                            sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}
                                        >
                                            {plan.name}
                                        </Typography>

                                        {plan.description && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 2, minHeight: 40 }}
                                            >
                                                {plan.description}
                                            </Typography>
                                        )}

                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 800,
                                                color: tier.accent,
                                                mb: 2,
                                            }}
                                        >
                                            {formatPrice(plan.price, plan.currency)}
                                        </Typography>

                                        {plan.features && plan.features.length > 0 && (
                                            <Stack spacing={1} sx={{ mb: 2, flexGrow: 1 }}>
                                                {plan.features.slice(0, 5).map((feature, idx) => (
                                                    <Stack
                                                        key={idx}
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="flex-start"
                                                    >
                                                        <CheckCircleRoundedIcon
                                                            sx={{
                                                                fontSize: 20,
                                                                color: tier.accent,
                                                                mt: 0.15,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {feature}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        )}

                                        <Stack spacing={1} sx={{ mt: 'auto' }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                disabled={isActive || subscribeLoading === plan._id}
                                                onClick={() => handleSubscribe(plan)}
                                                sx={{
                                                    py: 1.25,
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                    bgcolor: tier.accent,
                                                    boxShadow: `0 4px 14px ${alpha(tier.accent, 0.4)}`,
                                                    '&:hover': { bgcolor: tier.accent, filter: 'brightness(0.92)' },
                                                }}
                                            >
                                                {isActive ? (
                                                    'Active'
                                                ) : subscribeLoading === plan._id ? (
                                                    <CircularProgress size={22} color="inherit" />
                                                ) : (
                                                    'Subscribe now'
                                                )}
                                            </Button>
                                            <Button
                                                variant="text"
                                                fullWidth
                                                startIcon={<ExploreOutlinedIcon />}
                                                onClick={() => navigate(`/subscription-plans/${plan._id}`)}
                                                sx={{ color: '#475569', fontWeight: 600 }}
                                            >
                                                View details
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <Alert
                severity="info"
                icon={<LockRoundedIcon />}
                sx={{ mt: 4, borderRadius: 2 }}
            >
                Payments are processed securely via Razorpay. If checkout fails, your admin may need to
                update live API keys in server settings.
            </Alert>
        </>
    );
};

export default SubscriptionPlansPage;
