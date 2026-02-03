// src/pages/admin/AdminDashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { getPlatformStatsAdmin, type PlatformStats, getAllUsers, type AdminUserView } from '../services/adminService';
import { getAllDailyContentAdmin } from '../services/dailyContentAdminService';
import type { DailyContent } from '../services/dailyContentService';
import { getActiveOffers, type Offer } from '../services/offerService';
import { getRecentJoiners, type RecentJoiner } from '../services/recentJoinersService';
import AdminLayout from '../components/layout/AdminLayout';

// MUI Imports
import {
    Typography, Paper, Card, CardContent, Box, CircularProgress, Alert,
    Grid, Chip, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
// Icons
import PeopleIcon from '@mui/icons-material/People';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleIcon from '@mui/icons-material/Article';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CampaignIcon from '@mui/icons-material/Campaign';
import TranslateIcon from '@mui/icons-material/Translate';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VideoLibraryIcon2 from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HelpIcon from '@mui/icons-material/Help';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const initialStats: PlatformStats = {
    totalUsers: 0,
    activeUserSubscriptions: 0,
    totalVideos: 0,
    publishedVideos: 0,
    totalCourses: 0,
    publishedCourses: 0,
};

const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();

    const [stats, setStats] = useState<PlatformStats>(initialStats);
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    // Additional data
    const [recentUsers, setRecentUsers] = useState<AdminUserView[]>([]);
    const [todayContent, setTodayContent] = useState<DailyContent[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [recentJoiners, setRecentJoiners] = useState<RecentJoiner[]>([]);
    const [isLoadingAdditional, setIsLoadingAdditional] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoadingStats(true);
        setStatsError(null);
        try {
            const fetchedStats = await getPlatformStatsAdmin();
            setStats(fetchedStats);
        } catch (err: unknown) {
            setStatsError(err instanceof Error ? err.message : "Failed to load dashboard statistics.");
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const fetchAdditionalData = useCallback(async () => {
        setIsLoadingAdditional(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            const [usersData, contentData, offersData, joinersData] = await Promise.all([
                getAllUsers().catch((err) => {
                    console.error('Failed to fetch users:', err);
                    return [];
                }),
                getAllDailyContentAdmin({ date: today }).catch((err) => {
                    console.error('Failed to fetch daily content:', err);
                    return [];
                }),
                getActiveOffers().catch((err) => {
                    console.error('Failed to fetch offers:', err);
                    return [];
                }),
                getRecentJoiners(10).catch((err) => {
                    console.error('Failed to fetch recent joiners:', err);
                    return [];
                }),
            ]);

            // Get recent users (last 10)
            const sortedUsers = Array.isArray(usersData) ? usersData.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }) : [];
            setRecentUsers(sortedUsers.slice(0, 10));

            setTodayContent(Array.isArray(contentData) ? contentData : []);
            setOffers(Array.isArray(offersData) ? offersData : []);
            setRecentJoiners(Array.isArray(joinersData) ? joinersData : []);
        } catch (error) {
            console.error('Failed to load additional data:', error);
            // Set empty arrays on error to prevent undefined issues
            setRecentUsers([]);
            setTodayContent([]);
            setOffers([]);
            setRecentJoiners([]);
        } finally {
            setIsLoadingAdditional(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchAdditionalData();
    }, [fetchStats, fetchAdditionalData]);

    // Calculate daily content stats
    const contentStats = {
        total: todayContent.length,
        byType: {
            WORD: todayContent.filter(c => c.type === 'WORD').length,
            PHRASE: todayContent.filter(c => c.type === 'PHRASE').length,
            STORY: todayContent.filter(c => c.type === 'STORY').length,
            CONVERSATION: todayContent.filter(c => c.type === 'CONVERSATION').length,
            PUZZLE: todayContent.filter(c => c.type === 'PUZZLE').length,
        },
        byLevel: {
            FREE: todayContent.filter(c => c.level === 'FREE').length,
            BRONZE: todayContent.filter(c => c.level === 'BRONZE').length,
            SILVER: todayContent.filter(c => c.level === 'SILVER').length,
            GOLD: todayContent.filter(c => c.level === 'GOLD').length,
        }
    };

    const StatCard = ({
        title,
        value,
        icon,
        color,
        subtitle
    }: {
        title: string;
        value: string | number;
        icon: React.ReactNode;
        color: string;
        subtitle?: string;
    }) => (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                background: color,
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.3)',
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 3,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {icon}
                    </Box>
                    {isLoadingStats ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                        <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            {value}
                        </Typography>
                    )}
                </Box>
                <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 600, mb: 0.5 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 500 }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    const QuickActionCard = ({
        title,
        description,
        to,
        icon
    }: {
        title: string;
        description: string;
        to: string;
        icon: React.ReactNode;
    }) => (
        <Card
            component={RouterLink}
            to={to}
            elevation={0}
            sx={{
                textDecoration: 'none',
                cursor: 'pointer',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    '& .action-icon': {
                        color: 'primary.main',
                        transform: 'scale(1.1)',
                    },
                    '& .arrow-icon': {
                        transform: 'translateX(4px)',
                        color: 'primary.main',
                    }
                }
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box className="action-icon" sx={{
                            color: 'text.secondary',
                            display: 'flex',
                            transition: 'all 0.3s ease',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                        }}>
                            {icon}
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                {title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {description}
                            </Typography>
                        </Box>
                    </Box>
                    <ArrowForwardIcon
                        className="arrow-icon"
                        sx={{ fontSize: 20, transition: 'all 0.3s ease', color: 'text.disabled' }}
                    />
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <AdminLayout title="Dashboard">
            <Box sx={{ pb: 6 }}>
                {/* Modern Header Section */}
                <Box sx={{
                    mb: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1, color: 'text.primary', mb: 0.5 }}>
                            Dashboard
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Welcome back, {user?.name || 'Admin'}! Here's what's happening today.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        component={RouterLink}
                        to="/admin/daily-content"
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                        }}
                    >
                        Create Content
                    </Button>
                </Box>

                {statsError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{statsError}</Alert>}

                {/* Main Statistics Grid */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Total Users"
                            value={stats.totalUsers.toLocaleString()}
                            icon={<PeopleIcon sx={{ fontSize: 24 }} />}
                            color="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Active Subscriptions"
                            value={stats.activeUserSubscriptions.toLocaleString()}
                            icon={<SubscriptionsIcon sx={{ fontSize: 24 }} />}
                            color="linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)"
                            subtitle={`${stats.totalUsers > 0 ? Math.round((stats.activeUserSubscriptions / stats.totalUsers) * 100) : 0}% user conversion`}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Videos Content"
                            value={`${stats.publishedVideos}`}
                            icon={<VideoLibraryIcon sx={{ fontSize: 24 }} />}
                            color="linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)"
                            subtitle={`${stats.totalVideos} total videos uploaded`}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Courses Library"
                            value={stats.publishedCourses}
                            icon={<SchoolIcon sx={{ fontSize: 24 }} />}
                            color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            subtitle={`${stats.totalCourses} total courses defined`}
                        />
                    </Grid>
                </Grid>

                {/* Today's Content Overview */}
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ color: 'primary.main', display: 'flex' }}>
                                <CalendarTodayIcon />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>
                                Today's Daily Content
                            </Typography>
                        </Box>
                        <Button
                            component={RouterLink}
                            to="/admin/daily-content"
                            variant="text"
                            size="small"
                            sx={{ fontWeight: 600 }}
                        >
                            View All Content
                        </Button>
                    </Box>

                    {isLoadingAdditional ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Content by Type
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Chip
                                        icon={<TranslateIcon />}
                                        label={`Word: ${contentStats.byType.WORD}`}
                                        color="success"
                                        size="small"
                                    />
                                    <Chip
                                        icon={<RecordVoiceOverIcon />}
                                        label={`Phrase: ${contentStats.byType.PHRASE}`}
                                        color="info"
                                        size="small"
                                    />
                                    <Chip
                                        icon={<VideoLibraryIcon2 />}
                                        label={`Story: ${contentStats.byType.STORY}`}
                                        color="warning"
                                        size="small"
                                    />
                                    <Chip
                                        icon={<PeopleIcon />}
                                        label={`Conversation: ${contentStats.byType.CONVERSATION}`}
                                        color="secondary"
                                        size="small"
                                    />
                                    <Chip
                                        icon={<QuizIcon />}
                                        label={`Puzzle: ${contentStats.byType.PUZZLE}`}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Content by Level
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Chip label={`FREE: ${contentStats.byLevel.FREE}`} size="small" />
                                    <Chip label={`BRONZE: ${contentStats.byLevel.BRONZE}`} color="warning" size="small" />
                                    <Chip label={`SILVER: ${contentStats.byLevel.SILVER}`} color="info" size="small" />
                                    <Chip label={`GOLD: ${contentStats.byLevel.GOLD}`} color="success" size="small" />
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Alert
                                    severity={contentStats.total > 0 ? "info" : "warning"}
                                    sx={{ mt: 3, borderRadius: 2 }}
                                    variant="outlined"
                                >
                                    {contentStats.total > 0
                                        ? `You have ${contentStats.total} content items scheduled for today. Users will see these items in their daily feed.`
                                        : "No content scheduled for today. Add content to keep users engaged!"}
                                </Alert>
                            </Grid>
                        </Grid>
                    )}
                </Paper>

                {/* Main Content Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Quick Actions */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Box sx={{ bgcolor: 'secondary.50', p: 1, borderRadius: 2, mr: 2, display: 'flex' }}>
                                    <TrendingUpIcon color="secondary" />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Quick Actions
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Daily Content"
                                        description="Manage Word, Phrase, Stories, etc."
                                        to="/admin/daily-content"
                                        icon={<ArticleIcon />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Manage Videos"
                                        description="Add, edit, or delete videos"
                                        to="/admin/videos"
                                        icon={<VideoLibraryIcon />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Manage Users"
                                        description="View and manage user accounts"
                                        to="/admin/users"
                                        icon={<PeopleIcon />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Subscription Plans"
                                        description="Manage subscription offerings"
                                        to="/admin/subscription-plans"
                                        icon={<SubscriptionsIcon />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Courses & Modules"
                                        description="Organize course structure"
                                        to="/admin/courses"
                                        icon={<SchoolIcon />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Blog Posts"
                                        description="Create and edit blog posts"
                                        to="/admin/blog"
                                        icon={<ArticleIcon />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Sentence Validation"
                                        description="Review user submissions"
                                        to="/admin/sentence-validation"
                                        icon={<AssessmentIcon />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <QuickActionCard
                                        title="Help Section"
                                        description="Manage help articles"
                                        to="/admin/knowledgebase"
                                        icon={<HelpIcon />}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Recent Activity */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Box sx={{ bgcolor: 'info.50', p: 1, borderRadius: 2, mr: 2, display: 'flex' }}>
                                    <AccessTimeIcon color="info" />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Recent Users
                                </Typography>
                            </Box>
                            {isLoadingAdditional ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : recentUsers.length > 0 ? (
                                <List dense>
                                    {recentUsers.slice(0, 5).map((user) => (
                                        <ListItem key={user._id} sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={user.name}
                                                secondary={user.email}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No recent users
                                </Typography>
                            )}
                            <Button
                                component={RouterLink}
                                to="/admin/users"
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ mt: 2 }}
                            >
                                View All Users
                            </Button>
                        </Paper>

                        {/* Active Offers */}
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Box sx={{ bgcolor: 'warning.50', p: 1, borderRadius: 2, mr: 2, display: 'flex' }}>
                                    <CampaignIcon color="warning" />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Active Offers
                                </Typography>
                            </Box>
                            {isLoadingAdditional ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : offers.length > 0 ? (
                                <List dense>
                                    {offers.slice(0, 3).map((offer, index) => (
                                        <ListItem key={index} sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={offer.title}
                                                secondary={offer.description}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No active offers
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Recent Joiners */}
                {recentJoiners.length > 0 && (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ bgcolor: 'success.50', p: 1, borderRadius: 2, mr: 2, display: 'flex' }}>
                                <EmojiEventsIcon color="success" />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>
                                Recent Full Course Joiners
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Location</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Joined Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentJoiners.slice(0, 10).map((joiner, index) => (
                                        <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{joiner.name}</TableCell>
                                            <TableCell sx={{ py: 1.5 }}>{(joiner as any).location || 'Not Specified'}</TableCell>
                                            <TableCell sx={{ py: 1.5, color: 'text.secondary' }}>
                                                {joiner.joinedAt
                                                    ? new Date(joiner.joinedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* System Status Indicators */}
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, mt: 2 }}>
                    System Infrastructure
                </Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{
                            p: 3,
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <Box sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: '50%', mb: 2, display: 'flex' }}>
                                <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800}>{stats.publishedVideos}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Videos Live</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{
                            p: 3,
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <Box sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: '50%', mb: 2, display: 'flex' }}>
                                <PendingIcon color="info" sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800}>{stats.totalVideos - stats.publishedVideos}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Draft Content</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{
                            p: 3,
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <Box sx={{ p: 1.5, bgcolor: 'warning.50', borderRadius: '50%', mb: 2, display: 'flex' }}>
                                <LocalFireDepartmentIcon color="warning" sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800}>{stats.activeUserSubscriptions}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Active Cycles</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{
                            p: 3,
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: '50%', mb: 2, display: 'flex' }}>
                                <PeopleIcon color="primary" sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800}>{stats.totalUsers}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Base</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </AdminLayout>
    );
};

export default AdminDashboardPage;
