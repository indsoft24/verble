// src/pages/UserDashboardPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import {
    Container,
    Typography,
    Box,
    Grid,
    Paper,
    Button,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    alpha,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import TranslateIcon from '@mui/icons-material/Translate';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExtensionIcon from '@mui/icons-material/Extension';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import MicIcon from '@mui/icons-material/Mic';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import InstagramIcon from '@mui/icons-material/Instagram';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import LevelUnlockDialog from '../components/features/LevelUnlockDialog';
import DashboardMasteryPath from '../components/dashboard/DashboardMasteryPath';
import DashboardActivitiesPanel, {
    type ActivityTileConfig,
    TIER_COLORS,
} from '../components/dashboard/DashboardActivitiesPanel';
import WordOfTheDayCard from '../components/features/WordOfTheDayCard';
import PhraseOfTheDayCard from '../components/features/PhraseOfTheDayCard';
import StoryCard from '../components/features/StoryCard';
import VocabularySetCard from '../components/features/VocabularySetCard';
import PracticalConversationActivity from '../components/features/PracticalConversationActivity';
import ConversationExperienceShell from '../components/features/ConversationExperienceShell';
import { conversationBackButtonSx } from '../components/features/conversationExperienceStyles';
import PuzzleCard from '../components/features/PuzzleCard';
import SceneCard from '../components/features/SceneCard';
import SpeechCard from '../components/features/SpeechCard';
import LyricsCard from '../components/features/LyricsCard';
import InstagramFeedsCard from '../components/features/InstagramFeedsCard';
import ActivityTierNavFooter from '../components/features/ActivityTierNavFooter';
import { getTodaysDailyContent, type DailyContent } from '../services/dailyContentService';
import { contentMatchesCatalogSlot, DAILY_CONTENT_CATALOG } from '../utils/dailyContentTypeCatalog';
import { findTodaysGoldMedia } from '../utils/goldDailyContent';
import {
    getDisplayMembershipLevel,
    getStreakForDisplayLevel,
    hasTierAccess,
    canAccessGoldTierContent,
} from '../utils/userAccessState';
import { getFreeLeaderboard, getPaidLeaderboard, getMyRank, type LeaderboardEntry } from '../services/leaderboardService';
import LeaderboardPanel from '../components/dashboard/LeaderboardPanel';
import DashboardSeminarPromoCard from '../components/dashboard/DashboardSeminarPromoCard';
import { getRecentJoiners, type RecentJoiner } from '../services/recentJoinersService';

type ActivityKind =
    | 'word'
    | 'phrase'
    | 'story'
    | 'vocab'
    | 'conversation'
    | 'puzzle_spot'
    | 'puzzle_grammar'
    | 'scene'
    | 'speech'
    | 'lyrics'
    | 'feed';

type DashboardOpenActivityState = {
    openActivity?: { kind: ActivityKind; content: DailyContent };
};

