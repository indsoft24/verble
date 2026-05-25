// src/pages/VideoWatchPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
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
    Breadcrumbs,
    Link as MuiLink,
    Skeleton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ViewListIcon from '@mui/icons-material/ViewList';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PlayLessonOutlinedIcon from '@mui/icons-material/PlayLessonOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { saveAs } from 'file-saver';

import { getVideoByIdForUser, getVideoPlayToken, getVideoNavigation, downloadMaterialForUser, markVideoCompleted } from '../services/videoService';
import type { VideoDetail, VideoPlayTokenData } from '../services/videoService';
import LocalHlsPlayer from '../components/features/video/LocalHlsPlayer';
import {
    getPublishedCourseWithModulesForUser,
    getPublishedModuleWithVideosForUser,
    type VideoListItemForModulePage,
} from '../services/courseUserService';
import { extractId, getStringId } from '../utils/idUtils';
import { getSplashImageUrl, resolveBackendMediaUrl } from '../utils/imageUtils';

/** One row in the flattened course / module lesson order (for prev / next / up next). */
interface CourseNavItem {
    _id: string;
    title: string;
    moduleId: string;
    moduleTitle: string;
    durationSeconds?: number;
    thumbnailUrl?: string;
    isLocked?: boolean;
    canAccess?: boolean;
}

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

