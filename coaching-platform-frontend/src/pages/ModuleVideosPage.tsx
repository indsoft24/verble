import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Typography,
    CircularProgress,
    Alert,
    Box,
    Chip,
    Button,
    Snackbar,
    Stack,
} from '@mui/material';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import parse from 'html-react-parser';

import { getPublishedModuleWithVideosForUser, type ModuleDetailUser, type VideoListItemForModulePage } from '../services/courseUserService';
import {
    getModuleCompletionStatus,
    getModuleQuizAvailability,
    type ModuleCompletionStatus,
    type ModuleQuizAvailability,
} from '../services/moduleQuizService';
import { extractId } from '../utils/idUtils';
import { getSplashImageUrl, resolveBackendMediaUrl, getImageUrl } from '../utils/imageUtils';
import {
    CourseLearningShell,
    CourseLearningBand,
    CourseLearningBreadcrumbs,
    CourseLearningHero,
    CourseBottomNav,
    CourseLessonRow,
    ModuleQuizCallout,
    courseLearningTheme,
    courseBottomNavZIndex,
    courseTiptapSx,
    courseChipOutlinedSx,
    courseChipSuccessSx,
    courseChipWarningSx,
} from '../components/course';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';

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

    useUserLayoutPage({
        title: moduleDetails?.title || 'Module Videos',
        variant: 'learning',
    });
    const [videos, setVideos] = useState<VideoListItemForModulePage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState | null>(null);
    const [completionStatus, setCompletionStatus] = useState<ModuleCompletionStatus | null>(null);
    const [quizGate, setQuizGate] = useState<ModuleQuizAvailability | null>(null);
    const [isModuleLocked, setIsModuleLocked] = useState(false);
    const [moduleLockReason, setModuleLockReason] = useState<string | null>(null);
    const [previousModuleId, setPreviousModuleId] = useState<string | null>(null);
    const [watchLimitMeta, setWatchLimitMeta] = useState<{ maxWatchesPerVideo?: number }>({});

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
            setWatchLimitMeta({
                maxWatchesPerVideo: pageData.maxWatchesPerVideo ?? pageData.maxWatchesPerCycle,
            });
            try {
                const [completion, availability] = await Promise.all([
                    getModuleCompletionStatus(moduleId),
                    getModuleQuizAvailability(moduleId),
                ]);
                setCompletionStatus(completion);
                setQuizGate(availability);
            } catch {
                setCompletionStatus(null);
                setQuizGate(null);
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
                message: video.accessReason || 'You have used all watches for this lesson.',
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
            <CourseLearningShell>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, gap: 2 }}>
                        <CircularProgress size={28} sx={{ color: courseLearningTheme.accent }} />
                        <Typography sx={{ color: courseLearningTheme.textMuted }}>Loading lessons…</Typography>
                    </Box>
                </CourseLearningShell>
        );
    }

    if (error) {
        return (
            <CourseLearningShell maxWidth="sm">
                    <Alert severity="error" action={<Button onClick={fetchModuleData}>Retry</Button>}>
                        {error}
                    </Alert>
                </CourseLearningShell>
        );
    }

    if (!moduleDetails) {
        return (
            <CourseLearningShell maxWidth="sm">
                    <Alert severity="info">This module is not available.</Alert>
                </CourseLearningShell>
        );
    }

    const parentCourse = moduleDetails.course;
    const courseId = parentCourse && typeof parentCourse === 'object' ? extractId(parentCourse) || (parentCourse as { _id?: string })._id : undefined;
    const courseTitle = typeof parentCourse === 'object' ? parentCourse.title : undefined;
    const playableCount = videos.filter((v) => !v.isLocked && v.canAccess !== false && !v.lockReason).length;
    const sortedVideos = [...videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const backTo = courseId ? `/courses/${courseId}` : '/my-courses';

    return (
        <>
        <CourseLearningShell>
                <CourseLearningBreadcrumbs
                    items={[
                        { label: 'My Courses', to: '/my-courses' },
                        ...(courseId && courseTitle ? [{ label: courseTitle, to: `/courses/${courseId}` }] : []),
                        { label: moduleDetails.title },
                    ]}
                />

                <CourseLearningBand headerLabel="MODULE" subtitle={courseTitle ? `Part of ${courseTitle}` : undefined}>
                    <CourseLearningHero
                        imageUrl={
                            moduleDetails.image
                                ? getImageUrl(moduleDetails.image, 'module')
                                : getSplashImageUrl()
                        }
                        imageAlt={moduleDetails.title}
                        onImageError={(e) => {
                            (e.target as HTMLImageElement).src = getSplashImageUrl();
                        }}
                        title={moduleDetails.title}
                        meta={
                            <>
                                {videos.length > 0 && (
                                    <>
                                        <Chip
                                            size="small"
                                            icon={
                                                <VideoLibraryOutlinedIcon
                                                    sx={{ fontSize: 16, color: courseLearningTheme.accent }}
                                                />
                                            }
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
                                    </>
                                )}
                                {completionStatus && (
                                    <>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            label={`Videos ${completionStatus.videosCompleted}/${completionStatus.totalVideos}`}
                                            sx={
                                                completionStatus.videosComplete
                                                    ? courseChipSuccessSx
                                                    : courseChipOutlinedSx
                                            }
                                        />
                                        {completionStatus.hasQuiz && (
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={
                                                    completionStatus.quizPassed
                                                        ? 'Quiz passed'
                                                        : quizGate?.quizState === 'ready'
                                                          ? 'Quiz ready'
                                                          : 'Quiz pending'
                                                }
                                                sx={
                                                    completionStatus.quizPassed
                                                        ? courseChipSuccessSx
                                                        : quizGate?.quizState === 'ready'
                                                          ? courseChipWarningSx
                                                          : courseChipOutlinedSx
                                                }
                                            />
                                        )}
                                        {completionStatus.isCompleted && (
                                            <Chip size="small" label="Complete" variant="outlined" sx={courseChipSuccessSx} />
                                        )}
                                    </>
                                )}
                            </>
                        }
                        description={
                            moduleDetails.description ? (
                                <Box sx={{ pt: courseLearningTheme.space.gapMd }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 700,
                                            mb: 0.5,
                                            color: courseLearningTheme.textSecondary,
                                            fontSize: '0.8125rem',
                                        }}
                                    >
                                        About this module
                                    </Typography>
                                    <Box className="tiptap-rendered-content" sx={courseTiptapSx}>
                                        {parse(moduleDetails.description)}
                                    </Box>
                                </Box>
                            ) : undefined
                        }
                    />
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

                {watchLimitMeta.maxWatchesPerVideo != null && !isModuleLocked && (
                    <Typography
                        variant="caption"
                        sx={{ display: 'block', mb: courseLearningTheme.sectionGap, color: courseLearningTheme.textSecondary }}
                    >
                        Up to {watchLimitMeta.maxWatchesPerVideo} watches per lesson. Completed lessons stay unlocked.
                    </Typography>
                )}

                <CourseLearningBand
                    headerLabel="LESSONS"
                    subtitle="Work top to bottom — each lesson unlocks the next and stays available once completed."
                >
                    {videos.length === 0 ? (
                        <Typography sx={{ color: courseLearningTheme.textMuted, textAlign: 'center', py: 2 }}>
                            No lessons have been published for this module yet.
                        </Typography>
                    ) : (
                        <Stack component="ol" sx={{ listStyle: 'none', m: 0, p: 0, width: '100%', gap: courseLearningTheme.listRowGap }}>
                            {sortedVideos.map((video, index) => (
                                    <Box
                                        component="li"
                                        key={video._id}
                                        sx={{
                                            borderRadius: `${courseLearningTheme.borderRadius}px`,
                                            border: courseLearningTheme.tileBorder(),
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <CourseLessonRow
                                            video={video}
                                            index={index}
                                            thumbUrl={getVideoThumbUrl(video)}
                                            splashUrl={getSplashImageUrl()}
                                            formatDuration={formatDuration}
                                            onRowClick={handleVideoCardClick}
                                            onWatch={(id) => navigate(`/videos/${id}`)}
                                        />
                                    </Box>
                            ))}
                        </Stack>
                    )}
                </CourseLearningBand>

                {quizGate && moduleId && <ModuleQuizCallout moduleId={moduleId} gate={quizGate} />}
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
        </>
    );
};

export default ModuleVideosPage;
