import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Stack,
    Typography,
    alpha,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import RichTextContent from '../common/RichTextContent';
import PlanPriceOffer from './PlanPriceOffer';
import type { SubscriptionPlanPublic } from '../../services/subscriptionPlanService';
import { getMySubscriptionDetailsUser, type UserSubscriptionInstance } from '../../services/subscriptionPlanService';
import { getPlanOfferLabels } from '../../utils/planPriceFormat';
import { getPlanTierStyle, formatDurationLabel } from '../../utils/planTierStyles';
import { userOwnsPlan } from '../../utils/subscriptionOwnershipUtils';
import { useAuth } from '../../contexts/AuthContext';

function extractFeatureBullets(html?: string, features?: string[], max = 5): string[] {
    if (features && features.length > 0) {
        return features.slice(0, max);
    }
    if (!html) return [];

    const listItems = [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gis)]
        .map((match) => match[1].replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);
    if (listItems.length > 0) return listItems.slice(0, max);

    const paragraphs = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gis)]
        .map((match) => match[1].replace(/<[^>]+>/g, '').trim())
        .filter((text) => text.length > 0 && text.length < 180);
    return paragraphs.slice(0, max);
}

type PlanCardProps = {
    plan: SubscriptionPlanPublic;
    isAuthenticated: boolean;
    isOwned: boolean;
    onEnroll: (plan: SubscriptionPlanPublic) => void;
    onViewDetails: (plan: SubscriptionPlanPublic) => void;
};

