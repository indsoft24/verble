// src/pages/VideoWatchPage.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Snackbar,
    Grid,
    Stack,
    Chip,
    Skeleton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ViewListIcon from '@mui/icons-material/ViewList';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PlayLessonOutlinedIcon from '@mui/icons-material/PlayLessonOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { saveAs } from 'file-saver';

import { getVideoByIdForUser, getVideoPlayToken, getVideoNavigation, downloadMaterialForUser, markVideoCompleted } from '../services/videoService';
import { getModuleQuizAvailability, type ModuleQuizAvailability } from '../services/moduleQuizService';
import type { VideoDetail, VideoPlayTokenData } from '../services/videoService';
import LocalHlsPlayer from '../components/features/video/LocalHlsPlayer';
import {
    getPublishedCourseWithModulesForUser,
    getPublishedModuleWithVideosForUser,
    type VideoListItemForModulePage,
} from '../services/courseUserService';
import { extractId, getStringId } from '../utils/idUtils';
import UserLayout from '../components/layout/UserLayout';
import CourseNavRow, { type CourseNavItem } from '../components/course/CourseNavRow';
import {
    CourseLearningShell,
    CourseLearningBreadcrumbs,
    CourseBottomNav,
    ModuleQuizCallout,
    courseLearningTheme,
    courseBottomNavZIndex,
    courseChipOutlinedSx,
    courseChipSuccessSx,
    courseChipWarningSx,
    courseChipInfoSx,
    type CourseBottomNavAction,
} from '../components/course';
import { alpha } from '@mui/material/styles';

