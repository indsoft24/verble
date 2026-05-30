// src/pages/HomePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    LinearProgress,
    Chip,
    CircularProgress,
    Alert,
    Paper,
    Button
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import WordOfTheDayCard from '../components/features/WordOfTheDayCard';
import StoryCard from '../components/features/StoryCard';
import ConversationChat from '../components/features/ConversationChat';
import LevelUnlockDialog from '../components/features/LevelUnlockDialog';
import { getTodaysDailyContent, type DailyContent } from '../services/dailyContentService';
import { getContentTypeConfig, type ContentType } from '../utils/contentTypeConfig';
import { getFreeLeaderboard, getPaidLeaderboard, getMyRank, type LeaderboardEntry } from '../services/leaderboardService';
import { getActiveOffers, type Offer } from '../services/offerService';
import { getRecentJoiners, type RecentJoiner } from '../services/recentJoinersService';

const HomePage: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [dailyContent, setDailyContent] = useState<DailyContent[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [contentError, setContentError] = useState<string | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<DailyContent | null>(null);
    const [activityType, setActivityType] = useState<'word' | 'conversation' | 'story' | null>(null);
    const [levelDialogOpen, setLevelDialogOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE' | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [recentJoiners, setRecentJoiners] = useState<RecentJoiner[]>([]);
    const [freeLeaderboard, setFreeLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [paidLeaderboard, setPaidLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<{ rank: number | null; points: number; leaderboardType: string } | null>(null);
    const [isLoadingAdditional, setIsLoadingAdditional] = useState(true);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

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

    useEffect(() => {
        fetchDailyContent();
    }, [fetchDailyContent]);

    // Fetch additional data
    useEffect(() => {
        const fetchAdditionalData = async () => {
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
        };
        fetchAdditionalData();
    }, [user]);

    const handleLevelClick = (level: 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE') => {
        setSelectedLevel(level);
        setLevelDialogOpen(true);
    };

    if (authLoading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    // Calculate progress for level unlock
    const getLevelProgress = () => {
        const level = user.membershipLevel || 'FREE';
        // const unlockedLevels = user.unlockedLevels || ['FREE'];

        if (level === 'FREE') {
            const streak = user.streaks?.free?.current || 0;
            const target = 30;
            const daysRemaining = Math.max(0, target - streak);
            return {
                current: streak,
                target,
                daysRemaining,
                nextLevel: 'BRONZE',
                progress: Math.min(100, (streak / target) * 100)
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
                progress: Math.min(100, (streak / target) * 100)
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
                progress: Math.min(100, (streak / target) * 100)
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
    const wordContent = filteredContent.find(c => c.type === 'WORD' || c.type === 'PHRASE');
    const storyContent = filteredContent.find(c => c.type === 'STORY');
    const conversationContent = filteredContent.find(c => c.type === 'CONVERSATION');

    const handleActivityClick = (content: DailyContent | null, type: 'word' | 'conversation' | 'story') => {
        if (!content) return;

        // Check if level is unlocked
        if (!unlockedLevels.includes(content.level)) {
            return; // Don't open if locked
        }

        setSelectedActivity(content);
        setActivityType(type);
    };

    const handleCloseActivity = () => {
        setSelectedActivity(null);
        setActivityType(null);
    };

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'FREE': return 'default';
            case 'BRONZE': return 'warning';
            case 'SILVER': return 'info';
            case 'GOLD': return 'success';
            case 'BONUS': return 'secondary';
            case 'FULL_COURSE': return 'primary';
            default: return 'default';
        }
    };

    // Show activity modal if selected
    if (selectedActivity && activityType) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" onClick={handleCloseActivity} sx={{ cursor: 'pointer', color: 'primary.main' }}>
                        ← Back to Dashboard
                    </Typography>
                </Box>
                {activityType === 'word' && (
                    <WordOfTheDayCard data={selectedActivity as any} />
                )}
                {activityType === 'story' && (
                    <StoryCard data={selectedActivity as any} />
                )}
                {activityType === 'conversation' && selectedActivity.metadata?.dialogue && (
                    <Box sx={{ height: '80vh' }}>
                        <ConversationChat
                            dialogue={selectedActivity.metadata.dialogue}
                            participant1={String(selectedActivity.metadata.participant1 || selectedActivity.metadata.participants?.[0] || 'Speaker 1')}
                            participant2={String(selectedActivity.metadata.participant2 || selectedActivity.metadata.participants?.[1] || 'Speaker 2')}
                        />
                    </Box>
                )}
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            Welcome back, {user.name}!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Continue your English learning journey
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip
                            label={user.membershipLevel || 'FREE'}
                            color={getLevelBadgeColor(user.membershipLevel || 'FREE')}
                            sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {user.points || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                pts
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocalFireDepartmentIcon sx={{ color: 'orange', fontSize: 28 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {currentStreak}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                day streak
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Progress Section */}
            {levelProgress && (
                <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Progress to {levelProgress.nextLevel} Unlock
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Day {levelProgress.current} of {levelProgress.target}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(levelProgress.progress)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={levelProgress.progress}
                            sx={{ height: 10, borderRadius: 5 }}
                        />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {levelProgress.daysRemaining} days to go! Keep it up. 🔥
                    </Typography>
                </Paper>
            )}

            {/* Daily Tasks Grid */}
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
                <Grid container spacing={3}>
                    {/* Word of the Day (Free) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
                                borderRadius: 2,
                                opacity: wordContent ? 1 : 0.6,
                                position: 'relative',
                                border: wordContent ? `2px solid ${getContentTypeConfig(wordContent.type as ContentType).borderColor}` : 'none',
                                backgroundColor: wordContent ? getContentTypeConfig(wordContent.type as ContentType).backgroundColor : 'background.paper'
                            }}
                        >
                            <CardActionArea
                                onClick={() => wordContent && handleActivityClick(wordContent, 'word')}
                                disabled={!wordContent}
                                sx={{ height: '100%' }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        {wordContent ? (
                                            <Box
                                                component={getContentTypeConfig(wordContent.type as ContentType).icon}
                                                sx={{
                                                    fontSize: 40,
                                                    color: getContentTypeConfig(wordContent.type as ContentType).color,
                                                    mr: 2
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                component={getContentTypeConfig('WORD').icon}
                                                sx={{
                                                    fontSize: 40,
                                                    color: 'text.disabled',
                                                    mr: 2
                                                }}
                                            />
                                        )}
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {wordContent ? getContentTypeConfig(wordContent.type as ContentType).label : 'Word of the Day'}
                                            </Typography>
                                            <Chip
                                                label={wordContent ? wordContent.level : 'Locked'}
                                                size="small"
                                                color={wordContent ? getLevelBadgeColor(wordContent.level) : 'default'}
                                                icon={!wordContent ? <LockIcon /> : undefined}
                                                sx={{ mt: 0.5 }}
                                            />
                                        </Box>
                                    </Box>
                                    {wordContent ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Learn a new word with examples and practice
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No word available today
                                        </Typography>
                                    )}
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>

                    {/* Story — unlock follows content level vs user unlockedLevels (see filteredContent) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
                                borderRadius: 2,
                                opacity: storyContent ? 1 : 0.6,
                                position: 'relative',
                                border: storyContent ? `2px solid ${getContentTypeConfig('STORY').borderColor}` : 'none',
                                backgroundColor: storyContent ? getContentTypeConfig('STORY').backgroundColor : 'background.paper'
                            }}
                        >
                            <CardActionArea
                                onClick={() => storyContent && handleActivityClick(storyContent, 'story')}
                                disabled={!storyContent}
                                sx={{ height: '100%' }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            component={getContentTypeConfig('STORY').icon}
                                            sx={{
                                                fontSize: 40,
                                                color: storyContent
                                                    ? getContentTypeConfig('STORY').color
                                                    : 'text.disabled',
                                                mr: 2
                                            }}
                                        />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {getContentTypeConfig('STORY').label}
                                            </Typography>
                                            <Chip
                                                label={storyContent ? storyContent.level : 'Locked'}
                                                size="small"
                                                color={storyContent ? getLevelBadgeColor(storyContent.level) : 'default'}
                                                sx={{ mt: 0.5 }}
                                                icon={!storyContent ? <LockIcon /> : undefined}
                                            />
                                        </Box>
                                    </Box>
                                    {storyContent ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Read today's story and learn new vocabulary
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No story scheduled for you today
                                        </Typography>
                                    )}
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>

                    {/* Conversation */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
                                borderRadius: 2,
                                opacity: conversationContent ? 1 : 0.6,
                                position: 'relative',
                                border: conversationContent ? `2px solid ${getContentTypeConfig('CONVERSATION').borderColor}` : 'none',
                                backgroundColor: conversationContent ? getContentTypeConfig('CONVERSATION').backgroundColor : 'background.paper'
                            }}
                        >
                            <CardActionArea
                                onClick={() => conversationContent && handleActivityClick(conversationContent, 'conversation')}
                                disabled={!conversationContent}
                                sx={{ height: '100%' }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            component={getContentTypeConfig('CONVERSATION').icon}
                                            sx={{
                                                fontSize: 40,
                                                color: conversationContent
                                                    ? getContentTypeConfig('CONVERSATION').color
                                                    : 'text.disabled',
                                                mr: 2
                                            }}
                                        />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {getContentTypeConfig('CONVERSATION').label}
                                            </Typography>
                                            <Chip
                                                label={conversationContent ? conversationContent.level : 'Locked'}
                                                size="small"
                                                color={conversationContent ? getLevelBadgeColor(conversationContent.level) : 'default'}
                                                sx={{ mt: 0.5 }}
                                                icon={!conversationContent ? <LockIcon /> : undefined}
                                            />
                                        </Box>
                                    </Box>
                                    {conversationContent ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Practice real-world conversations with roleplay mode
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No conversation scheduled for you today
                                        </Typography>
                                    )}
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Level Badges Section - Clickable Locked Levels */}
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Membership Levels
                </Typography>
                <Grid container spacing={2}>
                    {['BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'].map((level) => {
                        const isUnlocked = unlockedLevels.includes(level);
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={level}>
                                <Card
                                    elevation={isUnlocked ? 3 : 1}
                                    sx={{
                                        cursor: !isUnlocked ? 'pointer' : 'default',
                                        opacity: isUnlocked ? 1 : 0.7,
                                        '&:hover': !isUnlocked ? { elevation: 4 } : {},
                                    }}
                                    onClick={() => !isUnlocked && handleLevelClick(level as any)}
                                >
                                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                        {!isUnlocked && <LockIcon sx={{ mb: 1, color: 'text.secondary' }} />}
                                        <Chip
                                            label={level}
                                            color={getLevelBadgeColor(level)}
                                            sx={{ fontWeight: 'bold', mb: 1 }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {isUnlocked ? 'Unlocked' : 'Click to learn more'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            {/* Offers & Webinars Section */}
            {offers.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                        <CampaignIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Offers & Webinars
                    </Typography>
                    <Grid container spacing={2}>
                        {offers.map((offer) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={offer._id}>
                                <Card elevation={2}>
                                    {offer.imageUrl && (
                                        <Box
                                            component="img"
                                            src={offer.imageUrl}
                                            alt={offer.title}
                                            sx={{ width: '100%', height: 150, objectFit: 'cover' }}
                                        />
                                    )}
                                    <CardContent>
                                        <Chip
                                            label={offer.type}
                                            size="small"
                                            color={offer.type === 'WEBINAR' ? 'primary' : 'secondary'}
                                            sx={{ mb: 1 }}
                                        />
                                        <Typography variant="h6" gutterBottom>
                                            {offer.title}
                                        </Typography>
                                        {offer.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {offer.description}
                                            </Typography>
                                        )}
                                        {offer.linkUrl && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                href={offer.linkUrl}
                                                target="_blank"
                                                fullWidth
                                            >
                                                Learn More
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Recent Full Course Joiners */}
            {recentJoiners.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                        <PeopleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Recent Full Course Joiners
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            {recentJoiners.map((joiner, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SchoolIcon color="primary" />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {joiner.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {joiner.city}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Box>
            )}

            {/* Leaderboard Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                    <EmojiEventsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Leaderboard
                </Typography>
                <Grid container spacing={3}>
                    {/* Free Challenges Leaderboard */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Free Challenges
                            </Typography>
                            {myRank && myRank.leaderboardType === 'free' && myRank.rank != null && myRank.points > 0 && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Your Rank: #{myRank.rank} ({myRank.points} points)
                                </Alert>
                            )}
                            {isLoadingAdditional ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : freeLeaderboard.length > 0 ? (
                                <Box>
                                    {freeLeaderboard.slice(0, 10).map((entry, index) => {
                                        const isTopThree = entry.rank <= 3;
                                        const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
                                        return (
                                            <Box
                                                key={`${entry.rank}-${entry.name}-${index}`}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1.5,
                                                    mb: 1,
                                                    backgroundColor: isTopThree ? 'action.hover' : 'transparent',
                                                    borderRadius: 1,
                                                    border: isTopThree ? '1px solid' : 'none',
                                                    borderColor: isTopThree ? 'primary.light' : 'transparent',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        minWidth: 40,
                                                        fontWeight: isTopThree ? 'bold' : 'normal',
                                                        color: isTopThree ? medalColors[entry.rank - 1] : 'inherit'
                                                    }}
                                                >
                                                    #{entry.rank}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        flexGrow: 1,
                                                        fontWeight: isTopThree ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {entry.name}
                                                </Typography>
                                                <Chip
                                                    label={`${entry.points} pts`}
                                                    size="small"
                                                    color={entry.rank === 1 ? 'primary' : entry.rank === 2 ? 'secondary' : entry.rank === 3 ? 'success' : 'default'}
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No data available
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Paid Challenges Leaderboard */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Paid Challenges
                            </Typography>
                            {myRank && myRank.leaderboardType === 'paid' && myRank.rank != null && myRank.points > 0 && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Your Rank: #{myRank.rank} ({myRank.points} points)
                                </Alert>
                            )}
                            {isLoadingAdditional ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : paidLeaderboard.length > 0 ? (
                                <Box>
                                    {paidLeaderboard.slice(0, 10).map((entry, index) => {
                                        const isTopThree = entry.rank <= 3;
                                        const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
                                        return (
                                            <Box
                                                key={`${entry.rank}-${entry.name}-${index}`}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1.5,
                                                    mb: 1,
                                                    backgroundColor: isTopThree ? 'action.hover' : 'transparent',
                                                    borderRadius: 1,
                                                    border: isTopThree ? '1px solid' : 'none',
                                                    borderColor: isTopThree ? 'primary.light' : 'transparent',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        minWidth: 40,
                                                        fontWeight: isTopThree ? 'bold' : 'normal',
                                                        color: isTopThree ? medalColors[entry.rank - 1] : 'inherit'
                                                    }}
                                                >
                                                    #{entry.rank}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        flexGrow: 1,
                                                        fontWeight: isTopThree ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {entry.name}
                                                </Typography>
                                                <Chip
                                                    label={`${entry.points} pts`}
                                                    size="small"
                                                    color={entry.rank === 1 ? 'primary' : entry.rank === 2 ? 'secondary' : entry.rank === 3 ? 'success' : 'default'}
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No data available
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

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
    );
};

export default HomePage;