const PlanCard: React.FC<PlanCardProps> = ({ plan, isAuthenticated, isOwned, onEnroll, onViewDetails }) => {
    const tier = getPlanTierStyle(plan.name);
    const { offer, original } = getPlanOfferLabels(plan);
    const bullets = extractFeatureBullets(plan.description, plan.features);
    const isFree = !plan.price || plan.price <= 0;
    const durationLabel = formatDurationLabel(plan.duration?.value ?? 1, plan.duration?.unit ?? 'month');

    const ctaLabel = isOwned
        ? 'Already enrolled'
        : !isAuthenticated
          ? isFree
              ? 'Sign in — it\'s free'
              : 'Sign in to enroll'
          : isFree
            ? 'Start learning free'
            : 'Enroll now';

    return (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                border: '1px solid',
                borderColor: isOwned ? 'success.main' : alpha(tier.accent, 0.28),
                background: tier.gradient,
                boxShadow: tier.featured
                    ? `0 16px 40px ${alpha(tier.accent, 0.18)}`
                    : '0 4px 20px rgba(15,23,42,0.06)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 20px 48px ${alpha(tier.accent, 0.22)}`,
                },
            }}
        >
            <Box
                sx={{
                    height: 5,
                    borderRadius: '16px 16px 0 0',
                    background: `linear-gradient(90deg, ${tier.accent} 0%, ${alpha(tier.accent, 0.55)} 100%)`,
                }}
            />

            {tier.featured && !isOwned && (
                <Chip
                    icon={<StarRoundedIcon sx={{ fontSize: '16px !important' }} />}
                    label={plan.badge || 'Popular'}
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

            {isOwned && (
                <Chip
                    icon={<VerifiedRoundedIcon sx={{ fontSize: '16px !important' }} />}
                    label="Active plan"
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
                    p: { xs: 2.25, sm: 2.75 },
                    pt: tier.featured ? 3.5 : 2.75,
                }}
            >
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5, gap: 0.75 }}>
                    <Chip
                        label={durationLabel}
                        size="small"
                        sx={{
                            bgcolor: tier.chipBg,
                            color: tier.accent,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                        }}
                    />
                    {isFree && (
                        <Chip
                            label="Free tier"
                            size="small"
                            sx={{
                                bgcolor: alpha('#10b981', 0.12),
                                color: '#047857',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                            }}
                        />
                    )}
                </Stack>

                <Typography
                    component="h3"
                    sx={{
                        fontWeight: 800,
                        fontSize: { xs: '1.15rem', sm: '1.3rem' },
                        color: '#0f172a',
                        lineHeight: 1.25,
                        mb: 1,
                    }}
                >
                    {plan.name}
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Our limited time price:
                    </Typography>
                    <PlanPriceOffer offerLabel={offer} originalLabel={original} size="lg" />
                    {original && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                            Limited-time offer
                        </Typography>
                    )}
                </Box>

                {bullets.length > 0 ? (
                    <Stack spacing={1.1} sx={{ mb: 2, flexGrow: 1 }}>
                        {bullets.map((item, index) => (
                            <Stack key={`${plan._id}-feature-${index}`} direction="row" spacing={1} alignItems="flex-start">
                                <CheckCircleRoundedIcon
                                    sx={{ fontSize: 18, color: tier.accent, mt: 0.15, flexShrink: 0 }}
                                />
                                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.55 }}>
                                    {item}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                ) : (
                    <RichTextContent
                        html={plan.description}
                        variant="light"
                        sx={{
                            mb: 2,
                            flexGrow: 1,
                            '& p': {
                                typography: 'body2',
                                lineHeight: 1.6,
                                mb: 0.75,
                                color: '#475569',
                            },
                            '& p:last-child': { mb: 0 },
                            '& ul': { pl: 2.2, mb: 0 },
                            '& li': { color: '#475569', lineHeight: 1.55, mb: 0.5 },
                        }}
                    />
                )}

                <Stack spacing={1} sx={{ mt: 'auto' }}>
                    <Button
                        variant="contained"
                        fullWidth
                        disabled={isOwned}
                        onClick={() => onEnroll(plan)}
                        startIcon={
                            isOwned ? (
                                <VerifiedRoundedIcon />
                            ) : !isAuthenticated ? (
                                <LoginRoundedIcon />
                            ) : (
                                <RocketLaunchRoundedIcon />
                            )
                        }
                        sx={{
                            py: 1.35,
                            fontWeight: 700,
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            bgcolor: isOwned ? 'success.main' : tier.accent,
                            boxShadow: isOwned ? 'none' : `0 6px 18px ${alpha(tier.accent, 0.35)}`,
                            '&:hover': {
                                bgcolor: isOwned ? 'success.dark' : tier.accent,
                                filter: isOwned ? 'none' : 'brightness(0.94)',
                            },
                        }}
                    >
                        {ctaLabel}
                    </Button>
                    <Button
                        variant="text"
                        fullWidth
                        onClick={() => onViewDetails(plan)}
                        sx={{ color: '#475569', fontWeight: 600, textTransform: 'none' }}
                    >
                        View plan details
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

type Props = {
    plans: SubscriptionPlanPublic[];
};

const CourseValueBreakdownSection: React.FC<Props> = ({ plans }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [subscriptions, setSubscriptions] = useState<UserSubscriptionInstance[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setSubscriptions([]);
            return;
        }
        setSubsLoading(true);
        getMySubscriptionDetailsUser()
            .then((subs) => setSubscriptions(subs || []))
            .catch(() => setSubscriptions([]))
            .finally(() => setSubsLoading(false));
    }, [isAuthenticated]);

    const sortedPlans = useMemo(
        () => [...plans].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)),
        [plans]
    );

    const handlePlanEnroll = (plan: SubscriptionPlanPublic) => {
        const planPath = `/subscription-plans/${plan._id}`;

        if (!isAuthenticated) {
            navigate('/login', { state: { from: planPath } });
            return;
        }

        if (!plan.price || plan.price <= 0) {
            navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
            return;
        }

        navigate(planPath);
    };

    const handleViewDetails = (plan: SubscriptionPlanPublic) => {
        navigate(`/subscription-plans/${plan._id}`);
    };

    if (sortedPlans.length === 0) return null;

    return (
        <Box
            sx={{
                borderRadius: 4,
                border: '1px solid #e2e8f0',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 42%, #f0f9ff 100%)',
                p: { xs: 2.5, sm: 3, md: 4 },
                boxShadow: '0 8px 32px rgba(15,23,42,0.06)',
            }}
        >
            <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 }, maxWidth: 720, mx: 'auto' }}>
                <Typography
                    component="h2"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                        fontWeight: 800,
                        color: '#0f172a',
                        mb: 1,
                    }}
                >
                    Course Value Breakdown
                </Typography>
                <Typography sx={{ color: '#64748b', lineHeight: 1.7, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                    Compare every learning tier, see what you unlock, and enroll in one click. Free tiers start when you
                    sign in; paid plans open secure checkout on the next step.
                </Typography>
            </Box>

            {subsLoading && isAuthenticated ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                </Box>
            ) : (
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                    {sortedPlans.map((plan) => (
                        <Grid key={plan._id} size={{ xs: 12, sm: 6, lg: 4 }}>
                            <PlanCard
                                plan={plan}
                                isAuthenticated={isAuthenticated}
                                isOwned={userOwnsPlan(subscriptions, plan._id)}
                                onEnroll={handlePlanEnroll}
                                onViewDetails={handleViewDetails}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {!isAuthenticated && (
                <Box
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: alpha('#2563eb', 0.06),
                        border: `1px solid ${alpha('#2563eb', 0.15)}`,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                        New to Verble?{' '}
                        <Button
                            variant="text"
                            onClick={() => navigate('/register')}
                            sx={{ fontWeight: 700, textTransform: 'none', p: 0, minWidth: 0, verticalAlign: 'baseline' }}
                        >
                            Create a free account
                        </Button>{' '}
                        or sign in to enroll and track your progress.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default CourseValueBreakdownSection;