function formatDuration(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${h}:${String(mm).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function extractCourseId(video: VideoDetail): string | null {
    const arr = video.courses;
    if (!arr?.length) return null;
    return getStringId(arr[0]);
}

function collectModuleIds(video: VideoDetail): string[] {
    const out: string[] = [];
    for (const m of video.modules ?? []) {
        const maybeObj = m as any;
        const id = getStringId(m) || getStringId(maybeObj?.id) || getStringId(maybeObj?.moduleId);
        if (id) out.push(id);
    }
    return out;
}

function isMongoObjectId(value: string | null | undefined): value is string {
    return !!value && /^[0-9a-fA-F]{24}$/.test(value);
}

function normalizeModuleId(input: unknown): string | null {
    const id = getStringId(input);
    return isMongoObjectId(id) ? id : null;
}

function resolveModuleIdCandidate(input: unknown): string | null {
    const obj = input as any;
    const candidate =
        normalizeModuleId(input) ||
        normalizeModuleId(obj?._id) ||
        normalizeModuleId(obj?.id) ||
        normalizeModuleId(obj?.moduleId);
    return candidate || null;
}

function sortVideosByOrder(videos: VideoListItemForModulePage[]) {
    return [...videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function dedupeNavByVideoId(items: CourseNavItem[]): CourseNavItem[] {
    const seen = new Set<string>();
    const out: CourseNavItem[] = [];
    for (const item of items) {
        if (seen.has(item._id)) continue;
        seen.add(item._id);
        out.push(item);
    }
    return out;
}

async function buildOrderedPlaylistForVideo(video: VideoDetail): Promise<{
    flat: CourseNavItem[];
    courseId: string | null;
    courseTitle: string | null;
}> {
    const courseId = extractCourseId(video);
    const moduleIdsOnVideo = collectModuleIds(video).filter(isMongoObjectId);

    const toItems = (
        moduleId: string,
        moduleTitle: string,
        videos: VideoListItemForModulePage[]
    ): CourseNavItem[] =>
        sortVideosByOrder(videos).map((v) => ({
            _id: v._id,
            title: v.title,
            moduleId,
            moduleTitle,
            durationSeconds: v.durationSeconds,
            thumbnailUrl: v.thumbnailUrl,
            isLocked: v.isLocked,
            canAccess: v.canAccess,
        }));

    if (courseId) {
        try {
            const { course, modules } = await getPublishedCourseWithModulesForUser(courseId);
            const sorted = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const moduleTargets = sorted
                .map((m) => ({ module: m, moduleId: resolveModuleIdCandidate(m) }))
                .filter((x): x is { module: typeof modules[number]; moduleId: string } => Boolean(x.moduleId));

            const settled = await Promise.allSettled(moduleTargets.map((x) => getPublishedModuleWithVideosForUser(x.moduleId)));

            const flat: CourseNavItem[] = [];
            for (let i = 0; i < moduleTargets.length; i++) {
                const res = settled[i];
                if (res.status !== 'fulfilled') continue;
                const mod = moduleTargets[i];
                flat.push(...toItems(mod.moduleId, mod.module.title, res.value.videos || []));
            }

            const deduped = dedupeNavByVideoId(flat);
            if (deduped.length > 0) {
                return { flat: deduped, courseId, courseTitle: course.title };
            }
        } catch {
            /* fall through to module-only */
        }
    }

    if (moduleIdsOnVideo.length > 0) {
        const moduleSettled = await Promise.allSettled(
            moduleIdsOnVideo.map((mid) => getPublishedModuleWithVideosForUser(mid))
        );

        const mergedFlat: CourseNavItem[] = [];
        let fallbackCourseId: string | null = null;
        let fallbackCourseTitle: string | null = null;

        for (const result of moduleSettled) {
            if (result.status !== 'fulfilled') continue;
            const { module, videos } = result.value;
            const moduleId = resolveModuleIdCandidate(module);
            if (!moduleId) continue;

            mergedFlat.push(...toItems(moduleId, module.title, videos || []));

            if (!fallbackCourseId && typeof module.course === 'object' && module.course) {
                fallbackCourseId = extractId(module.course as { _id?: string });
            }
            if (!fallbackCourseTitle && typeof module.course === 'object' && module.course && 'title' in module.course) {
                fallbackCourseTitle = String((module.course as { title?: string }).title || '');
            }
        }

        if (mergedFlat.length > 0) {
            return {
                flat: dedupeNavByVideoId(mergedFlat),
                courseId: fallbackCourseId || courseId,
                courseTitle: fallbackCourseTitle,
            };
        }
    }

    return { flat: [], courseId, courseTitle: null };
}

const VideoWatchPage: React.FC = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();

    const [video, setVideo] = useState<VideoDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [playConfig, setPlayConfig] = useState<VideoPlayTokenData | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const [quizPrompt, setQuizPrompt] = useState<{ moduleId: string; hasQuiz: boolean } | null>(null);
    const [moduleQuizGate, setModuleQuizGate] = useState<ModuleQuizAvailability | null>(null);
    const hasMarkedCompleteRef = useRef(false);

    const [navRefreshKey, setNavRefreshKey] = useState(0);
    const [navLoading, setNavLoading] = useState(false);
    const [navFlat, setNavFlat] = useState<CourseNavItem[]>([]);
    const [navCourseId, setNavCourseId] = useState<string | null>(null);
    const [navCourseTitle, setNavCourseTitle] = useState<string | null>(null);
    const [navError, setNavError] = useState<string | null>(null);
    const hasRedirectedLockedRef = useRef(false);

    const fetchVideoAndToken = useCallback(async () => {
        if (!videoId) {
            setError({ message: 'No video ID provided in the URL.' });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setPlayConfig(null);

        try {
            const videoData = await getVideoByIdForUser(videoId);
            setVideo(videoData);

            if (videoData.canAccess && videoData.videoStatus === 'AVAILABLE') {
                const tokenData = await getVideoPlayToken(videoId);
                setPlayConfig(tokenData);
            }
        } catch (err: any) {
            setError({ message: err.message || 'Failed to load video.', code: err.code });
            if (err.data?.video) {
                setVideo(err.data.video);
            }
        } finally {
            setIsLoading(false);
        }
    }, [videoId]);

    useEffect(() => {
        fetchVideoAndToken();
    }, [fetchVideoAndToken]);

    useEffect(() => {
        if (!video) {
            setNavFlat([]);
            setNavCourseId(null);
            setNavCourseTitle(null);
            setNavError(null);
            return;
        }

        let cancelled = false;
        setNavLoading(true);
        setNavError(null);

        (async () => {
            try {
                try {
                    const nav = await getVideoNavigation(video._id);
                    if (!cancelled) {
                        const flatFromApi: CourseNavItem[] = (nav.items || []).map((x) => ({
                            _id: x._id,
                            title: x.title,
                            moduleId: x.moduleId,
                            moduleTitle: x.moduleTitle || 'Module',
                            durationSeconds: x.durationSeconds,
                            thumbnailUrl: x.thumbnailUrl || undefined,
                        }));
                        setNavFlat(flatFromApi);
                        setNavCourseId(nav.courseId ?? extractCourseId(video));
                        setNavCourseTitle(nav.courseTitle ?? null);
                        setNavError(null);
                    }
                    return;
                } catch {
                    // Fallback to client-side builder if nav API is unavailable.
                }

                const { flat, courseId, courseTitle } = await buildOrderedPlaylistForVideo(video);
                if (cancelled) return;
                setNavFlat(flat);
                setNavCourseId(courseId ?? extractCourseId(video));
                setNavCourseTitle(courseTitle);
                setNavError(flat.length === 0 ? 'Lesson navigation is unavailable for this video.' : null);
            } catch {
                if (!cancelled) {
                    setNavFlat([]);
                    setNavCourseId(extractCourseId(video));
                    setNavCourseTitle(null);
                    setNavError('Lesson navigation is temporarily unavailable.');
                }
            } finally {
                if (!cancelled) setNavLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [video, videoId, navRefreshKey]);

    const handleDownload = async (materialId: string, fileName: string) => {
        if (!videoId) return;
        setIsDownloading(materialId);
        try {
            const { fileData } = await downloadMaterialForUser({ videoId, materialId, fileName });
            saveAs(fileData, fileName);
        } catch {
            setError({ message: 'Download failed. You may not have access to this file.' });
        } finally {
            setIsDownloading(null);
        }
    };

    const handleVideoComplete = useCallback(async () => {
        if (!videoId || hasMarkedCompleteRef.current || isMarkingComplete) {
            return;
        }

        setIsMarkingComplete(true);
        hasMarkedCompleteRef.current = true;

        try {
            const result = await markVideoCompleted(videoId);

            if (video) {
                setVideo({
                    ...video,
                    watchCount: result.watchCount,
                    remainingWatches: result.remainingWatches,
                });
            }

            let message = `Video marked as completed. Watched ${result.watchCount} times.`;
            if (result.setComplete) {
                message += ' Set completed!';
            }
            if (result.moduleComplete) {
                message += ' All videos watched!';
            }
            if (result.nextCycleStarted) {
                message += ' New cycle started!';
            }
            setCompletionMessage(message);
            setNavRefreshKey((k) => k + 1);

            if (result.moduleComplete && video) {
                const modId = collectModuleIds(video).filter(isMongoObjectId)[0];
                if (modId) {
                    try {
                        const availability = await getModuleQuizAvailability(modId);
                        setModuleQuizGate(availability);
                        if (availability.hasQuiz && !availability.isModuleComplete) {
                            setQuizPrompt({ moduleId: modId, hasQuiz: true });
                            message += ' Take the module quiz to finish this module.';
                            setCompletionMessage(message);
                        } else if (!availability.hasQuiz && availability.isModuleComplete) {
                            message += ' Module completed!';
                            setCompletionMessage(message);
                        }
                    } catch {
                        /* optional */
                    }
                }
                setTimeout(() => {
                    fetchVideoAndToken();
                }, 5000);
            }
        } catch (err: any) {
            hasMarkedCompleteRef.current = false;
            setError({
                message: err.response?.data?.message || err.message || 'Failed to mark video as completed.',
            });
        } finally {
            setIsMarkingComplete(false);
        }
    }, [videoId, video, fetchVideoAndToken, isMarkingComplete]);

    useEffect(() => {
        hasMarkedCompleteRef.current = false;
    }, [videoId]);

    useEffect(() => {
        if (!videoId) return;
        if (!video || isLoading) return;
        if (hasRedirectedLockedRef.current) return;

        const moduleId = collectModuleIds(video).filter(isMongoObjectId)[0];
        const isSequentiallyLocked = video.lockReason === 'sequence';
        if (!moduleId || !isSequentiallyLocked) return;

        hasRedirectedLockedRef.current = true;
        navigate(`/modules/${moduleId}/videos`, {
            replace: true,
            state: {
                toast: {
                    severity: 'info',
                    message:
                        error?.message ||
                        'This lesson is currently locked by sequence. Continue from the module list to unlock it.',
                },
            },
        });
    }, [video, isLoading, navigate, error, videoId]);

    const contextModuleId = useMemo(() => {
        if (videoId && navFlat.find((v) => v._id === videoId)?.moduleId) {
            return navFlat.find((v) => v._id === videoId)?.moduleId || null;
        }
        return video ? collectModuleIds(video).filter(isMongoObjectId)[0] ?? null : null;
    }, [videoId, navFlat, video]);

    useEffect(() => {
        if (!contextModuleId) {
            setModuleQuizGate(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const gate = await getModuleQuizAvailability(contextModuleId);
                if (!cancelled) setModuleQuizGate(gate);
            } catch {
                if (!cancelled) setModuleQuizGate(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [contextModuleId, navRefreshKey]);
    const currentNavItem = videoId ? navFlat.find((v) => v._id === videoId) : undefined;
    const contextModuleTitle = currentNavItem?.moduleTitle || null;

    const moduleNavFlat = contextModuleId ? navFlat.filter((v) => v.moduleId === contextModuleId) : navFlat;
    const activeNavFlat = moduleNavFlat.length > 0 ? moduleNavFlat : navFlat;
    const navIndex = videoId ? activeNavFlat.findIndex((v) => v._id === videoId) : -1;
    const navTotal = activeNavFlat.length;

    const isLastInModule = navIndex >= 0 && navIndex === navTotal - 1;
    const linearNext =
        navIndex >= 0 && navIndex < navTotal - 1 ? activeNavFlat[navIndex + 1] : null;

    const showQuizUpNext = Boolean(
        contextModuleId &&
            moduleQuizGate?.hasQuiz &&
            isLastInModule &&
            (moduleQuizGate.canTakeQuiz ||
                moduleQuizGate.quizUnlocked ||
                moduleQuizGate.quizState === 'ready' ||
                (moduleQuizGate.quizState === 'passed' && moduleQuizGate.canTakeQuiz))
    );

    const quizNextTo = contextModuleId ? `/modules/${contextModuleId}/quiz` : null;

    const prevItem = navIndex > 0 ? activeNavFlat[navIndex - 1] : null;
    const nextItem = showQuizUpNext ? null : linearNext;

    const nextThree =
        showQuizUpNext || isLastInModule
            ? []
            : navIndex >= 0
              ? activeNavFlat.slice(navIndex + 1, navIndex + 4)
              : activeNavFlat.slice(0, 3);

    const fallbackCourseId = video ? extractCourseId(video) : null;
    const outlineCourseId = [navCourseId, fallbackCourseId].find((id) => isMongoObjectId(id)) ?? null;
    const outlineCourseTitle = navCourseTitle;
    const accessErrorMessage = error?.message || 'This video requires a subscription or is still processing.';
    const isSequenceLocked =
        video?.lockReason === 'sequence' ||
        (!video?.lockReason && /locked|unlock lesson|complete lesson/i.test(accessErrorMessage));
    const isSubscriptionLocked = video?.lockReason === 'subscription';

    const moduleBackTo = contextModuleId ? `/modules/${contextModuleId}/videos` : '/my-courses';
    const bottomSecondary: CourseBottomNavAction[] = [];
    if (prevItem) {
        bottomSecondary.push({ label: 'Previous', to: `/videos/${prevItem._id}`, icon: 'prev', variant: 'outlined' });
    } else {
        bottomSecondary.push({ label: 'Previous', to: '#', icon: 'prev', variant: 'outlined', disabled: true });
    }
    if (showQuizUpNext && quizNextTo) {
        bottomSecondary.push({ label: 'Take quiz', to: quizNextTo, icon: 'next', variant: 'contained' });
    } else if (nextItem) {
        bottomSecondary.push({ label: 'Next', to: `/videos/${nextItem._id}`, icon: 'next', variant: 'contained' });
    } else {
        bottomSecondary.push({ label: 'Next', to: '#', icon: 'next', variant: 'contained', disabled: true });
    }

    const learningPaperSx = {
        p: courseLearningTheme.paperP,
        borderRadius: `${courseLearningTheme.borderRadius}px`,
        border: courseLearningTheme.tileBorder(),
        bgcolor: courseLearningTheme.bandBg,
        boxShadow: courseLearningTheme.bandShadow,
    };

    if (isLoading) {
        return (
            <UserLayout title="Watch Video" fullWidth variant="learning">
                <CourseLearningShell maxWidth="xl">
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 2 }}>
                        <CircularProgress size={28} sx={{ color: courseLearningTheme.accent }} />
                        <Typography sx={{ color: courseLearningTheme.textMuted }}>Loading video…</Typography>
                    </Box>
                </CourseLearningShell>
            </UserLayout>
        );
    }

    if (error && !video) {
        return (
            <UserLayout title="Watch Video" variant="learning">
                <CourseLearningShell maxWidth="md">
                    <Alert severity="error">{error.message}</Alert>
                </CourseLearningShell>
                <CourseBottomNav backLabel="Back to lessons" backTo={moduleBackTo} />
            </UserLayout>
        );
    }

    if (!video) {
        return (
            <UserLayout title="Watch Video" variant="learning">
                <CourseLearningShell>
                    <Alert severity="warning">Could not find video data.</Alert>
                </CourseLearningShell>
            </UserLayout>
        );
    }

    return (
        <UserLayout title={video.title || 'Watch Video'} fullWidth variant="learning">
            <CourseLearningShell maxWidth="xl" disableGutters>
                <CourseLearningBreadcrumbs
                    items={[
                        { label: 'My Courses', to: '/my-courses' },
                        ...(outlineCourseId
                            ? [{ label: outlineCourseTitle || 'Course', to: `/courses/${outlineCourseId}` }]
                            : []),
                        ...(contextModuleId
                            ? [{ label: contextModuleTitle || 'Module', to: `/modules/${contextModuleId}/videos` }]
                            : []),
                        { label: video.title },
                    ]}
                />

                <Paper elevation={0} sx={{ ...learningPaperSx, mb: courseLearningTheme.sectionGap }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                        sx={{ gap: courseLearningTheme.space.rowIndent }}
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    fontSize: { xs: '1.35rem', md: '1.75rem' },
                                    color: courseLearningTheme.textPrimary,
                                }}
                            >
                                {video.title}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 760, color: courseLearningTheme.textBody, fontSize: '0.8125rem' }}>
                                Watch the lesson, mark complete, then continue with the next video.
                            </Typography>
                        </Box>
                        <Stack
                            direction="row"
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ gap: courseLearningTheme.space.gap, mt: { xs: courseLearningTheme.space.sectionMt, md: 0 } }}
                        >
                            <Chip size="small" icon={<OndemandVideoIcon sx={{ fontSize: '16px !important' }} />} label={video.videoStatus || 'Unknown'} variant="outlined" sx={courseChipOutlinedSx} />
                            {video.durationSeconds ? (
                                <Chip size="small" icon={<TimerOutlinedIcon sx={{ fontSize: '16px !important' }} />} label={formatDuration(video.durationSeconds)} variant="outlined" sx={courseChipOutlinedSx} />
                            ) : null}
                            <Chip
                                size="small"
                                icon={<WorkspacePremiumIcon sx={{ fontSize: '16px !important' }} />}
                                label={video.canAccess ? 'Access granted' : 'Restricted'}
                                variant="outlined"
                                sx={video.canAccess ? courseChipSuccessSx : courseChipWarningSx}
                            />
                        </Stack>
                    </Stack>
                </Paper>

                <Box sx={{ maxWidth: courseLearningTheme.contentMaxWidth, mx: 'auto', width: '100%' }}>
                <Grid container spacing={{ xs: 1, lg: 2 }} alignItems="flex-start">
                    <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 1 }, minWidth: 0 }}>
                        <Paper elevation={0} sx={learningPaperSx}>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 800,
                                    mb: courseLearningTheme.space.gapMd,
                                    color: courseLearningTheme.accent,
                                    letterSpacing: 0.4,
                                }}
                            >
                                VIDEO PLAYER
                            </Typography>

                            {video.canAccess && video.videoStatus === 'AVAILABLE' && playConfig ? (
                                <>
                                    <Box sx={{ position: 'relative', width: '100%' }}>
                                        {playConfig.playbackProvider === 'local' ? (
                                            <LocalHlsPlayer
                                                playlistPath={playConfig.playlistPath}
                                                mongoVideoId={videoId!}
                                                onVideoComplete={handleVideoComplete}
                                                durationSeconds={video.durationSeconds}
                                            />
                                        ) : null}
                                    </Box>
                                    <Box sx={courseLearningTheme.learningActionBarSx}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleVideoComplete}
                                            disabled={isMarkingComplete || hasMarkedCompleteRef.current}
                                            startIcon={isMarkingComplete ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                px: 2.5,
                                                boxShadow: 'none',
                                                bgcolor: courseLearningTheme.accent,
                                                '&:hover': { bgcolor: courseLearningTheme.accentDark },
                                            }}
                                        >
                                            {isMarkingComplete ? 'Marking as complete…' : 'Mark video as complete'}
                                        </Button>
                                    </Box>
                                </>
                            ) : (
                                <Alert
                                    severity="error"
                                    icon={<LockIcon fontSize="inherit" />}
                                    sx={{
                                        aspectRatio: '16 / 9',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography variant="h6" gutterBottom>
                                        Access denied
                                    </Typography>
                                    <Typography sx={{ mb: 2, textAlign: 'center', maxWidth: 420 }}>
                                        {accessErrorMessage}
                                    </Typography>
                                    {isSequenceLocked && contextModuleId ? (
                                        <Button
                                            component={RouterLink}
                                            to={`/modules/${contextModuleId}/videos`}
                                            variant="contained"
                                            color="primary"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            Go to module lessons
                                        </Button>
                                    ) : isSubscriptionLocked ? (
                                        <Button component={RouterLink} to="/subscription-plans" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
                                            View subscription plans
                                        </Button>
                                    ) : (
                                        <Button component={RouterLink} to={moduleBackTo} variant="contained" sx={{ fontWeight: 700 }}>
                                            Back to lessons
                                        </Button>
                                    )}
                                </Alert>
                            )}

                            {video.description && (
                                <Box sx={{ mt: courseLearningTheme.stackGapLoose }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: courseLearningTheme.textSecondary }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: courseLearningTheme.textBody }}>
                                        {video.description}
                                    </Typography>
                                </Box>
                            )}

                            {video.associatedMaterials && video.associatedMaterials.length > 0 && (
                                <Box sx={{ mt: courseLearningTheme.stackGapLoose }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: courseLearningTheme.textSecondary }}>
                                        Study materials
                                    </Typography>
                                    <Divider sx={{ my: courseLearningTheme.stackGap }} />
                                    <List>
                                        {video.associatedMaterials.map((material) => (
                                            <ListItem
                                                key={material._id}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="download"
                                                        color="primary"
                                                        onClick={() => handleDownload(material._id, material.fileName)}
                                                        disabled={isDownloading === material._id}
                                                        sx={{ color: courseLearningTheme.accent }}
                                                    >
                                                        {isDownloading === material._id ? <CircularProgress size={24} /> : <DownloadIcon />}
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText
                                                    primary={material.label}
                                                    secondary={material.fileName}
                                                    primaryTypographyProps={{ color: courseLearningTheme.textPrimary, fontWeight: 600 }}
                                                    secondaryTypographyProps={{ color: courseLearningTheme.textMuted, fontSize: '0.8rem' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 2, lg: 2 }, minWidth: 0 }}>
                        <Stack sx={{ gap: courseLearningTheme.sectionGap, position: { lg: 'sticky' }, top: { lg: 12 } }}>
                            <Paper elevation={0} sx={learningPaperSx}>
                                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1, color: courseLearningTheme.accent, fontSize: '0.68rem' }}>
                                    Watch insights
                                </Typography>
                                <Stack
                                    direction="row"
                                    flexWrap="wrap"
                                    sx={{ gap: courseLearningTheme.space.gap, mt: courseLearningTheme.space.sectionMt }}
                                >
                                    <Chip size="small" icon={<PlayLessonOutlinedIcon sx={{ fontSize: '16px !important' }} />} label={`Watched this cycle: ${video.watchCount ?? 0}`} variant="outlined" sx={courseChipOutlinedSx} />
                                    <Chip
                                        size="small"
                                        label={
                                            video.maxWatchesPerCycle != null
                                                ? `Left this cycle: ${video.remainingWatches ?? 0} / ${video.maxWatchesPerCycle}`
                                                : `Remaining: ${video.remainingWatches ?? 0}`
                                        }
                                        variant="outlined"
                                        sx={courseChipInfoSx}
                                    />
                                    {video.maxModuleCycles != null && (
                                        <Chip
                                            size="small"
                                            label={`Cycle ${(video.completionCycle ?? 0) + 1} of ${video.maxModuleCycles}`}
                                            variant="outlined"
                                            sx={courseChipOutlinedSx}
                                        />
                                    )}
                                </Stack>
                            </Paper>
                            <Paper elevation={0} sx={learningPaperSx}>
                            <Typography
                                variant="overline"
                                sx={{ fontWeight: 800, letterSpacing: 1, color: courseLearningTheme.accent, display: 'block', mb: 0.75 }}
                            >
                                Course navigation
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    mb: courseLearningTheme.space.blockMb,
                                    maxWidth: 340,
                                    lineHeight: 1.45,
                                    color: courseLearningTheme.textBody,
                                    fontSize: '0.8125rem',
                                }}
                            >
                                Move through the full course without using the browser back button.
                            </Typography>

                            {navLoading ? (
                                <Stack sx={courseLearningTheme.learningColStackSx}>
                                    <Skeleton variant="rounded" height={40} />
                                    <Skeleton variant="rounded" height={40} />
                                    <Skeleton variant="rounded" height={48} />
                                    <Skeleton variant="rounded" height={48} />
                                </Stack>
                            ) : (
                                <>
                                    {navError && (
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            {navError}
                                        </Alert>
                                    )}

                                    <Stack sx={{ ...courseLearningTheme.learningColStackSx, mb: courseLearningTheme.space.blockMb }}>
                                        {outlineCourseId && (
                                            <Button
                                                component={RouterLink}
                                                to={`/courses/${outlineCourseId}`}
                                                variant="contained"
                                                fullWidth
                                                startIcon={<MenuBookIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 1.5,
                                                    boxShadow: 'none',
                                                    minHeight: 44,
                                                    bgcolor: courseLearningTheme.accent,
                                                    '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.88), boxShadow: 'none' },
                                                }}
                                            >
                                                Full course outline
                                            </Button>
                                        )}
                                        {contextModuleId && (
                                            <Button
                                                component={RouterLink}
                                                to={`/modules/${contextModuleId}/videos`}
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<ViewListIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 1.5,
                                                    minHeight: 44,
                                                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                                                    color: courseLearningTheme.textPrimary,
                                                    '&:hover': {
                                                        borderColor: courseLearningTheme.accent,
                                                        bgcolor: alpha(courseLearningTheme.accent, 0.12),
                                                    },
                                                }}
                                            >
                                                All lessons in this module
                                            </Button>
                                        )}
                                    </Stack>

                                    {navTotal > 0 && navIndex >= 0 && (
                                        <Box sx={{ ...courseLearningTheme.learningActionBarSx, mb: courseLearningTheme.space.blockMb }}>
                                            <Chip
                                                icon={<AutoAwesomeIcon sx={{ fontSize: '16px !important' }} />}
                                                label={`Lesson ${navIndex + 1} of ${navTotal}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 700,
                                                    px: 0.25,
                                                    height: 38,
                                                    borderRadius: 999,
                                                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                                                    color: courseLearningTheme.accent,
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {navTotal > 0 && navIndex < 0 && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            This video is not part of the ordered lesson list for this course. Use the buttons above to browse the
                                            course or module.
                                        </Alert>
                                    )}

                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        sx={{
                                            gap: courseLearningTheme.space.rowIndent,
                                            mb: courseLearningTheme.space.blockMb,
                                            display: { xs: 'none', lg: 'flex' },
                                        }}
                                    >
                                        {prevItem ? (
                                            <Button
                                                component={RouterLink}
                                                to={`/videos/${prevItem._id}`}
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<ChevronLeftIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    minHeight: 48,
                                                    borderRadius: 1.5,
                                                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                                                    color: courseLearningTheme.textPrimary,
                                                }}
                                            >
                                                Previous
                                            </Button>
                                        ) : (
                                            <Button variant="outlined" fullWidth disabled startIcon={<ChevronLeftIcon />} sx={{ minHeight: 48, borderRadius: 1.5 }}>
                                                Previous
                                            </Button>
                                        )}
                                        {showQuizUpNext && quizNextTo ? (
                                            <Button
                                                component={RouterLink}
                                                to={quizNextTo}
                                                variant="contained"
                                                fullWidth
                                                endIcon={<ChevronRightIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    minHeight: 48,
                                                    borderRadius: 1.5,
                                                    bgcolor: courseLearningTheme.accent,
                                                    boxShadow: 'none',
                                                }}
                                            >
                                                Take quiz
                                            </Button>
                                        ) : nextItem ? (
                                            <Button
                                                component={RouterLink}
                                                to={`/videos/${nextItem._id}`}
                                                variant="contained"
                                                fullWidth
                                                endIcon={<ChevronRightIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    minHeight: 48,
                                                    borderRadius: 1.5,
                                                    bgcolor: courseLearningTheme.accent,
                                                    boxShadow: 'none',
                                                }}
                                            >
                                                Next
                                            </Button>
                                        ) : (
                                            <Button variant="contained" fullWidth disabled endIcon={<ChevronRightIcon />} sx={{ minHeight: 48, borderRadius: 1.5 }}>
                                                Next
                                            </Button>
                                        )}
                                    </Stack>

                                    <Divider sx={{ my: courseLearningTheme.space.blockMb }} />

                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: courseLearningTheme.space.blockMb }}>
                                        {showQuizUpNext ? 'Module quiz' : 'Up next in this module'}
                                    </Typography>

                                    {isLastInModule && contextModuleId && moduleQuizGate?.hasQuiz && (
                                        <ModuleQuizCallout moduleId={contextModuleId} gate={moduleQuizGate} />
                                    )}

                                    {isLastInModule && navTotal > 0 && moduleQuizGate && !moduleQuizGate.hasQuiz && (
                                        <Typography variant="body2" sx={{ mb: 1, color: courseLearningTheme.textBody }}>
                                            You are on the last lesson in this sequence.
                                        </Typography>
                                    )}

                                    {navTotal === 1 && navIndex === 0 && (
                                        <Typography variant="body2" sx={{ mb: 1, color: courseLearningTheme.textBody }}>
                                            This is the only published lesson in this sequence.
                                        </Typography>
                                    )}

                                    {navIndex < 0 && navFlat.length > 0 && (
                                        <Stack sx={courseLearningTheme.learningColStackSx}>
                                            {navFlat.slice(0, 3).map((v) => (
                                                <CourseNavRow key={v._id} item={v} currentId={videoId} />
                                            ))}
                                        </Stack>
                                    )}

                                    {nextThree.length > 0 && (
                                        <Stack sx={courseLearningTheme.learningColStackSx}>
                                            {nextThree.map((v) => (
                                                <CourseNavRow key={v._id} item={v} currentId={videoId} />
                                            ))}
                                        </Stack>
                                    )}

                                    {!navLoading && navFlat.length === 0 && !outlineCourseId && !contextModuleId && (
                                        <Typography variant="body2" sx={{ color: courseLearningTheme.textBody }}>
                                            This video is not linked to a course module, so lesson-to-lesson navigation is unavailable.
                                        </Typography>
                                    )}
                                </>
                            )}
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
                </Box>
            </CourseLearningShell>

            <CourseBottomNav
                backLabel="Back to lessons"
                backTo={moduleBackTo}
                secondaryActions={bottomSecondary}
            />

            <Snackbar
                open={!!completionMessage}
                autoHideDuration={quizPrompt ? null : 6000}
                onClose={() => setCompletionMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ bottom: { xs: 88, sm: 88 }, zIndex: courseBottomNavZIndex - 1 }}
            >
                <Alert
                    onClose={() => {
                        setCompletionMessage(null);
                        setQuizPrompt(null);
                    }}
                    severity="success"
                    sx={{ width: '100%' }}
                    action={
                        quizPrompt ? (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => navigate(`/modules/${quizPrompt.moduleId}/quiz`)}
                            >
                                Take quiz
                            </Button>
                        ) : undefined
                    }
                >
                    {completionMessage}
                </Alert>
            </Snackbar>
        </UserLayout>
    );
};

export default VideoWatchPage;
