// src/pages/UserDashboardPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import {
    Container, Typography, Box, Grid, Paper, Button,
    CircularProgress, Chip, Alert, Card, CardContent,
    CardActionArea, LinearProgress, Avatar, List, ListItem,
    ListItemText, ListItemAvatar
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TranslateIcon from '@mui/icons-material/Translate';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import StarIcon from '@mui/icons-material/Star';
import LevelUnlockDialog from '../components/features/LevelUnlockDialog';
import WordOfTheDayCard from '../components/features/WordOfTheDayCard';
import ConversationChat from '../components/features/ConversationChat';
import { getTodaysDailyContent, type DailyContent } from '../services/dailyContentService';
import { getContentTypeConfig, type ContentType } from '../utils/contentTypeConfig';
import { getFreeLeaderboard, getPaidLeaderboard, getMyRank, type LeaderboardEntry } from '../services/leaderboardService';
import { getActiveOffers, type Offer } from '../services/offerService';
import { getRecentJoiners, type RecentJoiner } from '../services/recentJoinersService';

const UserDashboardPage: React.FC = () => {
    const { user, isLoading: authIsLoading } = useAuth();
    const navigate = useNavigate();
    
    // State management
    const [dailyContent, setDailyContent] = useState<DailyContent[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [contentError, setContentError] = useState<string | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<DailyContent | null>(null);
    const [activityType, setActivityType] = useState<'word' | 'conversation' | null>(null);
    const [levelDialogOpen, setLevelDialogOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE' | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [recentJoiners, setRecentJoiners] = useState<RecentJoiner[]>([]);
    const [freeLeaderboard, setFreeLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [paidLeaderboard, setPaidLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<{ rank: number; points: number; leaderboardType: string } | null>(null);
    const [isLoadingAdditional, setIsLoadingAdditional] = useState(true);

    // Fetch daily content
    const fetchDailyContent = useCallback(async () => {
        if (!user) return;
        setIsLoadingContent(true);
        setContentError(null);
        try {
            const content = await getTodaysDailyContent();
            setDailyContent(content);
        } catch (err: any) {
            setContentError(err.message || 'Failed to load daily content.');
        } finally {
            setIsLoadingContent(false);
        }
    }, [user]);

    // Fetch additional data
    const fetchAdditionalData = useCallback(async () => {
        if (!user) return;
        setIsLoadingAdditional(true);
        try {
            const [offersData, joinersData, freeLeaderboardData, paidLeaderboardData, myRankData] = await Promise.all([
                getActiveOffers().catch(() => []),
                getRecentJoiners(10).catch(() => []),
                getFreeLeaderboard(10).catch(() => []),
                getPaidLeaderboard(10).catch(() => []),
                getMyRank().catch(() => null),
            ]);
            setOffers(offersData);
            setRecentJoiners(joinersData);
            setFreeLeaderboard(freeLeaderboardData);
            setPaidLeaderboard(paidLeaderboardData);
            setMyRank(myRankData);
        } catch (error) {
            console.error('Failed to load additional data:', error);
        } finally {
            setIsLoadingAdditional(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDailyContent();
        fetchAdditionalData();
    }, [fetchDailyContent, fetchAdditionalData]);

    if (authIsLoading) {
        return (
            <UserLayout title="Dashboard">
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2, ml: 2 }}>Loading...</Typography>
                </Container>
            </UserLayout>
        );
    }

    if (!user) {
        return (
            <UserLayout title="Dashboard">
                <Container sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">User data not available.</Typography>
                    <Button component={RouterLink} to="/login" variant="contained" sx={{ mt: 2 }}>Login</Button>
                </Container>
            </UserLayout>
        );
    }

    // Calculate level progress
    const getLevelProgress = () => {
        const level = user.membershipLevel || 'FREE';
        const unlockedLevels = user.unlockedLevels || ['FREE'];
        
        if (level === 'FREE') {
            const streak = user.streaks?.free?.current || 0;
            const target = 30;
            const daysRemaining = Math.max(0, target - streak);
            return {
                current: streak,
                target,
                daysRemaining,
                nextLevel: 'BRONZE',
                progress: Math.min(100, (streak / target) * 100),
                level: 'FREE'
            };
        } else if (level === 'BRONZE') {
            const streak = user.streaks?.bronze?.current || 0;
            const target = 60;
            const daysRemaining = Math.max(0, target - streak);
            return {
                current: streak,
                target,
                daysRemaining,
                nextLevel: 'SILVER',
                progress: Math.min(100, (streak / target) * 100),
                level: 'BRONZE'
            };
        } else if (level === 'SILVER') {
            const streak = user.streaks?.silver?.current || 0;
            const target = 90;
            const daysRemaining = Math.max(0, target - streak);
            return {
                current: streak,
                target,
                daysRemaining,
                nextLevel: 'GOLD',
                progress: Math.min(100, (streak / target) * 100),
                level: 'SILVER'
            };
        }
        return null;
    };

    const levelProgress = getLevelProgress();
    const currentStreak = user.streaks?.[user.membershipLevel?.toLowerCase() as 'free' | 'bronze' | 'silver']?.current || 0;
    const unlockedLevels = user.unlockedLevels || ['FREE'];

    // Filter content by unlocked levels
    const filteredContent = dailyContent.filter(content => 
        unlockedLevels.includes(content.level)
    );

    // Get specific content types
    const wordContent = filteredContent.find(c => c.type === 'WORD');
    const phraseContent = filteredContent.find(c => c.type === 'PHRASE');
    const storyContent = filteredContent.find(c => c.type === 'STORY');
    const conversationContent = filteredContent.find(c => c.type === 'CONVERSATION');

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'FREE': return 'default';
            case 'BRONZE': return 'warning';
            case 'SILVER': return 'info';
            case 'GOLD': return 'success';
            case 'FULL_COURSE': return 'primary';
            default: return 'default';
        }
    };

    const handleLevelClick = (level: 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE') => {
        if (!unlockedLevels.includes(level)) {
            setSelectedLevel(level);
            setLevelDialogOpen(true);
        }
    };

    const handleActivityClick = (content: DailyContent, type: 'word' | 'conversation') => {
        setSelectedActivity(content);
        setActivityType(type);
    };

    const handleCloseActivity = () => {
        setSelectedActivity(null);
        setActivityType(null);
    };

    // Show activity modal if selected
    if (selectedActivity && activityType) {
        return (
            <UserLayout title="Activity">
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Box sx={{ mb: 2 }}>
                        <Button onClick={handleCloseActivity} startIcon={<Box>←</Box>}>
                            Back to Dashboard
                        </Button>
                    </Box>
                    {activityType === 'word' && (
                        <WordOfTheDayCard data={selectedActivity as any} />
                    )}
                    {activityType === 'conversation' && selectedActivity.metadata?.dialogue && (
                        <Box sx={{ height: '80vh' }}>
                            <ConversationChat 
                                dialogue={selectedActivity.metadata.dialogue}
                                userSpeaker={selectedActivity.metadata.participants?.[1]}
                            />
                        </Box>
                    )}
                </Container>
            </UserLayout>
        );
    }

    const levels = [
        { name: 'FREE', label: 'Free', icon: <SchoolIcon />, color: '#757575' },
        { name: 'BRONZE', label: 'Bronze', icon: <EmojiEventsIcon />, color: '#ff9800' },
        { name: 'SILVER', label: 'Silver', icon: <StarIcon />, color: '#2196f3' },
        { name: 'GOLD', label: 'Gold', icon: <WorkspacePremiumIcon />, color: '#4caf50' },
        { name: 'FULL_COURSE', label: 'Full Course', icon: <AutoAwesomeIcon />, color: '#9c27b0' },
    ];

    return (
        <UserLayout title="Dashboard">
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header Section - Logo, Membership Level, Welcome Message */}
                <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                Welcome back, {user.name}! 👋
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.95 }}>
                                Continue your English learning journey
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip
                                label={user.membershipLevel || 'FREE'}
                                color={getLevelBadgeColor(user.membershipLevel || 'FREE')}
                                sx={{ fontWeight: 'bold', fontSize: '0.875rem', bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.15)', px: 2, py: 1, borderRadius: 2 }}>
                                <LocalFireDepartmentIcon sx={{ color: 'orange' }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {currentStreak}
                                </Typography>
                                <Typography variant="body2">
                                    day streak
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.15)', px: 2, py: 1, borderRadius: 2 }}>
                                <EmojiEventsIcon />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {user.points || 0}
                                </Typography>
                                <Typography variant="body2">
                                    pts
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Challenge Progress Section */}
                {levelProgress && (
                    <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {levelProgress.level} Challenge Progress
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Day {levelProgress.current} of {levelProgress.target} - Progress to {levelProgress.nextLevel}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {Math.round(levelProgress.progress)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={levelProgress.progress}
                                sx={{ height: 12, borderRadius: 6 }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                            {levelProgress.daysRemaining} days remaining to unlock {levelProgress.nextLevel}! Keep it up! 🔥
                        </Typography>
                    </Paper>
                )}

                {/* Unlocked Levels Display */}
                <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                        Your Learning Levels
                    </Typography>
                    <Grid container spacing={2}>
                        {levels.map((level) => {
                            const isUnlocked = unlockedLevels.includes(level.name);
                            return (
                                <Grid item xs={6} sm={4} md={2.4} key={level.name}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            cursor: isUnlocked ? 'default' : 'pointer',
                                            opacity: isUnlocked ? 1 : 0.6,
                                            border: isUnlocked ? `2px solid ${level.color}` : '1px solid #e0e0e0',
                                            transition: 'all 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 4
                                            }
                                        }}
                                        onClick={() => !isUnlocked && handleLevelClick(level.name as 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE')}
                                    >
                                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                            <Box sx={{ color: isUnlocked ? level.color : 'text.disabled', mb: 1 }}>
                                                {isUnlocked ? level.icon : <LockIcon />}
                                            </Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                {level.label}
                                            </Typography>
                                            {!isUnlocked && (
                                                <Chip
                                                    label="Locked"
                                                    size="small"
                                                    icon={<LockIcon />}
                                                    sx={{ mt: 1 }}
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>

                {/* Daily Activities Section */}
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Today's Learning Activities
                </Typography>

                {isLoadingContent ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : contentError ? (
                    <Alert severity="error" sx={{ mb: 3 }}>{contentError}</Alert>
                ) : (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Word of the Day */}
                        <Grid item xs={12} md={6}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    borderRadius: 2,
                                    opacity: wordContent ? 1 : 0.6,
                                    border: wordContent ? `2px solid ${getContentTypeConfig('WORD').borderColor}` : 'none',
                                }}
                            >
                                <CardActionArea
                                    onClick={() => wordContent && handleActivityClick(wordContent, 'word')}
                                    disabled={!wordContent}
                                    sx={{ height: '100%' }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <TranslateIcon sx={{ fontSize: 40, color: wordContent ? '#4caf50' : 'text.disabled', mr: 2 }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    Word of the Day
                                                </Typography>
                                                <Chip label="FREE" size="small" color="default" sx={{ mt: 0.5 }} />
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {wordContent ? 'Learn a new word with examples and practice' : 'No word available today'}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>

                        {/* Phrase of the Day */}
                        <Grid item xs={12} md={6}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    borderRadius: 2,
                                    opacity: phraseContent ? 1 : 0.6,
                                    border: phraseContent ? `2px solid ${getContentTypeConfig('PHRASE').borderColor}` : 'none',
                                }}
                            >
                                <CardActionArea
                                    onClick={() => phraseContent && handleActivityClick(phraseContent, 'word')}
                                    disabled={!phraseContent}
                                    sx={{ height: '100%' }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <RecordVoiceOverIcon sx={{ fontSize: 40, color: phraseContent ? '#2196f3' : 'text.disabled', mr: 2 }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    Phrase of the Day
                                                </Typography>
                                                <Chip label="FREE" size="small" color="default" sx={{ mt: 0.5 }} />
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {phraseContent ? 'Learn a new phrase with examples' : 'No phrase available today'}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>

                        {/* One Minute Read (Bronze) */}
                        <Grid item xs={12} md={6}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    borderRadius: 2,
                                    opacity: unlockedLevels.includes('BRONZE') && storyContent ? 1 : 0.6,
                                    border: storyContent && unlockedLevels.includes('BRONZE') ? `2px solid ${getContentTypeConfig('STORY').borderColor}` : 'none',
                                }}
                            >
                                <CardActionArea
                                    onClick={() => storyContent && unlockedLevels.includes('BRONZE') && handleActivityClick(storyContent, 'word')}
                                    disabled={!storyContent || !unlockedLevels.includes('BRONZE')}
                                    sx={{ height: '100%' }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <VideoLibraryIcon sx={{ fontSize: 40, color: unlockedLevels.includes('BRONZE') && storyContent ? '#ff9800' : 'text.disabled', mr: 2 }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    One Minute Read
                                                </Typography>
                                                <Chip 
                                                    label={unlockedLevels.includes('BRONZE') ? 'BRONZE' : 'Locked'} 
                                                    size="small" 
                                                    color={unlockedLevels.includes('BRONZE') ? 'warning' : 'default'}
                                                    icon={!unlockedLevels.includes('BRONZE') ? <LockIcon /> : undefined}
                                                    sx={{ mt: 0.5 }}
                                                />
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {unlockedLevels.includes('BRONZE') && storyContent 
                                                ? 'Read a short story and improve your reading skills'
                                                : 'Unlock Bronze level to access'}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>

                        {/* Practical Conversations (Silver) */}
                        <Grid item xs={12} md={6}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    borderRadius: 2,
                                    opacity: unlockedLevels.includes('SILVER') && conversationContent ? 1 : 0.6,
                                    border: conversationContent && unlockedLevels.includes('SILVER') ? `2px solid ${getContentTypeConfig('CONVERSATION').borderColor}` : 'none',
                                }}
                            >
                                <CardActionArea
                                    onClick={() => conversationContent && unlockedLevels.includes('SILVER') && handleActivityClick(conversationContent, 'conversation')}
                                    disabled={!conversationContent || !unlockedLevels.includes('SILVER')}
                                    sx={{ height: '100%' }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <PeopleIcon sx={{ fontSize: 40, color: unlockedLevels.includes('SILVER') && conversationContent ? '#2196f3' : 'text.disabled', mr: 2 }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    Practical Conversations
                                                </Typography>
                                                <Chip 
                                                    label={unlockedLevels.includes('SILVER') ? 'SILVER' : 'Locked'} 
                                                    size="small" 
                                                    color={unlockedLevels.includes('SILVER') ? 'info' : 'default'}
                                                    icon={!unlockedLevels.includes('SILVER') ? <LockIcon /> : undefined}
                                                    sx={{ mt: 0.5 }}
                                                />
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {unlockedLevels.includes('SILVER') && conversationContent
                                                ? 'Practice real-life conversations'
                                                : 'Unlock Silver level to access'}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Offers and Recent Joiners Section */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Active Offers */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CampaignIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Active Offers
                                </Typography>
                            </Box>
                            {isLoadingAdditional ? (
                                <CircularProgress size={24} />
                            ) : offers.length > 0 ? (
                                <List>
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
                                    No active offers at the moment
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Recent Joiners */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Recent Joiners
                                </Typography>
                            </Box>
                            {isLoadingAdditional ? (
                                <CircularProgress size={24} />
                            ) : recentJoiners.length > 0 ? (
                                <List>
                                    {recentJoiners.slice(0, 5).map((joiner, index) => (
                                        <ListItem key={index} sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    {joiner.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={joiner.name}
                                                secondary={joiner.location || 'New member'}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No recent joiners to display
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Leaderboards Section */}
                <Grid container spacing={3}>
                    {/* Free Challenges Leaderboard */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Free Challenges Leaderboard
                                </Typography>
                            </Box>
                            {isLoadingAdditional ? (
                                <CircularProgress size={24} />
                            ) : freeLeaderboard.length > 0 ? (
                                <List>
                                    {freeLeaderboard.map((entry, index) => (
                                        <ListItem key={index} sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: index < 3 ? 'primary.main' : 'grey.500' }}>
                                                    {index + 1}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={entry.name}
                                                secondary={`${entry.points} points`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No leaderboard data available
                                </Typography>
                            )}
                            {myRank && myRank.leaderboardType === 'free' && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Your Rank: #{myRank.rank} ({myRank.points} points)
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Paid Challenges Leaderboard */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <StarIcon sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Paid Challenges Leaderboard
                                </Typography>
                            </Box>
                            {isLoadingAdditional ? (
                                <CircularProgress size={24} />
                            ) : paidLeaderboard.length > 0 ? (
                                <List>
                                    {paidLeaderboard.map((entry, index) => (
                                        <ListItem key={index} sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: index < 3 ? 'success.main' : 'grey.500' }}>
                                                    {index + 1}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={entry.name}
                                                secondary={`${entry.points} points`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No leaderboard data available
                                </Typography>
                            )}
                            {myRank && myRank.leaderboardType === 'paid' && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Your Rank: #{myRank.rank} ({myRank.points} points)
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Level Unlock Dialog */}
                {selectedLevel && (
                    <LevelUnlockDialog
                        open={levelDialogOpen}
                        onClose={() => {
                            setLevelDialogOpen(false);
                            setSelectedLevel(null);
                        }}
                        level={selectedLevel}
                        isUnlocked={unlockedLevels.includes(selectedLevel)}
                    />
                )}
            </Container>
        </UserLayout>
    );
};

export default UserDashboardPage;
