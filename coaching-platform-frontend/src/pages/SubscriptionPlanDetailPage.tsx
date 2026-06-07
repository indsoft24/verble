import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert,
    Grid,
    Chip,
    Stack,
    Paper,
    alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useAuth } from '../contexts/AuthContext';
import LazyImage from '../components/common/LazyImage';
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMySubscriptionDetailsUser,
    type UserSubscriptionInstance,
} from '../services/subscriptionService';
import {
    getSubscriptionPlanById,
    type SubscriptionPlanPublic,
} from '../services/subscriptionPlanService';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';
import { brandAssets } from '../assets/brandAssets';
import { getPlanTierStyle, formatDurationLabel } from '../utils/planTierStyles';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';
import {
    findOwnedSubscription,
    userOwnsPlan,
    formatSubscriptionEndDate,
} from '../utils/subscriptionOwnershipUtils';

type PlanDetail = SubscriptionPlanPublic & {
    image?: string;
    course?: { _id: string; title: string; description?: string };
};

/** Consistent spacing scale for this page */
const PAGE_GAP = 3;
const CARD_PAD = { xs: 2.5, sm: 3, md: 3.5 } as const;

const sectionCardSx = (tierAccent: string, tinted = false) => ({
    p: CARD_PAD,
    borderRadius: 3,
    border: '1px solid',
    borderColor: tinted ? alpha(tierAccent, 0.22) : 'divider',
    bgcolor: tinted ? alpha(tierAccent, 0.04) : 'background.paper',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
});

