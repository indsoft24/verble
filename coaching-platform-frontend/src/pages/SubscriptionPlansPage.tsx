import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Button,
    CircularProgress, Alert, Box, Chip, Card, CardContent
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StarIcon from '@mui/icons-material/Star';
import ExploreIcon from '@mui/icons-material/Explore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMySubscriptionDetailsUser,
    type UserSubscriptionInstance
} from '../services/subscriptionService';
import {
    getActiveSubscriptionPlans,
    type SubscriptionPlanPublic,
} from '../services/subscriptionPlanService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';
import UserLayout from '../components/layout/UserLayout';

const SubscriptionPlansPage: React.FC = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);
    const [currentUserSubscriptions, setCurrentUserSubscriptions] = useState<UserSubscriptionInstance[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);
    
    const { user, refreshUser } = useAuth();

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
        } catch (err: any) {
            setError(err.message || 'Failed to load page data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubscribe = async (plan: SubscriptionPlanPublic) => {
        if (!user) {
            setSubscribeError("You must be logged in to subscribe.");
            return;
        }
        setSubscribeLoading(plan._id);
        setSubscribeError(null);
        setSubscribeSuccess(null);
        try {
            // STEP 1: Create an order on your backend
            const { order } = await createRazorpayOrder(plan._id);

            // STEP 2: Configure and open the Razorpay Checkout modal
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Public Key ID from .env
                amount: order.amount, // Amount in the smallest currency unit (e.g., paise)
                currency: order.currency,
                name: 'Verble',
                description: `Payment for ${plan.name}`,
                image: 'https://placehold.co/100x100/023e8a/ffffff?text=FI', // Your Logo URL
                order_id: order.id,
                handler: async function (response: any) {
                    const dataToVerify = {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        planId: plan._id,
                    };

                    try {
                        // STEP 3: Verify the payment on your backend
                        const verificationResponse = await verifyRazorpayPayment(dataToVerify);
                        setSubscribeSuccess(verificationResponse.message);
                        if (refreshUser) await refreshUser(); // Refresh user context to update subscription status
                        await fetchData(); // Refresh the page data to show the new active plan
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
                    color: '#023E8A', // Your brand color
                },
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                setSubscribeError(`Payment Failed: ${response.error.description}`);
            });

            rzp.open();

        } catch (err: any) {
            setSubscribeError(err.response?.data?.message || err.message || 'Failed to initiate payment.');
        } finally {
            setSubscribeLoading(null);
        }
    };

    const formatPrice = (price: number, currency: string) => {
        // The price from your backend is in the smallest currency unit (paise for INR).
        // We divide by 100 to get the main unit (Rupees).
        return (price / 100).toLocaleString('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        });
    };

    if (isLoading) {
        return (
            <UserLayout title="Subscription Plans">
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Subscription Plans">
        <Box sx={{ py: { xs: 1, sm: 2 } }}>
            <Container maxWidth="lg" disableGutters sx={{ px: { xs: 0, sm: 2 } }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, color: 'text.primary' }}>
                    Choose Your Plan
                </Typography>

            {error && !isLoading && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {subscribeSuccess && <Alert severity="success" sx={{ mb: 3 }}>{subscribeSuccess}</Alert>}
            {subscribeError && <Alert severity="error" sx={{ mb: 3 }}>{subscribeError}</Alert>}

            {!isLoading && plans.length > 0 && (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                    {plans.length} plan{plans.length !== 1 ? 's' : ''} available — pick the English learning tier that fits you.
                </Typography>
            )}

            {plans.length === 0 && !isLoading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No subscription plans available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Please check back later or contact support.
                    </Typography>
                </Box>
            )}

            {plans.length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: { xs: 'center', sm: 'flex-start', md: 'flex-start' },
                        gap: { xs: 2, sm: 3, md: '15px' },
                        width: '100%',
                        marginLeft: { xs: 0, sm: 0, md: '0px' },
                        marginRight: { xs: 0, sm: 0, md: '0px' },
                        paddingLeft: { xs: 0, sm: 0, md: '0px' },
                        paddingRight: { xs: 0, sm: 0, md: '0px' }
                    }}
                >
                    {plans.map((plan) => {
                    const isCurrentUserPlanActive = currentUserSubscriptions.some(sub =>
                        sub.status === 'active' && (sub.planId as SubscriptionPlanPublic)?._id === plan._id
                    );

                    const planImage = (plan as any).image 
                        ? getImageUrl((plan as any).image, 'subscription') 
                        : getSplashImageUrl();

                    return (
                        <Card
                            key={plan._id}
                            elevation={isCurrentUserPlanActive ? 8 : 4}
                            sx={{
                                width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 10px)' },
                                maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: '400px' },
                                minWidth: { xs: '100%', sm: '280px', md: '320px' },
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                background: isCurrentUserPlanActive 
                                    ? 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)'
                                    : 'linear-gradient(135deg, #d5f4f8 0%, #e0f8ff 100%)',
                                border: isCurrentUserPlanActive ? '2px solid' : '1px solid rgba(25, 118, 210, 0.12)',
                                borderColor: isCurrentUserPlanActive ? 'success.main' : 'rgba(25, 118, 210, 0.12)',
                                boxShadow: isCurrentUserPlanActive 
                                    ? '0 8px 24px rgba(76, 175, 80, 0.2)'
                                    : '0 2px 8px rgba(25, 118, 210, 0.1)',
                                position: 'relative',
                                '&:hover': { 
                                    transform: 'translateY(-8px)', 
                                    boxShadow: isCurrentUserPlanActive 
                                        ? '0 12px 32px rgba(76, 175, 80, 0.25)'
                                        : '0 8px 24px rgba(25, 118, 210, 0.15)',
                                    borderColor: isCurrentUserPlanActive ? 'success.main' : 'rgba(25, 118, 210, 0.2)',
                                    background: isCurrentUserPlanActive 
                                        ? 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)'
                                        : 'linear-gradient(135deg, #e3f2fd 0%, #e8f4f8 100%)'
                                }
                            }}
                        >
                            {isCurrentUserPlanActive && (
                                <Chip 
                                    icon={<StarIcon />} 
                                    label="Active Plan" 
                                    color="success" 
                                    size="small" 
                                    sx={{ 
                                        position: 'absolute', 
                                        top: 12, 
                                        right: 12, 
                                        zIndex: 1,
                                        fontWeight: 600,
                                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                    }} 
                                />
                            )}
                            
                            {/* Image Section */}
                            <Box sx={{ position: 'relative', height: 200, width: '100%', overflow: 'hidden', flexShrink: 0 }}>
                                <img
                                    src={planImage}
                                    alt={plan.name}
                                    loading="eager"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        (e.target as HTMLImageElement).src = getSplashImageUrl();
                                    }}
                                    onLoad={(e) => {
                                        (e.target as HTMLImageElement).style.opacity = '1';
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease-in-out',
                                        backgroundColor: '#f5f5f5'
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        zIndex: 1
                                    }}
                                >
                                    {plan.duration.value} {plan.duration.unit}
                                </Box>
                            </Box>
                            
                            {/* Card Content */}
                            <CardContent sx={{ 
                                flexGrow: 1, 
                                display: 'flex', 
                                flexDirection: 'column',
                                width: '100%',
                                minHeight: 0,
                                backgroundColor: 'transparent',
                                '&:last-child': { pb: 2 }
                            }}>
                                <Typography 
                                    variant="h6" 
                                    component="h3" 
                                    gutterBottom
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        mb: 1,
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                        lineHeight: 1.3,
                                        minHeight: '2.6em',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {plan.name}
                                </Typography>
                                
                                <Typography 
                                    variant="h5" 
                                    component="p" 
                                    sx={{ 
                                        color: 'primary.main', 
                                        fontWeight: 'bold',
                                        mb: 2,
                                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                        flexShrink: 0
                                    }}
                                >
                                    {formatPrice(plan.price, plan.currency)}
                                </Typography>
                                
                                {plan.features && plan.features.length > 0 && (
                                    <Box sx={{ mb: 2, flexGrow: 1, minHeight: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                                            Key Features:
                                        </Typography>
                                        {plan.features.slice(0, 3).map((feature, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                                                <CheckCircleOutlineIcon 
                                                    sx={{ fontSize: 16, color: 'primary.main', mr: 1, mt: 0.25, flexShrink: 0 }} 
                                                />
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        lineHeight: 1.4,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {feature}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                
                                <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexShrink: 0 }}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={<ExploreIcon />}
                                        onClick={() => navigate(`/subscription-plans/${plan._id}`)}
                                        sx={{ flex: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                    >
                                        Explore
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<ShoppingCartIcon />}
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={subscribeLoading === plan._id || isCurrentUserPlanActive}
                                        sx={{ flex: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                    >
                                        {isCurrentUserPlanActive ? 'Active' : subscribeLoading === plan._id ? <CircularProgress size={20} /> : 'Subscribe'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                    })}
                </Box>
            )}
            </Container>
        </Box>
        </UserLayout>
    );
};

export default SubscriptionPlansPage;

