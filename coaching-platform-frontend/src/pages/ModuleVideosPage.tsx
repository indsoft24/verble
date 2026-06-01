import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Box,
    Chip,
    Button,
    Snackbar,
    Stack,
    alpha,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import parse from 'html-react-parser';

import { getPublishedModuleWithVideosForUser, type ModuleDetailUser, type VideoListItemForModulePage } from '../services/courseUserService';
import {
    getModuleCompletionStatus,
    getModuleQuizAvailability,
    type ModuleCompletionStatus,
} from '../services/moduleQuizService';
import { extractId } from '../utils/idUtils';
import { getSplashImageUrl, resolveBackendMediaUrl, getImageUrl } from '../utils/imageUtils';
import UserLayout from '../components/layout/UserLayout';
import {
    CourseLearningShell,
    CourseLearningBand,
    CourseLearningBreadcrumbs,
    CourseBottomNav,
    courseLearningTheme,
    courseBottomNavZIndex,
    courseTiptapSx,
    courseChipOutlinedSx,
    courseChipSuccessSx,
    courseChipWarningSx,
} from '../components/course';

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

type ToastState = {
    message: string;
    severity: 'info' | 'warning' | 'error';
    action?: { label: string; to: string };
};

const ModuleVideosPage: React.FC = () => {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [moduleDetails, setModuleDetails] = useState<ModuleDetailUser | null>(null);
    const [videos, setVideos] = useState<VideoListItemForModulePage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState | null>(null);
    const [completionStatus, setCompletionStatus] = useState<ModuleCompletionStatus | null>(null);
    const [quizAvailable, setQuizAvailable] = useState(false);
    const [isModuleLocked, setIsModuleLocked] = useState(false);
    const [moduleLockReason, setModuleLockReason] = useState<string | null>(null);
    const [previousModuleId, setPreviousModuleId] = useState<string | null>(null);
    const [cycleMeta, setCycleMeta] = useState<{ completionCycle?: number; maxWatchesPerCycle?: number; maxModuleCycles?: number }>({});

    const getVideoThumbUrl = (video: VideoListItemForModulePage): string => {
        if (video.thumbnailUrl) {
            return resolveBackendMediaUrl(video.thumbnailUrl);
        }
        return getSplashImageUrl();
    };

    const fetchModuleData = useCallback(async () => {
        if (!moduleId) {
            setError('Module ID not found in URL.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const pageData = await getPublishedModuleWithVideosForUser(moduleId);
            setModuleDetails(pageData.module);
            setVideos(pageData.videos || []);
            setIsModuleLocked(Boolean(pageData.isModuleLocked));
            setModuleLockReason(pageData.moduleLockReason || null);
            setPreviousModuleId(pageData.previousModuleId || null);
            setCycleMeta({
                completionCycle: pageData.completionCycle,
                maxWatchesPerCycle: pageData.maxWatchesPerCycle,
                maxModuleCycles: pageData.maxModuleCycles,
            });
            try {
                const [completion, availability] = await Promise.all([
                    getModuleCompletionStatus(moduleId),
                    getModuleQuizAvailability(moduleId),
                ]);
                setCompletionStatus(completion);
                setQuizAvailable(availability.canTakeQuiz);
            } catch {
                setCompletionStatus(null);
                setQuizAvailable(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load module content.');
            setVideos([]);
        } finally {
            setIsLoading(false);
        }
    }, [moduleId]);

    useEffect(() => {
        fetchModuleData();
    }, [fetchModuleData]);

    useEffect(() => {
        const state = location.state as { toast?: ToastState } | null;
        if (!state?.toast) return;
        setToast(state.toast);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const handleVideoCardClick = (video: VideoListItemForModulePage) => {
        const videoId = extractId(video) || video._id;
        if (!videoId) {
            return;
        }

        if (video.lockReason === 'subscription') {
            setToast({
                message: 'An active subscription is required to watch this lesson.',
                severity: 'warning',
                action: { label: 'View plans', to: '/subscription-plans' },
            });
            return;
        }

        if (video.lockReason === 'watch_limit') {
            setToast({
                message:
                    video.accessReason ||
                    `You have used all watches for this lesson in cycle ${(video.completionCycle ?? 0) + 1}.`,
                severity: 'info',
            });
            return;
        }

        if (video.isLocked || video.lockReason === 'sequence') {
            setToast({
                message: video.accessReason || 'Complete the previous lesson to unlock this one.',
                severity: 'info',
            });
            return;
        }

        if (video.canAccess === false) {
            setToast({
                message: video.accessReason || 'This lesson is not available yet.',
                severity: 'info',
            });
            return;
        }

        navigate(`/videos/${videoId}`);
    };

    if (isLoading) {
        return (
            <UserLayout title="Module Videos" variant="learning">
                <CourseLearningShell>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, gap: 2 }}>
                        <CircularProgress size={28} sx={{ color: courseLearningTheme.accent }} />
                        <Typography sx={{ color: courseLearningTheme.textMuted }}>Loading lessons…</Typography>
                    </Box>
                </CourseLearningShell>
            </UserLayout>
        );
    }

    if (error) {
        return (
            <UserLayout title="Module Videos" variant="learning">
                <CourseLearningShell maxWidth="sm">
                    <Alert severity="error" action={<Button onClick={fetchModuleData}>Retry</Button>}>
                        {error}
                    </Alert>
                </CourseLearningShell>
            </UserLayout>
        );
    }

    if (!moduleDetails) {
        return (
            <UserLayout title="Module Videos" variant="learning">
                <CourseLearningShell maxWidth="sm">
                    <Alert severity="info">This module is not available.</Alert>
                </CourseLearningShell>
            </UserLayout>
        );
    }

    const parentCourse = moduleDetails.course;
    const courseId = parentCourse && typeof parentCourse === 'object' ? extractId(parentCourse) || (parentCourse as { _id?: string })._id : undefined;
    const courseTitle = typeof parentCourse === 'object' ? parentCourse.title : undefined;
    const playableCount = videos.filter((v) => !v.isLocked && v.canAccess !== false && !v.lockReason).length;
    const sortedVideos = [...videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const backTo = courseId ? `/courses/${courseId}` : '/my-courses';

    return (
        <UserLayout title={moduleDetails.title || 'Module Videos'} variant="learning">
            <CourseLearningShell>
                <CourseLearningBreadcrumbs
                    items={[
                        { label: 'My Courses', to: '/my-courses' },
                        ...(courseId && courseTitle ? [{ label: courseTitle, to: `/courses/${courseId}` }] : []),
                        { label: moduleDetails.title },
                    ]}
                />

                <CourseLearningBand headerLabel="MODULE" subtitle={courseTitle ? `Part of ${courseTitle}` : undefined}>
                    <Grid container spacing={1.5} sx={{ width: '100%', alignItems: 'stretch' }}>
                        {moduleDetails.image ? (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Box
                                    sx={{
                                        borderRadius: 1.5,
                                        overflow: 'hidden',
                                        height: { xs: 140, sm: '100%' },
                                        minHeight: { sm: 120 },
                                        bgcolor: courseLearningTheme.surfaceRaised,
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={getImageUrl(moduleDetails.image, 'module')}
                                        alt={moduleDetails.title}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = getSplashImageUrl();
                                        }}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                </Box>
                            </Grid>
                        ) : null}
                        <Grid size={{ xs: 12, sm: moduleDetails.image ? 8 : 12 }}>
                            <Stack spacing={1}>
                                <Typography
                                    variant="h5"
                                    component="h1"
                                    sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.25,
                                        fontSize: { xs: '1.2rem', sm: '1.35rem' },
                                        color: courseLearningTheme.textPrimary,
                                    }}
                                >
                                    {moduleDetails.title}
                                </Typography>
                                {videos.length > 0 && (
                                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                        <Chip
                                            size="small"
                                            icon={<VideoLibraryOutlinedIcon sx={{ fontSize: 16, color: courseLearningTheme.accent }} />}
                                            label={`${videos.length} lesson${videos.length === 1 ? '' : 's'}`}
                                            variant="outlined"
                                            sx={courseChipOutlinedSx}
                                        />
                                        {playableCount > 0 && playableCount < videos.length && (
                                            <Chip
                                                size="small"
                                                label={`${playableCount} available`}
                                                variant="outlined"
                                                sx={{ ...courseChipOutlinedSx, color: courseLearningTheme.textSecondary }}
                                            />
                                        )}
                                    </Stack>
                                )}
                                {completionStatus && (
                                    <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center" sx={{ pt: 0.25 }}>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            label={`Videos ${completionStatus.videosCompleted}/${completionStatus.totalVideos}`}
                                            sx={completionStatus.videosComplete ? courseChipSuccessSx : courseChipOutlinedSx}
                                        />
                                        {completionStatus.hasQuiz && (
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={completionStatus.quizPassed ? 'Quiz passed' : 'Quiz pending'}
                                                sx={completionStatus.quizPassed ? courseChipSuccessSx : courseChipWarningSx}
                                            />
                                        )}
                                        {completionStatus.isCompleted && (
                                            <Chip size="small" label="Complete" variant="outlined" sx={courseChipSuccessSx} />
                                        )}
                                        {quizAvailable && moduleId && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => navigate(`/modules/${moduleId}/quiz`)}
                                                sx={{
                                                    py: 0.25,
                                                    minHeight: 28,
                                                    fontSize: '0.75rem',
                                                    bgcolor: courseLearningTheme.accent,
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    boxShadow: 'none',
                                                    '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.88) },
                                                }}
                                            >
                                                Take quiz
                                            </Button>
                                        )}
                                    </Stack>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>

                    {moduleDetails.description ? (
                        <Box sx={{ mt: 1.25, pt: 1.25, borderTop: `1px solid ${alpha(courseLearningTheme.accent, 0.2)}` }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, mb: 0.5, color: courseLearningTheme.textSecondary, fontSize: '0.8125rem' }}
                            >
                                About this module
                            </Typography>
                            <Box className="tiptap-rendered-content" sx={courseTiptapSx}>
                                {parse(moduleDetails.description)}
                            </Box>
                        </Box>
                    ) : null}
                </CourseLearningBand>

                {isModuleLocked && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1.5 }}
                        action={
                            previousModuleId ? (
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => navigate(`/modules/${previousModuleId}/videos`)}
                                >
                                    Go to previous module
                                </Button>
                            ) : undefined
                        }
                    >
                        {moduleLockReason || 'Complete the previous module to unlock this one.'}
                    </Alert>
                )}

                {cycleMeta.maxModuleCycles != null && !isModuleLocked && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: courseLearningTheme.textSecondary }}>
                        Cycle {(cycleMeta.completionCycle ?? 0) + 1} of {cycleMeta.maxModuleCycles}
                        {cycleMeta.maxWatchesPerCycle != null
                            ? ` · Up to ${cycleMeta.maxWatchesPerCycle} watches per lesson this cycle`
                            : ''}
                    </Typography>
                )}

                <CourseLearningBand
                    headerLabel="LESSONS"
                    subtitle="Work top to bottom — locked lessons unlock after the previous one."
                >
                    {videos.length === 0 ? (
                        <Typography sx={{ color: courseLearningTheme.textMuted, textAlign: 'center', py: 2 }}>
                            No lessons have been published for this module yet.
                        </Typography>
                    ) : (
                        <Stack component="ol" sx={{ listStyle: 'none', m: 0, p: 0, width: '100%' }} spacing={0}>
                            {sortedVideos.map((video, index) => {
                                const locked = Boolean(video.isLocked);
                                const needsPlan = video.lockReason === 'subscription';
                                const watchLimited = video.lockReason === 'watch_limit';
                                const sequenceLocked = video.lockReason === 'sequence';
                                const disabled = locked || needsPlan || watchLimited || sequenceLocked;
                                const vid = extractId(video) || video._id;

                                return (
                                    <Box
                                        component="li"
                                        key={video._id}
                                        sx={{
                                            borderBottom: `1px solid ${alpha(courseLearningTheme.accent, 0.2)}`,
                                            '&:last-of-type': { borderBottom: 'none' },
                                        }}
                                    >
                                        <Box
                                            className="module-lesson-row"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleVideoCardClick(video)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleVideoCardClick(video);
                                                }
                                            }}
                                            sx={{
                                                width: '100%',
                                                maxWidth: '100%',
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { sm: 'stretch' },
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                bgcolor: courseLearningTheme.tileBg,
                                                transition: 'background-color 0.15s ease',
                                                outline: 'none',
                                                '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.12) },
                                                '&:focus-visible': { boxShadow: courseLearningTheme.focusRing },
                                            }}
                                        >
                                            {/* Thumbnail — fixed width on desktop so row always reads clearly */}
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    width: { xs: '100%', sm: 180, md: 200 },
                                                    flexShrink: 0,
                                                    alignSelf: { xs: 'stretch', sm: 'auto' },
                                                    aspectRatio: '16 / 9',
                                                    bgcolor: 'grey.900',
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={getVideoThumbUrl(video)}
                                                    alt={video.title}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = getSplashImageUrl();
                                                    }}
                                                    sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <Chip
                                                    label={`${index + 1}`}
                                                    size="small"
                                                    aria-hidden
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        left: 8,
                                                        minWidth: 28,
                                                        fontWeight: 800,
                                                        bgcolor: courseLearningTheme.accent,
                                                        color: '#fff',
                                                        border: 'none',
                                                        '& .MuiChip-label': { px: 0.75 },
                                                    }}
                                                />
                                                {video.durationSeconds != null && video.durationSeconds > 0 && (
                                                    <Chip
                                                        label={formatDuration(video.durationSeconds)}
                                                        size="small"
                                                        icon={<AccessTimeIcon sx={{ color: 'common.white !important', fontSize: '14px !important' }} />}
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 8,
                                                            right: 8,
                                                            fontWeight: 600,
                                                            bgcolor: 'rgba(15, 23, 42, 0.78)',
                                                            color: 'common.white',
                                                            border: 'none',
                                                            '& .MuiChip-icon': { ml: 0.5 },
                                                        }}
                                                    />
                                                )}
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: disabled ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.22)',
                                                        opacity: disabled ? 1 : 0.88,
                                                        transition: 'opacity 0.2s ease',
                                                        '@media (hover: hover)': {
                                                            '.module-lesson-row:hover &': { opacity: 1 },
                                                        },
                                                    }}
                                                >
                                                    {disabled ? (
                                                        <LockOutlinedIcon sx={{ fontSize: 40, color: 'common.white' }} />
                                                    ) : (
                                                        <PlayArrowIcon sx={{ fontSize: 48, color: 'common.white', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
                                                    )}
                                                </Box>
                                            </Box>

                                            <Stack
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={2}
                                                alignItems={{ xs: 'stretch', sm: 'center' }}
                                                justifyContent="space-between"
                                                sx={{ flex: 1, minWidth: 0, p: { xs: 1.25, sm: 1.5 }, gap: 1 }}
                                            >
                                                <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                                                    <Typography
                                                        variant="overline"
                                                        sx={{ color: courseLearningTheme.accent, fontWeight: 700, letterSpacing: 0.5 }}
                                                    >
                                                        Lesson {index + 1}
                                                    </Typography>
                                                    <Typography
                                                        variant="h6"
                                                        component="h3"
                                                        sx={{
                                                            fontWeight: 800,
                                                            lineHeight: 1.3,
                                                            mt: 0.25,
                                                            wordBreak: 'break-word',
                                                            color: courseLearningTheme.textPrimary,
                                                        }}
                                                    >
                                                        {video.title}
                                                    </Typography>
                                                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.25 }}>
                                                        {sequenceLocked && (
                                                            <Chip
                                                                label={video.accessReason || 'Complete previous lesson'}
                                                                size="small"
                                                                variant="outlined"
                                                                icon={<LockOutlinedIcon sx={{ fontSize: 14, color: courseLearningTheme.textSecondary }} />}
                                                                sx={{ ...courseChipOutlinedSx, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal' } }}
                                                            />
                                                        )}
                                                        {watchLimited && (
                                                            <Chip
                                                                label={video.accessReason || 'Watch limit reached'}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={courseChipWarningSx}
                                                            />
                                                        )}
                                                        {needsPlan && (
                                                            <Chip
                                                                label="Subscription required"
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate('/subscription-plans');
                                                                }}
                                                                sx={courseChipWarningSx}
                                                            />
                                                        )}
                                                        {!disabled && (
                                                            <Chip label="Ready" size="small" variant="outlined" sx={courseChipSuccessSx} />
                                                        )}
                                                    </Stack>
                                                </Box>

                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    spacing={1}
                                                    sx={{
                                                        flexShrink: 0,
                                                        justifyContent: { xs: 'space-between', sm: 'flex-end' },
                                                    }}
                                                >
                                                    <Button
                                                        variant="contained"
                                                        size="medium"
                                                        disabled={disabled}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (disabled) {
                                                                handleVideoCardClick(video);
                                                                return;
                                                            }
                                                            if (vid) navigate(`/videos/${vid}`);
                                                        }}
                                                        startIcon={locked ? <LockOutlinedIcon /> : needsPlan ? undefined : <PlayArrowIcon />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 800,
                                                            borderRadius: 1.5,
                                                            minWidth: { xs: 'auto', sm: 148 },
                                                            px: 2,
                                                            boxShadow: 'none',
                                                            bgcolor: courseLearningTheme.accent,
                                                            '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.88), boxShadow: 'none' },
                                                        }}
                                                    >
                                                        {needsPlan ? 'View plans' : locked ? 'Locked' : 'Watch'}
                                                    </Button>
                                                    <ChevronRightIcon sx={{ color: 'text.disabled', display: { xs: 'none', sm: 'block' } }} />
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </CourseLearningBand>
            </CourseLearningShell>

            <CourseBottomNav backLabel="Back to Course" backTo={backTo} />

            <Snackbar
                open={toast !== null}
                autoHideDuration={8000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ bottom: { xs: 88, sm: 88 }, zIndex: courseBottomNavZIndex - 1 }}
            >
                {toast !== null ? (
                    <Alert
                        severity={toast.severity}
                        variant="filled"
                        onClose={() => setToast(null)}
                        sx={{ alignItems: 'center', width: '100%', maxWidth: 480 }}
                        action={
                            toast.action ? (
                                <Button
                                    color="inherit"
                                    size="small"
                                    component={RouterLink}
                                    to={toast.action.to}
                                    onClick={() => setToast(null)}
                                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                                >
                                    {toast.action.label}
                                </Button>
                            ) : undefined
                        }
                    >
                        {toast.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </UserLayout>
    );
};

export default ModuleVideosPage;
