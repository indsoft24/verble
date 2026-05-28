// src/pages/SubscriptionPlanDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Box, Button, CircularProgress, Alert, Paper,
    Grid, Card, Chip, Divider, List, ListItem, ListItemIcon,
    ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../contexts/AuthContext';
import LazyImage from '../components/common/LazyImage';
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMySubscriptionDetailsUser,
    type UserSubscriptionInstance
} from '../services/subscriptionService';
import apiClient from '../services/apiClient';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';
import UserLayout from '../components/layout/UserLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

interface SubscriptionPlanDetail {
    _id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    duration: {
        value: number;
        unit: string;
    };
    features?: string[];
    image?: string;
    topic?: string;
    subTopic?: string;
    course?: {
        _id: string;
        title: string;
        description?: string;
    };
}

const SubscriptionPlanDetailPage: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { user, refreshUser, isAuthenticated } = useAuth();

    const [plan, setPlan] = useState<SubscriptionPlanDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscribeLoading, setSubscribeLoading] = useState(false);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);
    const [currentUserSubscriptions, setCurrentUserSubscriptions] = useState<UserSubscriptionInstance[]>([]);

    const fetchPlanDetails = useCallback(async () => {
        if (!planId) {
            setError('Plan ID not found');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [planResponse, userSubs] = await Promise.all([
                apiClient.get(`/subscription-plans/${planId}`),
                isAuthenticated ? getMySubscriptionDetailsUser() : Promise.resolve([])
            ]);

            if (planResponse.data?.status === 'success' && planResponse.data.data?.plan) {
                setPlan(planResponse.data.data.plan);
            } else {
                throw new Error('Failed to fetch plan details');
            }

            setCurrentUserSubscriptions(userSubs || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load plan details.');
        } finally {
            setIsLoading(false);
        }
    }, [planId, isAuthenticated]);

    useEffect(() => {
        fetchPlanDetails();
    }, [fetchPlanDetails]);

    const handleSubscribe = async () => {
        if (!user || !plan) {
            setSubscribeError("You must be logged in to subscribe.");
            return;
        }

        if (!plan.price || plan.price <= 0) {
            setSubscribeError('This plan is free and is included when you register. Open your dashboard to start learning.');
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
                order_id: order.id,
                handler: async function (response: any) {
                    const dataToVerify = {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        planId: plan._id,
                    };

                    try {
                        const verificationResponse = await verifyRazorpayPayment(dataToVerify);
                        setSubscribeSuccess(verificationResponse.message);
                        if (refreshUser) await refreshUser();
                        await fetchPlanDetails();
                    } catch (err: any) {
                        setSubscribeError(err.message || 'Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phoneNumber || '',
                },
                notes: {
                    plan_id: plan._id,
                    user_id: user._id,
                },
                theme: {
                    color: '#DC143C',
                },
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                setSubscribeError(`Payment Failed: ${response.error.description}`);
            });

            rzp.open();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setSubscribeError(e.message || 'Failed to initiate payment.');
        } finally {
            setSubscribeLoading(false);
        }
    };

    const formatPrice = (price: number | undefined, currency: string | undefined) => {
        if (price == null || Number.isNaN(price) || !currency) return 'N/A';
        return (price / 100).toLocaleString('en-IN', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
        });
    };


    const getImageForPlan = (plan: SubscriptionPlanDetail): string => {
        if (plan.image) {
            const fileName = plan.image.split('/').pop();
            return `${API_BASE_URL}/api/images/subscription-plans/${fileName}`;
        }
        // Use splash image as fallback
        return getImageUrl(undefined, 'subscription');
    };

    const isCurrentUserPlanActive = currentUserSubscriptions.some(sub =>
        sub.status === 'active' && (sub.planId as any)?._id === plan?._id
    );

    if (isLoading) {
        return (
            <UserLayout title="Plan Details">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                    <CircularProgress />
                </Box>
            </UserLayout>
        );
    }

    if (error && !plan) {
        return (
            <UserLayout title="Plan Details">
                <Container maxWidth="lg">
                    <Alert severity="error">{error}</Alert>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/subscription-plans')}
                        sx={{ mt: 2 }}
                    >
                        Back to Plans
                    </Button>
                </Container>
            </UserLayout>
        );
    }

    if (!plan) {
        return (
            <UserLayout title="Plan Details">
                <Container maxWidth="lg">
                    <Alert severity="warning">Plan not found.</Alert>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/subscription-plans')}
                        sx={{ mt: 2 }}
                    >
                        Back to Plans
                    </Button>
                </Container>
            </UserLayout>
        );
    }

    return (
        <UserLayout title={plan.name}>
        <Container maxWidth="lg">
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/subscription-plans')}
                sx={{ mb: 3 }}
            >
                Back to Plans
            </Button>

            {subscribeSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>{subscribeSuccess}</Alert>
            )}
            {subscribeError && (
                <Alert severity="error" sx={{ mb: 3 }}>{subscribeError}</Alert>
            )}

            <Grid container spacing={4}>
                {/* Left Column - Image and Basic Info */}
                <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Card elevation={4} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ position: 'relative', height: 400 }}>
                            <LazyImage
                                src={getImageForPlan(plan)}
                                alt={plan.name}
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    (e.target as HTMLImageElement).src = getSplashImageUrl();
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    left: 16,
                                    display: 'flex',
                                    gap: 1,
                                    flexWrap: 'wrap'
                                }}
                            >
                                {['PRELIMS', 'MAINS', 'INTERVIEW'].map((stage) => (
                                    <Chip
                                        key={stage}
                                        label={stage}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.65rem'
                                        }}
                                    />
                                ))}
                            </Box>
                            <Chip
                                label={`${plan.duration.value} ${plan.duration.unit}`}
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    backgroundColor: 'secondary.main',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Box>
                    </Card>
                </Grid>

                {/* Right Column - Details */}
                <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {plan.name}
                        </Typography>

                        {plan.course && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Course
                                </Typography>
                                <Button
                                    component={RouterLink}
                                    to={`/courses/${plan.course._id}`}
                                    size="small"
                                    variant="outlined"
                                >
                                    {plan.course.title}
                                </Button>
                            </Box>
                        )}

                        <Box sx={{ mb: 3 }}>
                        <Typography variant="h3" component="p" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 0.5 }}>
                            {formatPrice(plan.price, plan.currency)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Price
                        </Typography>
                        </Box>

                        {plan.description && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Description
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {plan.description}
                                </Typography>
                            </Box>
                        )}

                        {plan.features && plan.features.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Features
                                </Typography>
                                <List>
                                    {plan.features.map((feature, index) => (
                                        <ListItem key={index} disablePadding>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <CheckCircleOutlineIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText primary={feature} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        <Divider sx={{ my: 3 }} />

                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<ShoppingCartIcon />}
                            onClick={handleSubscribe}
                            disabled={
                                subscribeLoading ||
                                isCurrentUserPlanActive ||
                                !plan.price ||
                                plan.price <= 0
                            }
                            sx={{ py: 1.5, fontWeight: 'bold' }}
                        >
                            {!plan.price || plan.price <= 0
                                ? 'Free with registration'
                                : isCurrentUserPlanActive
                                  ? 'Your Current Plan'
                                  : subscribeLoading
                                    ? <CircularProgress size={24} color="inherit" />
                                    : 'Subscribe Now'}
                        </Button>

                        {!isAuthenticated && (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                                <Button
                                    component={RouterLink}
                                    to={`/login?redirectTo=/subscription-plans/${planId}`}
                                    size="small"
                                >
                                    Login
                                </Button>
                                {' '}to subscribe
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
        </UserLayout>
    );
};

export default SubscriptionPlanDetailPage;