function navThumbUrl(item: CourseNavItem): string {
    if (item.thumbnailUrl) {
        return resolveBackendMediaUrl(item.thumbnailUrl);
    }
    return getSplashImageUrl();
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
                message += ' Module completed!';
            }
            if (result.nextCycleStarted) {
                message += ' New cycle started!';
            }
            setCompletionMessage(message);
            setNavRefreshKey((k) => k + 1);

            if (result.moduleComplete) {
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
        const isSequentiallyLocked = video.canAccess === false && (video.remainingWatches ?? 0) > 0;
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

    const contextModuleId =
        videoId && navFlat.find((v) => v._id === videoId)?.moduleId
            ? navFlat.find((v) => v._id === videoId)?.moduleId || null
            : video
              ? collectModuleIds(video).filter(isMongoObjectId)[0] ?? null
              : null;
    const currentNavItem = videoId ? navFlat.find((v) => v._id === videoId) : undefined;
    const contextModuleTitle = currentNavItem?.moduleTitle || null;

    const moduleNavFlat = contextModuleId ? navFlat.filter((v) => v.moduleId === contextModuleId) : navFlat;
    const activeNavFlat = moduleNavFlat.length > 0 ? moduleNavFlat : navFlat;
    const navIndex = videoId ? activeNavFlat.findIndex((v) => v._id === videoId) : -1;
    const navTotal = activeNavFlat.length;

    const prevItem =
        navTotal > 1 && navIndex >= 0
            ? activeNavFlat[(navIndex - 1 + navTotal) % navTotal]
            : null;
    const nextItem =
        navTotal > 1 && navIndex >= 0
            ? activeNavFlat[(navIndex + 1) % navTotal]
            : null;

    const nextThree = navIndex >= 0 && navTotal > 1
        ? Array.from({ length: Math.min(3, navTotal - 1) }, (_, i) => activeNavFlat[(navIndex + 1 + i) % navTotal])
        : activeNavFlat.slice(0, 3);

    const fallbackCourseId = video ? extractCourseId(video) : null;
    const outlineCourseId = [navCourseId, fallbackCourseId].find((id) => isMongoObjectId(id)) ?? null;
    const outlineCourseTitle = navCourseTitle;
    const accessErrorMessage = error?.message || 'This video requires a subscription or is still processing.';
    const isSequenceLocked = /locked|unlock lesson|complete lesson/i.test(accessErrorMessage);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
                <CircularProgress size={28} />
                <Typography color="text.secondary">Loading video…</Typography>
            </Box>
        );
    }

    if (error && !video) {
        return (
            <Container sx={{ mt: 6, textAlign: 'center' }}>
                <Alert severity="error">{error.message}</Alert>
                <Button component={RouterLink} to="/videos" variant="outlined" sx={{ mt: 2 }}>
                    Back to videos
                </Button>
            </Container>
        );
    }

    if (!video) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="warning">Could not find video data.</Alert>
            </Container>
        );
    }

    return (
        <Box
            sx={{
                bgcolor: 'grey.50',
                minHeight: '100vh',
                pb: { xs: 4, md: 6 },
                backgroundImage: 'linear-gradient(180deg, rgba(15,23,42,0.02) 0%, rgba(15,23,42,0) 30%)',
            }}
        >
            <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3 } }}>
                <Breadcrumbs sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}>
                    <MuiLink component={RouterLink} underline="hover" color="text.secondary" to="/" sx={{ fontSize: 14 }}>
                        Home
                    </MuiLink>
                    {outlineCourseId ? (
                        <MuiLink
                            component={RouterLink}
                            underline="hover"
                            color="text.secondary"
                            to={`/courses/${outlineCourseId}`}
                            sx={{ fontSize: 14, maxWidth: 200 }}
                            noWrap
                        >
                            {outlineCourseTitle || 'Course'}
                        </MuiLink>
                    ) : null}
                    {contextModuleId ? (
                        <MuiLink
                            component={RouterLink}
                            underline="hover"
                            color="text.secondary"
                            to={`/modules/${contextModuleId}/videos`}
                            sx={{ fontSize: 14, maxWidth: 220 }}
                            noWrap
                        >
                            {contextModuleTitle || 'Module'}
                        </MuiLink>
                    ) : null}
                    <Typography color="text.primary" sx={{ fontSize: 14, fontWeight: 600, maxWidth: 280 }} noWrap>
                        {video.title}
                    </Typography>
                </Breadcrumbs>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        mb: 2.5,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.05)',
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.35rem', md: '1.75rem' } }}
                            >
                                {video.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                                Focus mode playback with adaptive quality and lesson progression tracking.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip icon={<OndemandVideoIcon />} label={video.videoStatus || 'Unknown'} variant="outlined" />
                            {video.durationSeconds ? (
                                <Chip icon={<TimerOutlinedIcon />} label={formatDuration(video.durationSeconds)} variant="outlined" />
                            ) : null}
                            <Chip icon={<WorkspacePremiumIcon />} label={video.canAccess ? 'Access granted' : 'Restricted'} color={video.canAccess ? 'success' : 'warning'} variant="outlined" />
                        </Stack>
                    </Stack>
                </Paper>

                <Grid container spacing={3} alignItems="flex-start">
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: '0 6px 24px rgba(15, 23, 42, 0.05)',
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.secondary', letterSpacing: 0.4 }}>
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
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleVideoComplete}
                                            disabled={isMarkingComplete || hasMarkedCompleteRef.current}
                                            startIcon={isMarkingComplete ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                                            sx={{ textTransform: 'none', fontWeight: 700, px: 2.5, boxShadow: 'none' }}
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
                                    ) : (
                                        <Button component={RouterLink} to="/subscription-plans" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
                                            View subscription plans
                                        </Button>
                                    )}
                                </Alert>
                            )}

                            {video.description && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {video.description}
                                    </Typography>
                                </Box>
                            )}

                            {video.canAccess && video.associatedMaterials && video.associatedMaterials.length > 0 && (
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                        Study materials
                                    </Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <List>
                                        {video.associatedMaterials.map((material) => (
                                            <ListItem
                                                key={material._id}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="download"
                                                        onClick={() => handleDownload(material._id, material.fileName)}
                                                        disabled={isDownloading === material._id}
                                                    >
                                                        {isDownloading === material._id ? <CircularProgress size={24} /> : <DownloadIcon />}
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText primary={material.label} secondary={material.fileName} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    boxShadow: '0 6px 24px rgba(15, 23, 42, 0.05)',
                                }}
                            >
                                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1, color: 'primary.main' }}>
                                    Watch insights
                                </Typography>
                                <Stack spacing={1} sx={{ mt: 1.25 }}>
                                    <Chip icon={<PlayLessonOutlinedIcon />} label={`Watched: ${video.watchCount ?? 0} time(s)`} variant="outlined" />
                                    <Chip label={`Remaining in cycle: ${video.remainingWatches ?? 0}`} color="info" variant="outlined" />
                                </Stack>
                            </Paper>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
                                }}
                            >
                            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1, color: 'primary.main', display: 'block', mb: 0.75 }}>
                                Course navigation
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 340, lineHeight: 1.5 }}>
                                Move through the full course without going back in the browser.
                            </Typography>

                            {navLoading ? (
                                <Stack spacing={1.5}>
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

                                    <Stack spacing={1} sx={{ mb: 2.5 }}>
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
                                                    minHeight: 48,
                                                    '&:hover': { boxShadow: '0 4px 12px rgba(25, 118, 210, 0.24)' },
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
                                                    minHeight: 48,
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                }}
                                            >
                                                All lessons in this module
                                            </Button>
                                        )}
                                    </Stack>

                                    {navTotal > 0 && navIndex >= 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                            <Chip
                                                icon={<AutoAwesomeIcon sx={{ fontSize: '16px !important' }} />}
                                                label={`Lesson ${navIndex + 1} of ${navTotal}`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ fontWeight: 700, px: 0.25, height: 38, borderRadius: 999 }}
                                            />
                                        </Box>
                                    )}

                                    {navTotal > 0 && navIndex < 0 && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            This video is not part of the ordered lesson list for this course. Use the buttons above to browse the
                                            course or module.
                                        </Alert>
                                    )}

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
                                        {prevItem ? (
                                            <Button
                                                component={RouterLink}
                                                to={`/videos/${prevItem._id}`}
                                                variant="outlined"
                                                fullWidth
                                                aria-label={`Previous lesson: ${prevItem.title}`}
                                                startIcon={<ChevronLeftIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    py: 1.25,
                                                    minHeight: 48,
                                                    borderRadius: 1.5,
                                                    boxShadow: 'none',
                                                }}
                                            >
                                                Previous
                                            </Button>
                                        ) : (
                                            <Button variant="outlined" fullWidth disabled startIcon={<ChevronLeftIcon />} sx={{ py: 1.25, minHeight: 48, borderRadius: 1.5 }}>
                                                Previous
                                            </Button>
                                        )}
                                        {nextItem ? (
                                            <Button
                                                component={RouterLink}
                                                to={`/videos/${nextItem._id}`}
                                                variant="contained"
                                                fullWidth
                                                aria-label={`Next lesson: ${nextItem.title}`}
                                                endIcon={<ChevronRightIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    py: 1.25,
                                                    minHeight: 48,
                                                    borderRadius: 1.5,
                                                    boxShadow: 'none',
                                                    '&:hover': { boxShadow: '0 4px 12px rgba(25, 118, 210, 0.24)' },
                                                }}
                                            >
                                                Next
                                            </Button>
                                        ) : (
                                            <Button variant="contained" fullWidth disabled endIcon={<ChevronRightIcon />} sx={{ py: 1.25, minHeight: 48, borderRadius: 1.5 }}>
                                                Next
                                            </Button>
                                        )}
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                                        Up next in this module
                                    </Typography>

                                    {navIndex >= 0 && nextThree.length === 0 && navTotal > 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            You are on the last lesson in this sequence.
                                        </Typography>
                                    )}

                                    {navTotal === 1 && navIndex === 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            This is the only published lesson in this sequence.
                                        </Typography>
                                    )}

                                    {navIndex < 0 && navFlat.length > 0 && (
                                        <Stack spacing={1}>
                                            {navFlat.slice(0, 3).map((v) => (
                                                <CourseNavRow key={v._id} item={v} currentId={videoId} />
                                            ))}
                                        </Stack>
                                    )}

                                    {nextThree.length > 0 && (
                                        <Stack spacing={1.5}>
                                            {nextThree.map((v) => (
                                                <CourseNavRow key={v._id} item={v} currentId={videoId} />
                                            ))}
                                        </Stack>
                                    )}

                                    {!navLoading && navFlat.length === 0 && !outlineCourseId && !contextModuleId && (
                                        <Typography variant="body2" color="text.secondary">
                                            This video is not linked to a course module, so lesson-to-lesson navigation is unavailable.
                                        </Typography>
                                    )}
                                </>
                            )}
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar
                open={!!completionMessage}
                autoHideDuration={6000}
                onClose={() => setCompletionMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setCompletionMessage(null)} severity="success" sx={{ width: '100%' }}>
                    {completionMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

function CourseNavRow({ item, currentId }: { item: CourseNavItem; currentId: string | undefined }) {
    const isCurrent = currentId === item._id;
    const thumb = navThumbUrl(item);

    return (
        <Box
            component={RouterLink}
            to={`/videos/${item._id}`}
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '88px minmax(0, 1fr)', sm: '104px minmax(0, 1fr)' },
                columnGap: { xs: 1.25, sm: 1.75 },
                alignItems: 'center',
                py: { xs: 1.25, sm: 1.5 },
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 2.25,
                px: { xs: 1.25, sm: 1.5 },
                border: '1px solid',
                borderColor: isCurrent ? 'primary.light' : 'divider',
                bgcolor: 'background.paper',
                minHeight: { xs: 88, sm: 102 },
                pointerEvents: isCurrent ? 'none' : 'auto',
                transition: 'all 0.16s ease',
                boxShadow: isCurrent ? '0 0 0 2px rgba(25, 118, 210, 0.12)' : 'none',
                '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.light',
                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.09)',
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <Box
                aria-hidden
                sx={{
                    width: { xs: 88, sm: 104 },
                    height: { xs: 56, sm: 64 },
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    bgcolor: 'grey.200',
                    backgroundImage: `url("${thumb}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
            />
            <Box sx={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                        lineHeight: 1.25,
                        fontSize: { xs: '1rem', sm: '1.02rem' },
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                    }}
                >
                    {item.title}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    display="block"
                    sx={{ fontSize: { xs: '0.79rem', sm: '0.81rem' }, lineHeight: 1.2 }}
                >
                    {item.moduleTitle}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ pt: 0.25 }}>
                    {item.durationSeconds != null && item.durationSeconds > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem', opacity: 0.9 }}>
                            {formatDuration(item.durationSeconds)}
                        </Typography>
                    )}
                    {item.isLocked && (
                        <Chip
                            size="small"
                            icon={<LockOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                            label="Locked"
                            variant="outlined"
                            sx={{ height: 22 }}
                        />
                    )}
                    {item.canAccess === false && !item.isLocked && (
                        <Chip size="small" label="Plan required" color="warning" variant="outlined" sx={{ height: 22 }} />
                    )}
                </Stack>
            </Box>
        </Box>
    );
}

export default VideoWatchPage;