const UserDashboardPage: React.FC = () => {
    const { user, isLoading: authIsLoading, refreshUser, patchUserProgress } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [dailyContent, setDailyContent] = useState<DailyContent[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [contentError, setContentError] = useState<string | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<DailyContent | null>(null);
    const [activityKind, setActivityKind] = useState<ActivityKind | null>(null);
    const [levelDialogOpen, setLevelDialogOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE' | null>(null);
    const [recentJoiners, setRecentJoiners] = useState<RecentJoiner[]>([]);
    const [freeLeaderboard, setFreeLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [paidLeaderboard, setPaidLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<{
        rank: number | null;
        points: number;
        evaluationScore?: number;
        leaderboardType: string;
    } | null>(null);
    const [isLoadingAdditional, setIsLoadingAdditional] = useState(true);

    const fetchDailyContent = useCallback(async () => {
        if (!user) return;
        setIsLoadingContent(true);
        setContentError(null);
        try {
            const content = await getTodaysDailyContent();
            setDailyContent(content);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load daily content.';
            setContentError(message);
        } finally {
            setIsLoadingContent(false);
        }
    }, [user]);

    const fetchAdditionalData = useCallback(async () => {
        if (!user) return;
        setIsLoadingAdditional(true);
        try {
            const [joinersData, freeLb, paidLb, rank] = await Promise.all([
                getRecentJoiners(10).catch(() => []),
                getFreeLeaderboard(10).catch(() => []),
                getPaidLeaderboard(10).catch(() => []),
                getMyRank().catch(() => null),
            ]);
            setRecentJoiners(joinersData);
            setFreeLeaderboard(freeLb);
            setPaidLeaderboard(paidLb);
            setMyRank(rank);
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

    useEffect(() => {
        const state = location.state as DashboardOpenActivityState | null;
        const open = state?.openActivity;
        if (open?.content && open?.kind) {
            setSelectedActivity(open.content);
            setActivityKind(open.kind);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

    const refreshDashboardAfterSubmission = useCallback(
        async (progress?: import('../services/authService').UserProgressSnapshot) => {
            if (progress) {
                patchUserProgress(progress);
            }
            await Promise.allSettled([refreshUser(), fetchAdditionalData()]);
        },
        [refreshUser, fetchAdditionalData, patchUserProgress]
    );

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && user) {
                void refreshUser();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [refreshUser, user]);

    const findSlot = useCallback(
        (adminKey: (typeof DAILY_CONTENT_CATALOG)[number]['adminKey']) => {
            const slot = DAILY_CONTENT_CATALOG.find((s) => s.adminKey === adminKey);
            if (!slot) return undefined;
            return dailyContent.find((c) => contentMatchesCatalogSlot(c, slot));
        },
        [dailyContent]
    );

    const wordContent = findSlot('WORD');
    const phraseContent = findSlot('PHRASE');
    const storyContent = findSlot('STORY');
    const vocabContent = findSlot('VOCAB_SET');
    const conversationContent = findSlot('CONVERSATION');
    const puzzleSpotContent = findSlot('PUZZLE_SPOT');
    const puzzleGrammarContent = findSlot('PUZZLE_GRAMMAR');
    const sceneContent = findTodaysGoldMedia(dailyContent, 'SCENE');
    const speechContent = findTodaysGoldMedia(dailyContent, 'SPEECH');
    const lyricsContent = findTodaysGoldMedia(dailyContent, 'LYRICS');
    const feedContent = findTodaysGoldMedia(dailyContent, 'FEED');

    const handleActivityClick = (content: DailyContent, kind: ActivityKind) => {
        setSelectedActivity(content);
        setActivityKind(kind);
    };

    const handleCloseActivity = () => {
        setSelectedActivity(null);
        setActivityKind(null);
    };

    const openLinkedActivity = (content: DailyContent | undefined, kind: ActivityKind) => {
        if (!content) return;
        setSelectedActivity(content);
        setActivityKind(kind);
    };

    const handleLockedTier = (tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE') => {
        setSelectedLevel(tier);
        setLevelDialogOpen(true);
    };

    const getLevelBadgeColor = (level: string): 'default' | 'warning' | 'info' | 'success' | 'primary' => {
        switch (level) {
            case 'BRONZE':
                return 'warning';
            case 'SILVER':
                return 'info';
            case 'GOLD':
                return 'success';
            case 'FULL_COURSE':
                return 'primary';
            default:
                return 'default';
        }
    };

    const tile = (
        id: string,
        title: string,
        subtitle: string,
        icon: React.ReactNode,
        accent: string,
        content: DailyContent | undefined,
        kind: ActivityKind
    ): ActivityTileConfig => ({
        id,
        title,
        subtitle,
        icon,
        accentColor: accent,
        emptyToday: !content,
        onOpen: content ? () => handleActivityClick(content, kind) : undefined,
    });

    const activityTiles = useMemo(() => {
        if (!user) return null;

        const isBronzeUp = hasTierAccess(user, 'BRONZE');
        const isSilverUp = hasTierAccess(user, 'SILVER');
        const isGoldOrFull = hasTierAccess(user, 'GOLD');
        const tierHasFullCourse = hasTierAccess(user, 'FULL_COURSE');

        const freeTiles: ActivityTileConfig[] = [
            tile('word', 'Word of the Day', 'Vocabulary & pronunciation', <TranslateIcon />, TIER_COLORS.FREE, wordContent, 'word'),
            tile('phrase', 'Phrase of the Day', 'Everyday expressions', <RecordVoiceOverIcon />, TIER_COLORS.FREE, phraseContent, 'phrase'),
        ];

        const bronzeTiles: ActivityTileConfig[] = [
            tile('story', 'One Minute Read', 'Short story practice', <VideoLibraryIcon />, TIER_COLORS.BRONZE, storyContent, 'story'),
            tile('vocab', 'Essential Vocab', 'Weekly word set', <MenuBookIcon />, TIER_COLORS.BRONZE, vocabContent, 'vocab'),
        ];

        const silverTiles: ActivityTileConfig[] = [
            tile(
                'conversation',
                'Practical Conversations',
                'Real-life dialogue',
                <PeopleIcon />,
                TIER_COLORS.SILVER,
                conversationContent,
                'conversation'
            ),
            tile(
                'puzzle-spot',
                'Spot the Sentence',
                '5 quick puzzles',
                <ExtensionIcon />,
                TIER_COLORS.SILVER,
                puzzleSpotContent,
                'puzzle_spot'
            ),
            tile(
                'puzzle-grammar',
                'Grammar Puzzle',
                'Verb form practice',
                <ExtensionIcon />,
                TIER_COLORS.SILVER,
                puzzleGrammarContent,
                'puzzle_grammar'
            ),
        ];

        const goldCoreTiles: ActivityTileConfig[] = [
            tile('scene', 'Explain the Scene', 'Visual storytelling', <TheaterComedyIcon />, TIER_COLORS.GOLD, sceneContent, 'scene'),
            {
                id: 'pro-conversations',
                title: 'Professional Conversations',
                subtitle: 'Workplace English library',
                icon: <PeopleIcon />,
                accentColor: TIER_COLORS.GOLD,
                emptyToday: false,
                onOpen: () =>
                    navigate('/professional-conversations', {
                        state: { sceneContent: sceneContent ?? null },
                    }),
            },
        ];

        const goldBonusTiles: ActivityTileConfig[] = [
            tile('speech', 'Famous Speeches', 'Listen & learn', <MicIcon />, TIER_COLORS.GOLD, speechContent, 'speech'),
            tile('lyrics', 'Song Lyrics', 'Music & English', <MusicNoteIcon />, TIER_COLORS.GOLD, lyricsContent, 'lyrics'),
            tile('feed', 'Instagram Feeds', 'Social English', <InstagramIcon />, TIER_COLORS.GOLD, feedContent, 'feed'),
        ];

        return {
            isBronzeUp,
            isSilverUp,
            isGoldOrFull,
            tierHasFullCourse,
            freeTiles,
            bronzeTiles,
            silverTiles,
            goldCoreTiles,
            goldBonusTiles,
        };
    }, [
        user,
        navigate,
        wordContent,
        phraseContent,
        storyContent,
        vocabContent,
        conversationContent,
        puzzleSpotContent,
        puzzleGrammarContent,
        sceneContent,
        speechContent,
        lyricsContent,
        feedContent,
    ]);

    if (authIsLoading) {
        return (
            <UserLayout title="Dashboard">
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                </Container>
            </UserLayout>
        );
    }

    if (!user) {
        return (
            <UserLayout title="Dashboard">
                <Container sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">
                        User data not available.
                    </Typography>
                    <Button component={RouterLink} to="/login" variant="contained" sx={{ mt: 2 }}>
                        Login
                    </Button>
                </Container>
            </UserLayout>
        );
    }

    const displayLevel = getDisplayMembershipLevel(user);
    const displayStreak = getStreakForDisplayLevel(user);

    if (selectedActivity && activityKind) {
        const isConversationActivity = activityKind === 'conversation';

        return (
            <UserLayout title="Activity" variant={isConversationActivity ? 'conversations' : 'activity'}>
                {isConversationActivity ? (
                    <ConversationExperienceShell tier="silver" maxWidth="lg">
                        <Button
                            onClick={handleCloseActivity}
                            startIcon={<ArrowBackIcon />}
                            sx={conversationBackButtonSx}
                        >
                            Back to Dashboard
                        </Button>
                        <PracticalConversationActivity
                            data={selectedActivity}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                        />
                        <Paper
                            elevation={0}
                            sx={{
                                mt: 2,
                                px: { xs: 1.5, sm: 2.5 },
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: '#0f172a',
                                border: `1px solid ${alpha(TIER_COLORS.SILVER, 0.28)}`,
                            }}
                        >
                            <ActivityTierNavFooter
                                variant="dark"
                                accentColor={TIER_COLORS.SILVER}
                                left={{
                                    label: 'Spot the Sentence',
                                    onClick: puzzleSpotContent
                                        ? () => openLinkedActivity(puzzleSpotContent, 'puzzle_spot')
                                        : undefined,
                                }}
                                center={{
                                    label: '→ Grammar Puzzle',
                                    onClick: puzzleGrammarContent
                                        ? () => openLinkedActivity(puzzleGrammarContent, 'puzzle_grammar')
                                        : undefined,
                                }}
                            />
                        </Paper>
                    </ConversationExperienceShell>
                ) : (
                <Container
                    maxWidth="md"
                    disableGutters
                    sx={{
                        width: '100%',
                        py: { xs: 0.5, sm: 1.5 },
                        px: { xs: 0.75, sm: 2 },
                    }}
                >
                    <Button onClick={handleCloseActivity} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                        Back to Dashboard
                    </Button>
                    {activityKind === 'word' && (
                        <WordOfTheDayCard
                            data={selectedActivity as never}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                            onNavigateToPhrase={
                                phraseContent
                                    ? () => openLinkedActivity(phraseContent, 'phrase')
                                    : undefined
                            }
                        />
                    )}
                    {activityKind === 'phrase' && (
                        <PhraseOfTheDayCard
                            data={selectedActivity as never}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                            onNavigateToWord={
                                wordContent ? () => openLinkedActivity(wordContent, 'word') : undefined
                            }
                        />
                    )}
                    {activityKind === 'story' && (
                        <StoryCard
                            data={selectedActivity as never}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                            onNavigateToVocab={
                                vocabContent
                                    ? () => openLinkedActivity(vocabContent, 'vocab')
                                    : undefined
                            }
                        />
                    )}
                    {activityKind === 'vocab' && (
                        <VocabularySetCard
                            data={selectedActivity as never}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                            onNavigateToStory={
                                storyContent
                                    ? () => openLinkedActivity(storyContent, 'story')
                                    : undefined
                            }
                        />
                    )}
                    {(activityKind === 'puzzle_spot' || activityKind === 'puzzle_grammar') && (
                        <>
                            <PuzzleCard
                                data={selectedActivity}
                                puzzleType={
                                    activityKind === 'puzzle_grammar'
                                        ? 'GRAMMAR_FILL_BLANK'
                                        : 'SPOT_CORRECT_SENTENCE'
                                }
                                onSubmissionSuccess={refreshDashboardAfterSubmission}
                                tierNav={{
                                    accentColor: TIER_COLORS.SILVER,
                                    left: {
                                        label: 'Practical Conversations',
                                        onClick: conversationContent
                                            ? () =>
                                                  openLinkedActivity(
                                                      conversationContent,
                                                      'conversation'
                                                  )
                                            : undefined,
                                    },
                                    center: {
                                        label:
                                            activityKind === 'puzzle_spot'
                                                ? '→ Grammar Puzzle'
                                                : '← Spot the Sentence',
                                        onClick:
                                            activityKind === 'puzzle_spot'
                                                ? puzzleGrammarContent
                                                    ? () =>
                                                          openLinkedActivity(
                                                              puzzleGrammarContent,
                                                              'puzzle_grammar'
                                                          )
                                                    : undefined
                                                : puzzleSpotContent
                                                  ? () =>
                                                        openLinkedActivity(
                                                            puzzleSpotContent,
                                                            'puzzle_spot'
                                                        )
                                                  : undefined,
                                    },
                                }}
                            />
                        </>
                    )}
                    {activityKind === 'scene' && (
                        <SceneCard
                            data={selectedActivity as never}
                            hasGoldAccess={canAccessGoldTierContent(user)}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                            onNavigateToProfessional={() =>
                                navigate('/professional-conversations', {
                                    state: { sceneContent: selectedActivity },
                                })
                            }
                        />
                    )}
                    {activityKind === 'speech' && (
                        <SpeechCard
                            data={selectedActivity as never}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                            onNavigateToLyrics={
                                lyricsContent
                                    ? () => openLinkedActivity(lyricsContent, 'lyrics')
                                    : undefined
                            }
                        />
                    )}
                    {activityKind === 'lyrics' && (
                        <LyricsCard
                            data={selectedActivity as never}
                            onSubmissionSuccess={refreshDashboardAfterSubmission}
                            onNavigateToSpeech={
                                speechContent
                                    ? () => openLinkedActivity(speechContent, 'speech')
                                    : undefined
                            }
                            onNavigateToFeed={
                                feedContent
                                    ? () => openLinkedActivity(feedContent, 'feed')
                                    : undefined
                            }
                        />
                    )}
                    {activityKind === 'feed' && (
                        <InstagramFeedsCard
                            data={selectedActivity as never}
                            onNavigateToSpeech={
                                speechContent
                                    ? () => openLinkedActivity(speechContent, 'speech')
                                    : undefined
                            }
                            onNavigateToLyrics={
                                lyricsContent
                                    ? () => openLinkedActivity(lyricsContent, 'lyrics')
                                    : undefined
                            }
                        />
                    )}
                </Container>
                )}
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Dashboard">
            <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'flex-start' },
                        mb: 3,
                        gap: 2,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                            Welcome back, {user.name}!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Continue your English learning journey
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
                        <Box
                            component="img"
                            src="/verble-logo.png"
                            alt="Verble"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.style.display = 'none';
                            }}
                            sx={{ height: 48, width: 'auto', mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
                            <Chip
                                label={displayLevel.replace('_', ' ')}
                                color={getLevelBadgeColor(displayLevel)}
                                size="small"
                                sx={{ fontWeight: 700 }}
                            />
                            <Chip
                                icon={<LocalFireDepartmentIcon />}
                                label={`${displayStreak}d`}
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                            <Chip
                                icon={<EmojiEventsIcon />}
                                label={`${user.points || 0} lb pts`}
                                size="small"
                                variant="outlined"
                                component={RouterLink}
                                to="/my-rewards"
                                clickable
                                title="View rewards & scoring history"
                            />
                            {(myRank?.evaluationScore ?? user.evaluationScore ?? 0) > 0 && (
                                <Chip
                                    label={`Eval ${myRank?.evaluationScore ?? user.evaluationScore}`}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    component={RouterLink}
                                    to="/my-rewards"
                                    clickable
                                    title="View rewards & scoring history"
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                <DashboardMasteryPath
                    user={user}
                    onLockedTierClick={(tier) => {
                        if (tier !== 'FREE') handleLockedTier(tier);
                    }}
                />

                {activityTiles && (
                    <DashboardActivitiesPanel
                        isBronzeUp={activityTiles.isBronzeUp}
                        isSilverUp={activityTiles.isSilverUp}
                        isGoldOrFull={activityTiles.isGoldOrFull}
                        tierHasFullCourse={activityTiles.tierHasFullCourse}
                        freeTiles={activityTiles.freeTiles}
                        bronzeTiles={activityTiles.bronzeTiles}
                        silverTiles={activityTiles.silverTiles}
                        goldCoreTiles={activityTiles.goldCoreTiles}
                        goldBonusTiles={activityTiles.goldBonusTiles}
                        fullCourseHero={{
                            modulesTitle: 'Structured modules',
                            modulesSubtitle: 'Video path & certificate track',
                            accessTitle: 'Full course access',
                            accessSubtitle: 'All tiers + premium media',
                        }}
                        fullCourseBenefits={[
                            {
                                id: 'fc-videos',
                                title: 'Course videos',
                                subtitle: 'Module-by-module learning',
                                icon: <VideoLibraryIcon />,
                                accentColor: TIER_COLORS.FULL_COURSE,
                                onOpen: () => window.location.assign('/my-courses'),
                            },
                            {
                                id: 'fc-plans',
                                title: 'Subscription',
                                subtitle: 'Manage your plan',
                                icon: <StarIcon />,
                                accentColor: TIER_COLORS.FULL_COURSE,
                                onOpen: () => window.location.assign('/subscription-plans'),
                            },
                        ]}
                        onLockedTier={handleLockedTier}
                        isLoading={isLoadingContent}
                        error={contentError}
                    />
                )}

                <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DashboardSeminarPromoCard isLoading={isLoadingAdditional} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight={700}>
                                    Recent Joiners
                                </Typography>
                            </Box>
                            {isLoadingAdditional ? (
                                <CircularProgress size={24} />
                            ) : recentJoiners.length > 0 ? (
                                <List dense>
                                    {recentJoiners.slice(0, 5).map((joiner, index) => (
                                        <ListItem key={index} sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    {joiner.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary={joiner.name} secondary="New member" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No recent joiners
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <LeaderboardPanel
                            title="Free Challenges"
                            subtitle="Word, phrase & free-tier activities"
                            entries={freeLeaderboard}
                            isLoading={isLoadingAdditional}
                            accentColor="#14b8a6"
                            myRank={
                                myRank?.leaderboardType === 'free' &&
                                myRank.rank != null &&
                                myRank.points > 0
                                    ? { rank: myRank.rank, points: myRank.points }
                                    : null
                            }
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <LeaderboardPanel
                            title="Paid Challenges"
                            subtitle="Bronze, silver & gold activities"
                            entries={paidLeaderboard}
                            isLoading={isLoadingAdditional}
                            accentColor="#7c3aed"
                            myRank={
                                myRank?.leaderboardType === 'paid' &&
                                myRank.rank != null &&
                                myRank.points > 0
                                    ? { rank: myRank.rank, points: myRank.points }
                                    : null
                            }
                        />
                    </Grid>
                </Grid>

                {selectedLevel && (
                    <LevelUnlockDialog
                        open={levelDialogOpen}
                        onClose={() => {
                            setLevelDialogOpen(false);
                            setSelectedLevel(null);
                        }}
                        level={selectedLevel}
                        isUnlocked={hasTierAccess(user, selectedLevel)}
                    />
                )}
            </Container>
        </UserLayout>
    );
};

export default UserDashboardPage;
