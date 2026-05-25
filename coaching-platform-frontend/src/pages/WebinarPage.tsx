// src/pages/WebinarPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '../contexts/AuthContext';
import { getActiveOffers } from '../services/offerService';

interface WebinarData {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    duration: string;
    instructor: string;
    topics: string[];
    benefits: string[];
    registrationRequired: boolean;
    isLive: boolean;
    recordingAvailable: boolean;
    maxParticipants?: number;
    currentParticipants?: number;
    linkUrl?: string;
}

const slugify = (text: string) =>
    String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

const WebinarPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [webinar, setWebinar] = useState<WebinarData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        const loadWebinar = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const offers = await getActiveOffers();
                const webinarOffers = offers.filter((o) => o.type === 'WEBINAR');

                const selected = webinarOffers.find((offer) => {
                    const linkSlug = offer.linkUrl?.split('/').filter(Boolean).pop();
                    return (slug && (linkSlug === slug || slugify(offer.title) === slug));
                }) || webinarOffers[0];

                if (!selected) {
                    setError('No active webinar found');
                    setIsLoading(false);
                    return;
                }

                const startDate = new Date(selected.startDate);
                const endDate = new Date(selected.endDate);
                const durationMs = Math.max(0, endDate.getTime() - startDate.getTime());
                const durationMinutes = Math.round(durationMs / (1000 * 60));

                setWebinar({
                    id: selected._id,
                    title: selected.title,
                    description: selected.description || 'Webinar details will be shared after registration.',
                    date: selected.startDate,
                    time: startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    duration: `${durationMinutes || 60} minutes`,
                    instructor: 'Verble Team',
                    topics: ['Live training session', 'Q&A', 'Practical English learning'],
                    benefits: ['Live webinar access', 'Structured guidance', 'Progress support'],
                    registrationRequired: true,
                    isLive: false,
                    recordingAvailable: false,
                    linkUrl: selected.linkUrl,
                });
            } catch (e: any) {
                setError(e?.message || 'Failed to load webinar');
            } finally {
                setIsLoading(false);
            }
        };
        loadWebinar();
    }, [slug]);

    const handleRegister = () => {
        if (!isAuthenticated) {
            navigate('/register?redirect=/webinar/' + slug);
            return;
        }
        if (webinar?.linkUrl) {
            window.open(webinar.linkUrl, '_blank', 'noopener,noreferrer');
            setIsRegistered(true);
            return;
        }
        setIsRegistered(true);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !webinar) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'Webinar not found'}
                </Alert>
                <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
                    Go to Home
                </Button>
            </Container>
        );
    }

    const isUpcoming = new Date(webinar.date) > new Date();
    const spotsRemaining = webinar.maxParticipants
        ? webinar.maxParticipants - (webinar.currentParticipants || 0)
        : null;

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 3 }}>
                    <MuiLink component={RouterLink} to="/" color="inherit">
                        Home
                    </MuiLink>
                    <MuiLink component={RouterLink} to="/" color="inherit">
                        Webinars
                    </MuiLink>
                    <Typography color="text.primary">{webinar.title}</Typography>
                </Breadcrumbs>

                <Grid container spacing={4}>
                    {/* Main Content */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* Header */}
                        <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: '16px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <VideoCallIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Chip
                                    label={isUpcoming ? 'Upcoming' : 'Past Event'}
                                    color={isUpcoming ? 'primary' : 'default'}
                                    sx={{ fontWeight: 'bold' }}
                                />
                                {webinar.recordingAvailable && !isUpcoming && (
                                    <Chip label="Recording Available" color="success" />
                                )}
                            </Box>

                            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                {webinar.title}
                            </Typography>

                            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'text.secondary', mb: 3 }}>
                                {webinar.description}
                            </Typography>

                            {/* Event Details */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarTodayIcon color="primary" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Date</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                            {new Date(webinar.date).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon color="primary" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Time</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                            {webinar.time}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventIcon color="primary" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                            {webinar.duration}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* Instructor */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Instructor</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {webinar.instructor}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        15+ years MNC professional | EdTech Expert
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Topics Covered */}
                        <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: '16px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SchoolIcon color="primary" />
                                Topics Covered
                            </Typography>
                            <List>
                                {webinar.topics.map((topic, index) => (
                                    <ListItem key={index} sx={{ py: 1 }}>
                                        <ListItemIcon sx={{ minWidth: '40px' }}>
                                            <CheckCircleIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={topic}
                                            primaryTypographyProps={{ variant: 'body1' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>

                        {/* Benefits */}
                        <Paper elevation={2} sx={{ p: 4, borderRadius: '16px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                                What You'll Gain
                            </Typography>
                            <Grid container spacing={2}>
                                {webinar.benefits.map((benefit, index) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                            <CheckCircleIcon color="primary" sx={{ mt: 0.5 }} />
                                            <Typography variant="body1">{benefit}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Sidebar - Registration */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={4}
                            sx={{
                                p: 4,
                                borderRadius: '20px',
                                position: 'sticky',
                                top: 100,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                                {isUpcoming ? 'Register Now' : 'Watch Recording'}
                            </Typography>

                            {isUpcoming && (
                                <>
                                    {spotsRemaining !== null && (
                                        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                                                Spots Remaining
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {spotsRemaining}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                out of {webinar.maxParticipants} participants
                                            </Typography>
                                        </Box>
                                    )}

                                    {isRegistered ? (
                                        <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                            You're registered! Check your email for the meeting link.
                                        </Alert>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            onClick={handleRegister}
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                bgcolor: 'white',
                                                color: 'primary.main',
                                                py: 1.5,
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold',
                                                mb: 3,
                                                '&:hover': {
                                                    bgcolor: 'grey.100',
                                                    transform: 'scale(1.02)'
                                                }
                                            }}
                                        >
                                            {isAuthenticated ? 'Register Free' : 'Sign Up to Register'}
                                        </Button>
                                    )}
                                </>
                            )}

                            {!isUpcoming && webinar.recordingAvailable && (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    component={RouterLink}
                                    to={isAuthenticated ? `/webinar/${slug}/recording` : '/register'}
                                    endIcon={<VideoCallIcon />}
                                    sx={{
                                        bgcolor: 'white',
                                        color: 'primary.main',
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        mb: 3,
                                        '&:hover': {
                                            bgcolor: 'grey.100',
                                            transform: 'scale(1.02)'
                                        }
                                    }}
                                >
                                    Watch Recording
                                </Button>
                            )}

                            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.3)' }} />

                            <Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
                                {webinar.registrationRequired
                                    ? 'Registration is required to attend this webinar'
                                    : 'Open to all participants'}
                            </Typography>
                        </Paper>

                        {/* Additional Info Card */}
                        <Card sx={{ mt: 3, borderRadius: '16px' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    Why Attend?
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                    This webinar is designed specifically for Indian learners who want to break the English barrier.
                                    Learn practical, survival English that works in real-life situations.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default WebinarPage;
