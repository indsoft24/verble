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
import RichTextContent from '../components/common/RichTextContent';
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
const PAGE_GAP = { xs: 2, sm: 2.5, md: 3 } as const;
const CARD_PAD = { xs: 2, sm: 2.75, md: 3.5 } as const;
/** Align with UserLayout main padding (xs: 2 = 16px) */
const PAGE_GUTTER_X = { xs: 0, sm: 0 } as const;

const sectionCardSx = (tierAccent: string, tinted = false) => ({
    p: CARD_PAD,
    borderRadius: { xs: 2.5, sm: 3 },
    border: '1px solid',
    borderColor: tinted ? alpha(tierAccent, 0.22) : 'divider',
    bgcolor: tinted ? alpha(tierAccent, 0.04) : 'background.paper',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
});

type StatItem = {
    icon: React.ComponentType<{ sx?: object }>;
    label: string;
    value: string;
    shortValue?: string;
};

function PlanStatsGrid({ items, tierAccent, variant }: { items: StatItem[]; tierAccent: string; variant: 'desktop' | 'mobile' }) {
    if (variant === 'mobile') {
        return (
            <Stack direction="row" spacing={1.25} sx={{ width: '100%' }}>
                {items.map((stat) => (
                    <Paper
                        key={stat.label}
                        elevation={0}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            p: 1.25,
                            borderRadius: 2,
                            textAlign: 'center',
                            border: '1px solid',
                            borderColor: alpha(tierAccent, 0.14),
                            bgcolor: alpha(tierAccent, 0.05),
                        }}
                    >
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                mx: 'auto',
                                mb: 0.75,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(tierAccent, 0.12),
                            }}
                        >
                            <stat.icon sx={{ color: tierAccent, fontSize: 18 }} />
                        </Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: 0.3,
                                display: 'block',
                                lineHeight: 1.2,
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                            }}
                        >
                            {stat.label}
                        </Typography>
                        <Typography
                            variant="caption"
                            fontWeight={700}
                            sx={{
                                display: 'block',
                                mt: 0.35,
                                lineHeight: 1.35,
                                fontSize: '0.72rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {stat.shortValue ?? stat.value}
                        </Typography>
                    </Paper>
                ))}
            </Stack>
        );
    }

    return (
        <Grid container spacing={2}>
            {items.map((stat) => (
                <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            ...sectionCardSx(tierAccent),
                            height: '100%',
                            minHeight: 108,
                            display: 'flex',
                            flexDirection: 'column',
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
                                bgcolor: alpha(tierAccent, 0.1),
                                mb: 1.5,
                            }}
                        >
                            <stat.icon sx={{ color: tierAccent, fontSize: 22 }} />
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
    );
}

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

    const accessTitle = plan?.course?.title || 'Platform content';
    const statItems: StatItem[] = plan
        ? [
              {
                  icon: AccessTimeRoundedIcon,
                  label: 'Duration',
                  value: durationLabel,
                  shortValue: durationLabel,
              },
              {
                  icon: SchoolRoundedIcon,
                  label: 'Access',
                  value: accessTitle,
                  shortValue: plan.course ? 'Full course' : 'Platform',
              },
              {
                  icon: CheckCircleRoundedIcon,
                  label: 'Features',
                  value: `${plan.features?.length ?? 0} included`,
                  shortValue: `${plan.features?.length ?? 0} items`,
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
        <Box
            sx={{
                pb: { xs: 'calc(96px + env(safe-area-inset-bottom))', md: 4 },
                width: '100%',
                px: PAGE_GUTTER_X,
            }}
        >
            <Stack spacing={PAGE_GAP}>
                {/* Nav */}
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/subscription-plans')}
                    sx={{
                        alignSelf: 'flex-start',
                        color: learnerBrandTheme.textSecondary,
                        fontWeight: 600,
                        px: 0.5,
                        py: 0.75,
                        minWidth: 0,
                        minHeight: 44,
                        textTransform: 'none',
                        fontSize: '0.875rem',
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
                        borderRadius: { xs: 2.5, sm: 4 },
                        overflow: 'hidden',
                        background: tier.gradient,
                        border: '2px solid',
                        borderColor: alpha(tier.accent, 0.35),
                        boxShadow: { xs: `0 4px 20px ${alpha(tier.accent, 0.1)}`, md: `0 12px 40px ${alpha(tier.accent, 0.12)}` },
                    }}
                >
                    <Box sx={{ p: CARD_PAD }}>
                        {/* Mobile: compact title + price row */}
                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="flex-start"
                            justifyContent="space-between"
                            sx={{ display: { xs: 'flex', md: 'none' }, mb: 1.5 }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1, gap: 0.75 }}>
                                    <Chip
                                        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '14px !important' }} />}
                                        label={durationLabel}
                                        size="small"
                                        sx={{ bgcolor: tier.chipBg, color: tier.accent, fontWeight: 700, height: 26 }}
                                    />
                                    {plan.badge && (
                                        <Chip label={plan.badge} size="small" sx={{ fontWeight: 600, height: 26 }} />
                                    )}
                                </Stack>
                                <Typography
                                    variant="h5"
                                    component="h1"
                                    sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}
                                >
                                    {plan.name}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right', flexShrink: 0, pt: 0.25 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: tier.accent, lineHeight: 1 }}>
                                    {formatPrice(plan.price, plan.currency)}
                                </Typography>
                                {plan.marketValue != null && plan.marketValue > (plan.price ?? 0) && (
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'text.secondary', textDecoration: 'line-through', display: 'block' }}
                                    >
                                        {formatPrice(plan.marketValue, plan.currency)}
                                    </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                    one-time
                                </Typography>
                            </Box>
                        </Stack>

                        {plan.description && (
                            <RichTextContent
                                html={plan.description}
                                variant="light"
                                sx={{
                                    display: { xs: 'block', md: 'none' },
                                    mb: 1.5,
                                    '& p': { typography: 'body2', lineHeight: 1.6, mb: 0.75, color: '#475569' },
                                    '& p:last-child': { mb: 0 },
                                }}
                            />
                        )}

                        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 0.5 }}>
                            <PlanStatsGrid items={statItems} tierAccent={tier.accent} variant="mobile" />
                        </Box>

                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={{ xs: 2, md: 3 }}
                            alignItems={{ xs: 'stretch', md: 'center' }}
                            justifyContent="space-between"
                            sx={{ display: { xs: 'none', md: 'flex' } }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: { xs: 1.5, sm: 2 }, gap: 1 }}>
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
                                        fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.15rem' },
                                    }}
                                >
                                    {plan.name}
                                </Typography>
                                {plan.description && (
                                    <RichTextContent
                                        html={plan.description}
                                        variant="light"
                                        sx={{
                                            mt: 1.5,
                                            maxWidth: 720,
                                            '& p': { typography: 'body1', lineHeight: 1.65, mb: 1, color: '#475569' },
                                            '& p:last-child': { mb: 0 },
                                        }}
                                    />
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

                        {/* Mobile topic chips */}
                        {(plan.topic || plan.subTopic) && (
                            <Stack
                                direction="row"
                                spacing={0.75}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ display: { xs: 'flex', md: 'none' }, mt: 1.5, gap: 0.75 }}
                            >
                                {plan.topic && <Chip label={plan.topic} size="small" variant="outlined" sx={{ height: 26 }} />}
                                {plan.subTopic && (
                                    <Chip label={plan.subTopic} size="small" variant="outlined" sx={{ height: 26 }} />
                                )}
                            </Stack>
                        )}
                    </Box>
                </Paper>

                {/* Desktop stats */}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <PlanStatsGrid items={statItems} tierAccent={tier.accent} variant="desktop" />
                </Box>

                {/* Main body — image before details on mobile */}
                <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
                    <Grid size={{ xs: 12, lg: 5 }} sx={{ order: { xs: 2, lg: 1 } }}>
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
                            <Box
                                sx={{
                                    position: 'relative',
                                    aspectRatio: { xs: '16/10', sm: '5/4', lg: '4/5' },
                                    maxHeight: { xs: 220, sm: 360, lg: 'none' },
                                }}
                            >
                                <LazyImage
                                    src={getImageForPlan(plan)}
                                    alt={plan.name}
                                    loading="eager"
                                    fetchPriority="high"
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
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: { xs: 1.5, sm: 2.5 } }}>
                                    <Chip
                                        icon={<AccessTimeRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                        label={durationLabel}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.94)',
                                            fontWeight: 600,
                                            display: { xs: 'none', sm: 'inline-flex' },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 7 }} sx={{ order: { xs: 1, lg: 2 } }}>
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
                                        <RichTextContent
                                            html={plan.course.description}
                                            variant="light"
                                            sx={{
                                                mt: 1.5,
                                                '& p': { typography: 'body2', lineHeight: 1.65, mb: 1, color: 'text.secondary' },
                                                '& p:last-child': { mb: 0 },
                                            }}
                                        />
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
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                        What&apos;s included
                                    </Typography>

                                    {/* Mobile: clean vertical list */}
                                    <Stack
                                        spacing={0}
                                        sx={{ display: { xs: 'flex', sm: 'none' } }}
                                    >
                                        {plan.features.map((feature, index, features) => (
                                            <Stack
                                                key={index}
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="flex-start"
                                                sx={{
                                                    py: 1.5,
                                                    borderBottom:
                                                        index < features.length - 1 ? '1px solid' : 'none',
                                                    borderColor: 'divider',
                                                }}
                                            >
                                                <CheckCircleRoundedIcon
                                                    sx={{ fontSize: 20, color: tier.accent, mt: 0.15, flexShrink: 0 }}
                                                />
                                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                                                    {feature}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>

                                    {/* Tablet+ : two-column grid */}
                                    <Grid container spacing={2} sx={{ display: { xs: 'none', sm: 'flex' } }}>
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
                                                        sx={{ fontSize: 22, color: tier.accent, mt: 0.1, flexShrink: 0 }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
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

                <Alert
                    severity="info"
                    icon={<LockRoundedIcon />}
                    sx={{
                        borderRadius: 2,
                        '& .MuiAlert-message': { fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.5 },
                    }}
                >
                    Payments are processed securely via Razorpay.
                </Alert>
            </Stack>

            {/* Mobile sticky CTA — inset matches page gutters */}
            <Paper
                elevation={8}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    position: 'fixed',
                    bottom: 'max(12px, env(safe-area-inset-bottom))',
                    left: { xs: 16, sm: 24 },
                    right: { xs: 16, sm: 24 },
                    zIndex: 1100,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.12)',
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={800} color={tier.accent} lineHeight={1.1}>
                                {formatPrice(plan.price, plan.currency)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                {durationLabel} · one-time
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
                                py: 1,
                                minHeight: 44,
                                boxShadow: 'none',
                                flexShrink: 0,
                            }}
                        >
                            {isOwned
                                ? 'Subscribed'
                                : subscribeLoading
                                  ? <CircularProgress size={20} color="inherit" />
                                  : 'Subscribe'}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
};

export default SubscriptionPlanDetailPage;
