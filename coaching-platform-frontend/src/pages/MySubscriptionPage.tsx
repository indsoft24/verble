import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Box,
    Button,
    Chip,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import { getMySubscriptionDetailsUser, type UserSubscriptionInstance, type SubscriptionPlanPublic } from '../services/subscriptionService';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';

const MySubscriptionPage: React.FC = () => {
    const [activeSubscriptions, setActiveSubscriptions] = useState<UserSubscriptionInstance[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscriptionData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const subDetails = await getMySubscriptionDetailsUser();
            setActiveSubscriptions(subDetails || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load your subscription details.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscriptionData();
    }, [fetchSubscriptionData]);

    const formatDate = (dateString?: string | Date): string => {
        if (!dateString) return 'N/A';
        try {
            // Format date for Indian locale for better readability
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    if (isLoading) {
        return (
            <UserLayout title="My Subscription">
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', mt: 5 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading your subscriptions...</Typography>
                </Container>
            </UserLayout>
        );
    }

    if (error) {
        return (
            <UserLayout title="My Subscription">
                <Container sx={{ mt: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    <Button variant="outlined" onClick={fetchSubscriptionData}>Try Again</Button>
                </Container>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="My Subscription">
            <Container maxWidth="md">
                <Typography
                    variant="h5"
                    component="h1"
                    gutterBottom
                    sx={{ mb: 3, fontWeight: 600, color: learnerBrandTheme.textPrimary }}
                >
                    My Active Subscriptions
                </Typography>
            {activeSubscriptions.length === 0 ? (
                <Paper
                    elevation={1}
                    sx={{ p: 4, textAlign: 'center', border: `1px solid ${learnerBrandTheme.border}` }}
                >
                    <Typography variant="h6" gutterBottom>
                        You have no active subscriptions.
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/subscription-plans"
                        variant="contained"
                        sx={{ mt: 2, bgcolor: learnerBrandTheme.accent, '&:hover': { bgcolor: learnerBrandTheme.accentStrong } }}
                    >
                        View Available Plans
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {activeSubscriptions.map((sub) => {
                        const planDetails = typeof sub.planId === 'object' ? sub.planId as SubscriptionPlanPublic : null;

                        return (
                            <Grid sx={{width: {xs: '100%'}}} key={sub._id}>
                                <Card elevation={1} sx={{ border: `1px solid ${learnerBrandTheme.border}` }}>
                                    <CardContent sx={{ position: 'relative' }}>
                                        <Chip
                                            label={sub.status?.toUpperCase() || 'N/A'}
                                            color={sub.status === 'active' ? 'success' : 'default'}
                                            size="small"
                                            sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 'medium' }}
                                        />
                                        <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'primary.main', pr: '80px' }}>
                                            {sub.planName || (planDetails?.name)}
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mt: 2 }}>
                                            <Grid sx={{width: {xs: '100%', sm: '50%'}}}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <EventAvailableIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                                                    <ListItemText primary="Start Date" secondary={formatDate(sub.startDate)} />
                                                </Box>
                                            </Grid>
                                            <Grid sx={{width: {xs: '100%', sm: '50%'}}}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <EventBusyIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                                                    <ListItemText primary="End Date" secondary={formatDate(sub.endDate)} />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                        {planDetails && planDetails.features && planDetails.features.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>Features Included:</Typography>
                                                <List dense disablePadding>
                                                    {planDetails.features.map((feature, fIndex) => (
                                                        <ListItem key={fIndex} disablePadding sx={{ pb: 0.25 }}>
                                                            <ListItemIcon sx={{ minWidth: '28px' }}>
                                                                <CheckCircleOutlineIcon fontSize="small" color="primary" />
                                                            </ListItemIcon>
                                                            <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2' }} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
            </Container>
        </UserLayout>
    );
};

export default MySubscriptionPage;

