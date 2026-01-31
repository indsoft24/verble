import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container, Typography, CircularProgress, Alert, Box, Paper, Button,
    Breadcrumbs, Link as MuiLink, Accordion, AccordionSummary, AccordionDetails,
    Divider, List, ListItem, ListItemIcon, ListItemText, Chip, Card, CardContent
} from '@mui/material';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import parse from 'html-react-parser';

import { getPublishedCourseWithModulesForUser, type CourseListItemUser, type ModuleListItemUser } from '../services/courseUserService';
import { 
    getSubscriptionPlansForCourse, 
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMySubscriptionDetailsUser,
    type SubscriptionPlanPublic,
    type UserSubscriptionInstance
} from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';

const CourseDetailPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, refreshUser } = useAuth();

    // --- State Management ---
    const [course, setCourse] = useState<CourseListItemUser | null>(null);
    const [modules, setModules] = useState<ModuleListItemUser[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);
    const [currentUserSubscriptions, setCurrentUserSubscriptions] = useState<UserSubscriptionInstance[]>([]);
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);

    // --- Data Fetching ---
    const fetchPageData = useCallback(async () => {
        if (!courseId) {
            setError("Course ID not found in URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [courseData, plansData, userSubs] = await Promise.all([
                getPublishedCourseWithModulesForUser(courseId),
                getSubscriptionPlansForCourse(courseId),
                isAuthenticated ? getMySubscriptionDetailsUser() : Promise.resolve([])
            ]);

            setCourse(courseData.course);
            setModules(courseData.modules || []);
            setPlans(plansData || []);
            setCurrentUserSubscriptions(userSubs || []);

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load course details.');
        } finally {
            setIsLoading(false);
        }
    }, [courseId, isAuthenticated]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    // --- Event Handlers ---

    const handleModuleClick = (moduleId: string) => {
        navigate(`/modules/${moduleId}/videos`); 
    };

    const handleSubscribe = async (planId: string, planName: string) => {
        if (!user) {
            setSubscribeError("You must be logged in to subscribe.");
            return;
        }
        setSubscribeLoading(planId);
        setSubscribeError(null);
        setSubscribeSuccess(null);

        try {
            const { order } = await createRazorpayOrder(planId);
            
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Tutor Uncle',
                description: `Payment for ${planName}`,
                order_id: order.id,
                handler: async function (response: any) {
                    const dataToVerify = {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        planId,
                    };

                    try {
                        const verificationResponse = await verifyRazorpayPayment(dataToVerify);
                        setSubscribeSuccess(verificationResponse.message);
                        if (refreshUser) await refreshUser();
                        await fetchPageData(); // Re-fetch all data to update UI
                    } catch (err: any) {
                        setSubscribeError(err.message || 'Payment verification failed. Please contact support.');
                    }
                },
                prefill: { name: user.name, email: user.email, contact: user.phoneNumber || '' },
                theme: { color: '#3399cc' },
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                setSubscribeError(`Payment Failed: ${response.error.description}`);
            });
            rzp1.open();

        } catch (err: any) {
            setSubscribeError(err.response?.data?.message || err.message || 'Failed to initiate payment.');
        } finally {
            setSubscribeLoading(null);
        }
    };

    const formatPrice = (price: number, currency: string) => {
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
            }).format(price / 100);
        } catch (e) {
            return `${price / 100} ${currency}`;
        }
    };

    // --- Render Logic ---

    if (isLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /><Typography sx={{ml:1}}>Loading Course Details...</Typography></Container>;
    }

    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error" action={<Button onClick={fetchPageData}>Retry</Button>}>{error}</Alert></Container>;
    }

    if (!course) {
        return <Container sx={{ mt: 4 }}><Alert severity="info">Course not found or not available.</Alert></Container>;
    }

    return (
        <Box sx={{ backgroundColor: '#f8f9fa', minHeight: '100vh', pb: 4 }}>
            <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">Home</MuiLink>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to={`/exams/${typeof course.examCategory === 'object' ? course.examCategory.slug : ''}`}>
                        {typeof course.examCategory === 'object' ? course.examCategory.name : 'Category'}
                    </MuiLink>
                    <Typography color="text.primary" sx={{ fontWeight: 500 }}>{course.title}</Typography>
                </Breadcrumbs>

                {/* Hero Section */}
                <Card 
                    elevation={0}
                    sx={{ 
                        mb: 4,
                        borderRadius: 3,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
                        border: '1px solid rgba(25, 118, 210, 0.1)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                    }}
                >
                    <Box sx={{ position: 'relative', width: '100%', height: { xs: '250px', sm: '350px', md: '400px' }, overflow: 'hidden' }}>
                        <img 
                            src={course.image ? getImageUrl(course.image, 'course') : getSplashImageUrl()} 
                            alt={course.title}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = getSplashImageUrl();
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                                p: 3,
                                color: 'white'
                            }}
                        >
                            <Typography 
                                variant="h3" 
                                component="h1" 
                                sx={{ 
                                    fontWeight: 700,
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                                    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                                }}
                            >
                                {course.title}
                            </Typography>
                            {typeof course.examCategory === 'object' && course.examCategory && (
                                <Chip 
                                    icon={<SchoolIcon />}
                                    label={course.examCategory.name}
                                    sx={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        fontWeight: 600,
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                    
                    <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                        <Box
                            className="tiptap-rendered-content"
                            sx={{
                                '& p': { typography: 'body1', lineHeight: 1.8, mb: 2, color: 'text.secondary', fontSize: '1.05rem' },
                                '& ul, & ol': { pl: 3, mb: 2 },
                                '& li': { mb: 0.5, typography: 'body1', lineHeight: 1.8 },
                                '& strong': { fontWeight: 'bold', color: 'text.primary' },
                                '& em': { fontStyle: 'italic' },
                                '& u': { textDecoration: 'underline' },
                                '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                                '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 1.5, fontWeight: 'bold', color: 'text.primary' },
                            }}
                        >
                            {course.description ? parse(course.description) : <Typography variant="body1" color="text.secondary">No description available for this course.</Typography>}
                        </Box>
                    </CardContent>
                </Card>

            {/* Subscription Plans Section - Always Visible */}
            <Box sx={{ mb: 5 }}>
                <Typography 
                    variant="h4" 
                    component="h2" 
                    gutterBottom 
                    sx={{ 
                        mt: 4, 
                        mb: 3,
                        fontWeight: 700,
                        color: 'text.primary',
                        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <StarIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                    Subscription Plans
                </Typography>
                {subscribeSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{subscribeSuccess}</Alert>}
                {subscribeError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{subscribeError}</Alert>}
                {plans.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-start' }}>
                        {plans.map((plan) => {
                             const isCurrentUserPlanActive = currentUserSubscriptions.some(sub =>
                                sub.status === 'active' &&
                                (typeof sub.planId === 'string' ? sub.planId : (sub.planId as SubscriptionPlanPublic)?._id) === plan._id
                             );
                            return (
                                <Box key={plan._id} sx={{ display: 'flex', width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                                    <Card 
                                        elevation={isCurrentUserPlanActive ? 8 : 4}
                                        sx={{ 
                                            p: 3, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            height: '100%',
                                            width: '100%',
                                            borderRadius: 3,
                                            position: 'relative',
                                            background: isCurrentUserPlanActive 
                                                ? 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)'
                                                : 'linear-gradient(135deg, #d5f4f8 0%, #e0f8ff 100%)',
                                            border: isCurrentUserPlanActive ? `2px solid` : `1px solid rgba(25, 118, 210, 0.12)`,
                                            borderColor: isCurrentUserPlanActive ? 'success.main' : 'rgba(25, 118, 210, 0.12)',
                                            boxShadow: isCurrentUserPlanActive 
                                                ? '0 8px 24px rgba(76, 175, 80, 0.2)'
                                                : '0 4px 16px rgba(25, 118, 210, 0.1)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: isCurrentUserPlanActive 
                                                    ? '0 12px 32px rgba(76, 175, 80, 0.25)'
                                                    : '0 8px 24px rgba(25, 118, 210, 0.15)'
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
                                                    top: 16, 
                                                    right: 16,
                                                    fontWeight: 600,
                                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                                }} 
                                            />
                                        )}
                                        <Box sx={{ mb: 2, textAlign: 'center', borderRadius: 2, overflow: 'hidden' }}>
                                            <img 
                                                src={plan.image ? getImageUrl(plan.image, 'subscription') : getSplashImageUrl()} 
                                                alt={plan.name}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = getSplashImageUrl();
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '180px',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                        </Box>
                                        <Typography 
                                            variant="h5" 
                                            component="h3" 
                                            gutterBottom 
                                            sx={{ 
                                                color: 'primary.main', 
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                                mb: 2
                                            }}
                                        >
                                            {plan.name}
                                        </Typography>
                                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                                            <Typography 
                                                variant="h4" 
                                                component="p" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    color: 'text.primary',
                                                    fontSize: { xs: '1.75rem', sm: '2rem' }
                                                }}
                                            >
                                                {formatPrice(plan.price, plan.currency)}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                                            >
                                                <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                                                {plan.duration.value} {plan.duration.unit}(s)
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 2, borderColor: 'rgba(0, 0, 0, 0.1)' }} />
                                        <Box sx={{ flexGrow: 1, mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                                                What's Included:
                                            </Typography>
                                            <List dense sx={{ py: 0 }}>
                                                {(plan.features && plan.features.length > 0 ? plan.features : ['Full course access']).map((feature, index) => (
                                                    <ListItem 
                                                        key={index} 
                                                        disablePadding
                                                        sx={{ mb: 1 }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: '32px' }}>
                                                            <CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary={feature}
                                                            primaryTypographyProps={{
                                                                variant: 'body2',
                                                                sx: { color: 'text.secondary', lineHeight: 1.6 }
                                                            }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                        <Button 
                                            fullWidth 
                                            variant={isCurrentUserPlanActive ? "outlined" : "contained"} 
                                            color="primary" 
                                            size="large" 
                                            onClick={() => handleSubscribe(plan._id, plan.name)} 
                                            disabled={subscribeLoading === plan._id || isCurrentUserPlanActive} 
                                            sx={{ 
                                                mt: 'auto',
                                                py: 1.5,
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                boxShadow: isCurrentUserPlanActive ? 'none' : '0 4px 12px rgba(25, 118, 210, 0.3)',
                                                '&:hover': {
                                                    boxShadow: isCurrentUserPlanActive ? 'none' : '0 6px 16px rgba(25, 118, 210, 0.4)'
                                                }
                                            }}
                                        >
                                            {isCurrentUserPlanActive ? 'Currently Active' : subscribeLoading === plan._id ? <CircularProgress size={24} /> : 'Choose Plan'}
                                        </Button>
                                    </Card>
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="body1" color="text.secondary">
                            No subscription plans are available for this course yet.
                        </Typography>
                    </Paper>
                )}
            </Box>

            {/* --- UPDATED: Conditional Modules Section --- */}
            {isAuthenticated ? (
                <Box>
                    <Typography 
                        variant="h4" 
                        component="h2" 
                        gutterBottom 
                        sx={{
                            mt: 5, 
                            mb: 3,
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <PlayCircleOutlineIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                        Course Modules
                    </Typography>
                    {modules.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                            <Typography variant="body1" color="text.secondary">
                                No modules available for this course yet.
                            </Typography>
                        </Paper>
                    ) : (
                        <Box>
                            {modules.map((module, index) => (
                                <Accordion 
                                    key={module._id} 
                                    defaultExpanded={index === 0} 
                                    sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        '&:before': { display: 'none' },
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                        border: '1px solid rgba(0, 0, 0, 0.08)',
                                        '&:hover': {
                                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
                                        }
                                    }}
                                >
                                    <AccordionSummary 
                                        expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                                        sx={{
                                            px: 3,
                                            py: 2,
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'primary.light',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'primary.main'
                                                }}
                                            >
                                                <OndemandVideoIcon />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                    {module.title}
                                                </Typography>
                                                {module.videoCount && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {module.videoCount} {module.videoCount === 1 ? 'video' : 'videos'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                                        <Box
                                            className="tiptap-rendered-content"
                                            sx={{
                                                mb: 2,
                                                '& p': { typography: 'body2', lineHeight: 1.7, mb: 1.5, color: 'text.secondary' },
                                                '& ul, & ol': { pl: 3, mb: 1.5 },
                                                '& li': { mb: 0.5, typography: 'body2', lineHeight: 1.7 },
                                                '& strong': { fontWeight: 'bold', color: 'text.primary' },
                                                '& em': { fontStyle: 'italic' },
                                                '& u': { textDecoration: 'underline' },
                                                '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                                            }}
                                        >
                                            {module.description ? parse(module.description) : <Typography variant="body2" color="text.secondary">No description for this module.</Typography>}
                                        </Box>
                                        <Button 
                                            variant="contained" 
                                            size="medium" 
                                            onClick={() => handleModuleClick(module._id)}
                                            startIcon={<PlayCircleOutlineIcon />}
                                            sx={{
                                                borderRadius: 2,
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                px: 3,
                                                py: 1
                                            }}
                                        >
                                            View Videos
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    )}
                </Box>
            ) : (
                <Card 
                    sx={{ 
                        mt: 5, 
                        p: 4, 
                        textAlign: 'center', 
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%)',
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.1)'
                    }}
                >
                    <SchoolIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.8 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                        Unlock Course Content
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, fontSize: '1.05rem' }}>
                        Log in to access detailed video lectures, study materials, and course modules.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        component={RouterLink}
                        to={`/login?redirect=/courses/${courseId}`}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            fontSize: '1rem',
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                            '&:hover': {
                                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
                            }
                        }}
                    >
                        Login to Continue
                    </Button>
                </Card>
            )}
        </Container>
        </Box>
    );
};

export default CourseDetailPage;
