import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Box,
    Chip,
    Button,
    Paper,
    Breadcrumbs,
    Link as MuiLink,
    Snackbar,
    Stack,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import parse from 'html-react-parser';

import { getPublishedModuleWithVideosForUser, type ModuleDetailUser, type VideoListItemForModulePage } from '../services/courseUserService';
import { extractId } from '../utils/idUtils';
import { getSplashImageUrl, resolveBackendMediaUrl, getImageUrl } from '../utils/imageUtils';
import UserLayout from '../components/layout/UserLayout';

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

const moduleDescSx = {
    '& p': { typography: 'body1', lineHeight: 1.75, mb: 2, color: 'text.secondary' },
    '& ul, & ol': { pl: 3, mb: 2 },
    '& li': { mb: 0.5, typography: 'body1', lineHeight: 1.75 },
    '& strong': { fontWeight: 700, color: 'text.primary' },
    '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
} as const;

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
            const { module: fetchedModule, videos: fetchedVideos } = await getPublishedModuleWithVideosForUser(moduleId);
            setModuleDetails(fetchedModule);
            setVideos(fetchedVideos || []);
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

        if (video.isLocked) {
            setToast({
                message: video.accessReason || 'Complete the previous lesson to unlock this one.',
                severity: 'info',
            });
            return;
        }

        if (video.canAccess === false) {
            setToast({
                message: 'An active subscription is required to watch this lesson.',
                severity: 'warning',
                action: { label: 'View plans', to: '/subscription-plans' },
            });
            return;
        }

        navigate(`/videos/${videoId}`);
    };

    if (isLoading) {
        return (
            <UserLayout title="Module Videos">
                <Box sx={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <CircularProgress size={28} />
                    <Typography color="text.secondary">Loading lessons…</Typography>
                </Box>
            </UserLayout>
        );
    }

    if (error) {
        return (
            <UserLayout title="Module Videos">
                <Container maxWidth="sm">
                    <Alert severity="error" action={<Button onClick={fetchModuleData}>Retry</Button>}>
                        {error}
                    </Alert>
                </Container>
            </UserLayout>
        );
    }

    if (!moduleDetails) {
        return (
            <UserLayout title="Module Videos">
                <Container maxWidth="sm">
                    <Alert severity="info">This module is not available.</Alert>
                </Container>
            </UserLayout>
        );
    }

    const parentCourse = moduleDetails.course;
    const courseId = parentCourse && typeof parentCourse === 'object' ? extractId(parentCourse) || (parentCourse as { _id?: string })._id : undefined;
    const courseTitle = typeof parentCourse === 'object' ? parentCourse.title : undefined;
    const playableCount = videos.filter((v) => !v.isLocked && v.canAccess !== false).length;
    const sortedVideos = [...videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <UserLayout title={moduleDetails.title || 'Module Videos'}>
        <Box sx={{ pb: { xs: 4, md: 6 } }}>
            <Container maxWidth="lg" disableGutters sx={{ px: { xs: 0, sm: 2 } }}>
                <Breadcrumbs
                    aria-label="breadcrumb"
                    sx={{ mb: 3, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
                >
                    <MuiLink component={RouterLink} underline="hover" color="text.secondary" to="/" sx={{ fontSize: 14 }}>
                        Home
                    </MuiLink>
                    {courseId && courseTitle ? (
                        <MuiLink
                            component={RouterLink}
                            underline="hover"
                            color="text.secondary"
                            to={`/courses/${courseId}`}
                            sx={{ fontSize: 14 }}
                        >
                            {courseTitle}
                        </MuiLink>
                    ) : null}
                    <Typography color="text.primary" sx={{ fontSize: 14, fontWeight: 600 }} noWrap>
                        {moduleDetails.title}
                    </Typography>
                </Breadcrumbs>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)',
                        mb: { xs: 3, md: 4 },
                    }}
                >
                    <Grid container sx={{ width: '100%' }}>
                        {moduleDetails.image ? (
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box
                                    sx={{
                                        height: { xs: 200, md: '100%' },
                                        minHeight: { md: 240 },
                                        bgcolor: 'grey.200',
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
                        <Grid size={{ xs: 12, md: moduleDetails.image ? 8 : 12 }}>
                            <Stack spacing={2} sx={{ p: { xs: 3, sm: 4 } }}>
                                <Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'primary.main', fontWeight: 700 }}>
                                    Module
                                </Typography>
                                <Typography
                                    variant="h4"
                                    component="h1"
                                    sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.75rem', md: '2rem' } }}
                                >
                                    {moduleDetails.title}
                                </Typography>
                                {courseTitle && (
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary', typography: 'body2' }}>
                                        <SchoolOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                        <span>
                                            Part of{' '}
                                            {courseId ? (
                                                <MuiLink component={RouterLink} to={`/courses/${courseId}`} underline="hover" color="primary">
                                                    {courseTitle}
                                                </MuiLink>
                                            ) : (
                                                courseTitle
                                            )}
                                        </span>
                                    </Stack>
                                )}
                                {videos.length > 0 && (
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        <Chip
                                            size="small"
                                            icon={<VideoLibraryOutlinedIcon sx={{ '&&': { fontSize: 18 } }} />}
                                            label={`${videos.length} lesson${videos.length === 1 ? '' : 's'}`}
                                            variant="outlined"
                                            color="primary"
                                            sx={{ fontWeight: 600 }}
                                        />
                                        {playableCount > 0 && playableCount < videos.length && (
                                            <Chip
                                                size="small"
                                                label={`${playableCount} available now`}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Stack>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>

                    {moduleDetails.description ? (
                        <Box
                            sx={{
                                px: { xs: 3, sm: 4 },
                                py: { xs: 2, sm: 3 },
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'grey.50',
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                About this module
                            </Typography>
                            <Box className="tiptap-rendered-content" sx={moduleDescSx}>
                                {parse(moduleDetails.description)}
                            </Box>
                        </Box>
                    ) : null}
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        maxWidth: '100%',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.35rem' } }}>
                            Lessons
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                            Start from the top and work down. Locked lessons unlock when you finish the one before; subscription-only lessons are
                            labelled clearly.
                        </Typography>
                    </Box>

                    {videos.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">No lessons have been published for this module yet.</Typography>
                        </Box>
                    ) : (
                        <Stack component="ol" sx={{ listStyle: 'none', m: 0, p: 0, width: '100%' }} spacing={0}>
                            {sortedVideos.map((video, index) => {
                                const locked = Boolean(video.isLocked);
                                const needsPlan = video.canAccess === false;
                                const disabled = locked || needsPlan;
                                const vid = extractId(video) || video._id;

                                return (
                                    <Box
                                        component="li"
                                        key={video._id}
                                        sx={{
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
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
                                                bgcolor: 'background.paper',
                                                transition: 'background-color 0.15s ease',
                                                outline: 'none',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                '&:focus-visible': { boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}` },
                                            }}
                                        >
                                            {/* Thumbnail — fixed width on desktop so row always reads clearly */}
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    width: { xs: '100%', sm: 220, md: 260 },
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
                                                        bgcolor: 'primary.main',
                                                        color: 'primary.contrastText',
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
                                                sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 2.5 }, gap: 2 }}
                                            >
                                                <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                                                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5 }}>
                                                        Lesson {index + 1}
                                                    </Typography>
                                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, lineHeight: 1.3, mt: 0.25, wordBreak: 'break-word' }}>
                                                        {video.title}
                                                    </Typography>
                                                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.25 }}>
                                                        {locked && (
                                                            <Chip
                                                                label={video.accessReason || 'Locked'}
                                                                size="small"
                                                                variant="outlined"
                                                                icon={<LockOutlinedIcon sx={{ fontSize: '16px !important' }} />}
                                                                sx={{ maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
                                                            />
                                                        )}
                                                        {needsPlan && (
                                                            <Chip
                                                                label="Subscription required"
                                                                size="small"
                                                                color="warning"
                                                                variant="outlined"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate('/subscription-plans');
                                                                }}
                                                                sx={{ fontWeight: 600 }}
                                                            />
                                                        )}
                                                        {!disabled && (
                                                            <Chip label="Ready to watch" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
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
                                                        disabled={locked}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (locked) return;
                                                            if (needsPlan) navigate('/subscription-plans');
                                                            else if (vid) navigate(`/videos/${vid}`);
                                                        }}
                                                        startIcon={locked ? <LockOutlinedIcon /> : needsPlan ? undefined : <PlayArrowIcon />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 800,
                                                            borderRadius: 1.5,
                                                            minWidth: { xs: 'auto', sm: 148 },
                                                            px: 2,
                                                            boxShadow: 'none',
                                                            '&:hover': { boxShadow: 2 },
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
                </Paper>
            </Container>

            <Snackbar
                open={toast !== null}
                autoHideDuration={8000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
        </Box>
        </UserLayout>
    );
};

export default ModuleVideosPage;