const SubscriptionPlanDetailPage: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { user, refreshUser, isAuthenticated } = useAuth();

    const [plan, setPlan] = useState<PlanDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscribeLoading, setSubscribeLoading] = useState(false);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);
    const [currentUserSubscriptions, setCurrentUserSubscriptions] = useState<UserSubscriptionInstance[]>([]);

    useUserLayoutPage({ title: plan?.name || 'Plan Details' });

    const fetchPlanDetails = useCallback(async () => {
        if (!planId) {
            setError('Plan ID not found');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [fetchedPlan, userSubs] = await Promise.all([
                getSubscriptionPlanById(planId),
                isAuthenticated ? getMySubscriptionDetailsUser() : Promise.resolve([]),
            ]);
            setPlan(fetchedPlan);
            setCurrentUserSubscriptions(userSubs || []);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message || e.message || 'Failed to load plan details.');
        } finally {
            setIsLoading(false);
        }
    }, [planId, isAuthenticated]);

    useEffect(() => {
        fetchPlanDetails();
    }, [fetchPlanDetails]);

    const tier = useMemo(
        () => (plan ? getPlanTierStyle(plan.name) : getPlanTierStyle('')),
        [plan]
    );

    const ownedSub = plan ? findOwnedSubscription(currentUserSubscriptions, plan._id) : undefined;
    const isOwned = plan ? userOwnsPlan(currentUserSubscriptions, plan._id) : false;
    const validUntil = formatSubscriptionEndDate(ownedSub?.endDate);
    const durationLabel = plan
        ? formatDurationLabel(plan.duration?.value ?? 1, plan.duration?.unit ?? 'month')
        : '';

    const formatPrice = (price: number | undefined, currency: string | undefined) => {
        if (price == null || Number.isNaN(price) || !currency) return 'N/A';
        return (price / 100).toLocaleString('en-IN', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    const getImageForPlan = (p: PlanDetail): string => {
        if (p.image) return getImageUrl(p.image, 'subscription');
        return getImageUrl(undefined, 'subscription');
    };

    const handleSubscribe = async () => {
        if (!user || !plan) {
            setSubscribeError('You must be logged in to subscribe.');
            return;
        }
        if (isOwned) return;

        if (!plan.price || plan.price <= 0) {
            setSubscribeError(
                'This plan is free and is included when you register. Open your dashboard to start learning.'
            );
            return;
        }

        setSubscribeLoading(true);
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
                        await fetchPlanDetails();
                    } catch (err: unknown) {
                        const e = err as { message?: string };
                        setSubscribeError(e.message || 'Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phoneNumber || user.mobile || '',
                },
                notes: { plan_id: plan._id, user_id: user._id },
                theme: { color: tier.accent },
            };

            const rzp = new (window as unknown as {
                Razorpay: new (o: object) => {
                    open: () => void;
                    on: (e: string, cb: (r: { error: { description: string } }) => void) => void;
                };
            }).Razorpay(options);
            rzp.on('payment.failed', (response) => {
                setSubscribeError(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setSubscribeError(e.message || 'Failed to initiate payment.');
        } finally {
            setSubscribeLoading(false);
        }
    };

    const statItems = plan
        ? [
              { icon: AccessTimeRoundedIcon, label: 'Duration', value: durationLabel },
              {
                  icon: SchoolRoundedIcon,
                  label: 'Access',
                  value: plan.course?.title || 'Platform content',
              },
              {
                  icon: CheckCircleRoundedIcon,
                  label: 'Features',
                  value: `${plan.features?.length ?? 0} included`,
              },
          ]
        : [];

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !plan) {
        return (
            <Box>
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/subscription-plans')} sx={{ mt: 2 }}>
                    Back to plans
                </Button>
            </Box>
        );
    }

    if (!plan) {
        return (
            <Box>
                <Alert severity="warning">Plan not found.</Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/subscription-plans')} sx={{ mt: 2 }}>
                    Back to plans
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: { xs: 12, md: 4 }, width: '100%' }}>
            <Stack spacing={PAGE_GAP}>
                {/* Nav */}
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/subscription-plans')}
                    sx={{
                        alignSelf: 'flex-start',
                        color: learnerBrandTheme.textSecondary,
                        fontWeight: 600,
                        px: 0,
                        minWidth: 0,
                    }}
                >
                    Back to plans
                </Button>

                {subscribeSuccess && <Alert severity="success">{subscribeSuccess}</Alert>}
                {subscribeError && <Alert severity="error">{subscribeError}</Alert>}

                {isOwned && (
                    <Alert severity="success" icon={<VerifiedRoundedIcon />} sx={{ borderRadius: 2 }}>
                        You already have this plan.
                        {validUntil ? ` Active until ${validUntil}.` : ''}{' '}
                        <Button
                            component={RouterLink}
                            to="/my-subscription"
                            size="small"
                            sx={{ ml: 0.5, fontWeight: 700 }}
                        >
                            View my subscriptions
                        </Button>
                    </Alert>
                )}

                {/* Hero */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: tier.gradient,
                        border: '2px solid',
                        borderColor: alpha(tier.accent, 0.35),
                        boxShadow: `0 12px 40px ${alpha(tier.accent, 0.12)}`,
                    }}
                >
                    <Box sx={{ p: CARD_PAD }}>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={3}
                            alignItems={{ xs: 'stretch', md: 'center' }}
                            justifyContent="space-between"
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2, gap: 1 }}>
                                    <Chip
                                        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                        label={durationLabel}
                                        size="small"
                                        sx={{ bgcolor: tier.chipBg, color: tier.accent, fontWeight: 700 }}
                                    />
                                    {plan.badge && (
                                        <Chip label={plan.badge} size="small" sx={{ fontWeight: 600 }} />
                                    )}
                                    {plan.topic && (
                                        <Chip label={plan.topic} size="small" variant="outlined" />
                                    )}
                                    {plan.subTopic && (
                                        <Chip label={plan.subTopic} size="small" variant="outlined" />
                                    )}
                                </Stack>
                                <Typography
                                    variant="h3"
                                    component="h1"
                                    sx={{
                                        fontWeight: 800,
                                        color: '#0f172a',
                                        lineHeight: 1.15,
                                        fontSize: { xs: '1.65rem', sm: '1.85rem', md: '2.15rem' },
                                    }}
                                >
                                    {plan.name}
                                </Typography>
                                {plan.description && (
                                    <Typography
                                        variant="body1"
                                        sx={{ mt: 1.5, color: '#475569', maxWidth: 720, lineHeight: 1.65 }}
                                    >
                                        {plan.description}
                                    </Typography>
                                )}
                            </Box>

                            <Paper
                                elevation={0}
                                sx={{
                                    px: { xs: 2.5, md: 3 },
                                    py: { xs: 2, md: 2.5 },
                                    borderRadius: 3,
                                    bgcolor: 'rgba(255,255,255,0.94)',
                                    border: '1px solid',
                                    borderColor: alpha(tier.accent, 0.2),
                                    minWidth: { md: 200 },
                                    alignSelf: { xs: 'stretch', md: 'flex-start' },
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 800, color: tier.accent, lineHeight: 1 }}>
                                    {formatPrice(plan.price, plan.currency)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                    One-time payment
                                </Typography>
                                {plan.marketValue != null && plan.marketValue > (plan.price ?? 0) && (
                                    <Typography
                                        variant="body2"
                                        sx={{ mt: 1, color: 'text.secondary', textDecoration: 'line-through' }}
                                    >
                                        {formatPrice(plan.marketValue, plan.currency)}
                                    </Typography>
                                )}
                            </Paper>
                        </Stack>
                    </Box>
                </Paper>

                {/* Quick stats — full width row */}
                <Grid container spacing={2}>
                    {statItems.map((stat) => (
                        <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    ...sectionCardSx(tier.accent),
                                    height: '100%',
                                    minHeight: { xs: 'auto', sm: 108 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-start',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(tier.accent, 0.1),
                                        mb: 1.5,
                                    }}
                                >
                                    <stat.icon sx={{ color: tier.accent, fontSize: 22 }} />
                                </Box>
                                <Typography
                                    variant="overline"
                                    color="text.secondary"
                                    sx={{ fontWeight: 700, letterSpacing: 0.6, lineHeight: 1.4 }}
                                >
                                    {stat.label}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    sx={{
                                        mt: 0.5,
                                        lineHeight: 1.45,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {stat.value}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Main body */}
                <Grid container spacing={3} alignItems="flex-start">
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                ...sectionCardSx(tier.accent),
                                p: 0,
                                overflow: 'hidden',
                                position: { lg: 'sticky' },
                                top: { lg: 24 },
                            }}
                        >
                            <Box sx={{ position: 'relative', aspectRatio: { xs: '16/10', sm: '5/4', lg: '4/5' } }}>
                                <LazyImage
                                    src={getImageForPlan(plan)}
                                    alt={plan.name}
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        (e.target as HTMLImageElement).src = getSplashImageUrl();
                                    }}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: `linear-gradient(180deg, transparent 55%, ${alpha('#0f172a', 0.5)} 100%)`,
                                        pointerEvents: 'none',
                                    }}
                                />
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2.5 }}>
                                    <Chip
                                        icon={<AccessTimeRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                        label={durationLabel}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.94)', fontWeight: 600 }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 7 }}>
                        <Stack spacing={PAGE_GAP}>
                            {plan.course && (
                                <Paper elevation={0} sx={sectionCardSx(tier.accent, true)}>
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                        sx={{ fontWeight: 700, letterSpacing: 0.8 }}
                                    >
                                        Included course
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, lineHeight: 1.35 }}>
                                        {plan.course.title}
                                    </Typography>
                                    {plan.course.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1.5, lineHeight: 1.65 }}
                                        >
                                            {plan.course.description}
                                        </Typography>
                                    )}
                                    <Button
                                        component={RouterLink}
                                        to={`/courses/${plan.course._id}`}
                                        size="medium"
                                        variant="outlined"
                                        sx={{
                                            mt: 2.5,
                                            fontWeight: 700,
                                            borderColor: tier.accent,
                                            color: tier.accent,
                                            borderRadius: 2,
                                            px: 2.5,
                                        }}
                                    >
                                        Preview course
                                    </Button>
                                </Paper>
                            )}

                            {plan.features && plan.features.length > 0 && (
                                <Paper elevation={0} sx={sectionCardSx(tier.accent)}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>
                                        What&apos;s included
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {plan.features.map((feature, index) => (
                                            <Grid key={index} size={{ xs: 12, sm: 6 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1.5}
                                                    alignItems="flex-start"
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: alpha(tier.accent, 0.04),
                                                        height: '100%',
                                                    }}
                                                >
                                                    <CheckCircleRoundedIcon
                                                        sx={{
                                                            fontSize: 22,
                                                            color: tier.accent,
                                                            mt: 0.1,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ lineHeight: 1.55 }}
                                                    >
                                                        {feature}
                                                    </Typography>
                                                </Stack>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            )}

                            {/* Desktop CTA */}
                            <Paper
                                elevation={0}
                                sx={{
                                    ...sectionCardSx(tier.accent, true),
                                    display: { xs: 'none', md: 'block' },
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={3}
                                    alignItems="center"
                                    justifyContent="space-between"
                                    flexWrap="wrap"
                                    useFlexGap
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: tier.accent, lineHeight: 1.1 }}>
                                            {formatPrice(plan.price, plan.currency)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                            {durationLabel} access · secure Razorpay checkout
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={
                                            isOwned ? (
                                                <VerifiedRoundedIcon />
                                            ) : subscribeLoading ? undefined : (
                                                <ShoppingCartRoundedIcon />
                                            )
                                        }
                                        onClick={handleSubscribe}
                                        disabled={
                                            subscribeLoading ||
                                            isOwned ||
                                            !plan.price ||
                                            plan.price <= 0 ||
                                            !isAuthenticated
                                        }
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            bgcolor: isOwned ? 'success.main' : tier.accent,
                                            minWidth: 220,
                                            flexShrink: 0,
                                            '&:hover': {
                                                bgcolor: isOwned ? 'success.dark' : tier.accent,
                                                filter: isOwned ? 'none' : 'brightness(0.92)',
                                            },
                                        }}
                                    >
                                        {!isAuthenticated
                                            ? 'Login to subscribe'
                                            : !plan.price || plan.price <= 0
                                              ? 'Free with registration'
                                              : isOwned
                                                ? 'Already subscribed'
                                                : subscribeLoading
                                                  ? <CircularProgress size={24} color="inherit" />
                                                  : 'Subscribe now'}
                                    </Button>
                                </Stack>
                                {!isAuthenticated && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                        <Button
                                            component={RouterLink}
                                            to={`/login?redirectTo=/subscription-plans/${planId}`}
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            Sign in
                                        </Button>{' '}
                                        to purchase this plan.
                                    </Typography>
                                )}
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>

                <Alert severity="info" icon={<LockRoundedIcon />} sx={{ borderRadius: 2 }}>
                    Payments are processed securely via Razorpay. If checkout fails, your admin may need to
                    update live API keys in server settings.
                </Alert>
            </Stack>

            {/* Mobile sticky CTA */}
            <Paper
                elevation={12}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1100,
                    px: 2,
                    py: 1.75,
                    pb: 'max(14px, env(safe-area-inset-bottom))',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={800} color={tier.accent} noWrap>
                            {formatPrice(plan.price, plan.currency)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {durationLabel}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        size="medium"
                        onClick={
                            isAuthenticated
                                ? handleSubscribe
                                : () => navigate(`/login?redirectTo=/subscription-plans/${planId}`)
                        }
                        disabled={
                            subscribeLoading || isOwned || ((!plan.price || plan.price <= 0) && isAuthenticated)
                        }
                        startIcon={isOwned ? <VerifiedRoundedIcon /> : <ShoppingCartRoundedIcon />}
                        sx={{
                            fontWeight: 700,
                            borderRadius: 2,
                            bgcolor: isOwned ? 'success.main' : tier.accent,
                            whiteSpace: 'nowrap',
                            px: 2.5,
                        }}
                    >
                        {isOwned
                            ? 'Subscribed'
                            : subscribeLoading
                              ? <CircularProgress size={20} color="inherit" />
                              : 'Subscribe'}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default SubscriptionPlanDetailPage;
