import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Box,
    Paper,
    Button,
    Breadcrumbs,
    Link as MuiLink,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Grid,
    Stack,
    alpha,
} from '@mui/material';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import parse from 'html-react-parser';

import { getPublishedCourseWithModulesForUser, type CourseListItemUser, type ModuleListItemUser } from '../services/courseUserService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';
import UserLayout from '../components/layout/UserLayout';
import {
    CourseLearningShell,
    CourseLearningBand,
    CourseLearningBreadcrumbs,
    CourseLearningHero,
    CourseBottomNav,
    courseLearningTheme,
    courseTiptapSx,
    courseChipOutlinedSx,
} from '../components/course';

const publicContentSx = {
    '& p': { typography: 'body1', lineHeight: 1.75, mb: 2, color: 'text.secondary' },
    '& ul, & ol': { pl: 3, mb: 2 },
    '& li': { mb: 0.5, typography: 'body1', lineHeight: 1.75 },
    '& strong': { fontWeight: 700, color: 'text.primary' },
    '& em': { fontStyle: 'italic' },
    '& u': { textDecoration: 'underline' },
    '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
    '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2.5, mb: 1, fontWeight: 700, color: 'text.primary' },
} as const;

const CourseDetailPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [course, setCourse] = useState<CourseListItemUser | null>(null);
    const [modules, setModules] = useState<ModuleListItemUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPageData = useCallback(async () => {
        if (!courseId) {
            setError('Course ID not found in URL.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const courseData = await getPublishedCourseWithModulesForUser(courseId);
            setCourse(courseData.course);
            setModules(courseData.modules || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load course details.');
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleModuleClick = (module: ModuleListItemUser) => {
        if (module.isModuleLocked) {
            return;
        }
        navigate(`/modules/${module._id}/videos`);
    };

    const moduleCount = course?.moduleCount ?? modules.length;
    const totalVideos = modules.reduce((sum, m) => sum + (m.videoCount ?? 0), 0);

    const renderAuthenticatedCurriculum = () => (
        <CourseLearningBand
            headerLabel="CURRICULUM"
            subtitle="Expand a module, then open lessons when you are ready to study."
        >
            {modules.length === 0 ? (
                <Typography sx={{ color: courseLearningTheme.textMuted, textAlign: 'center', py: 2 }}>
                    Modules for this course will appear here once they are published.
                </Typography>
            ) : (
                <Stack sx={{ gap: courseLearningTheme.accordionGap }}>
                    {modules.map((module, index) => (
                        <Accordion
                            key={module._id}
                            defaultExpanded={index === 0}
                            disableGutters
                            elevation={0}
                            sx={{
                                border: courseLearningTheme.tileBorder(),
                                borderRadius: '12px !important',
                                overflow: 'hidden',
                                bgcolor: courseLearningTheme.tileBg,
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: courseLearningTheme.accent }} />}
                                sx={{
                                    px: courseLearningTheme.accordionSummaryPx,
                                    py: courseLearningTheme.accordionSummaryPy,
                                    minHeight: 56,
                                    '& .MuiAccordionSummary-content': { my: 0.5 },
                                    '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.08) },
                                }}
                            >
                                <Stack direction="row" alignItems="center" sx={{ ...courseLearningTheme.learningRowStackSx }}>
                                    <Box
                                        sx={{
                                            minWidth: 36,
                                            height: 36,
                                            borderRadius: 1,
                                            bgcolor: courseLearningTheme.accent,
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        {index + 1}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 700, lineHeight: 1.3, color: courseLearningTheme.textPrimary }}
                                        >
                                            {module.title}
                                        </Typography>
                                        {module.videoCount != null && module.videoCount > 0 && (
                                            <Typography variant="caption" sx={{ color: courseLearningTheme.textBody }}>
                                                {module.videoCount} lesson{module.videoCount === 1 ? '' : 's'}
                                            </Typography>
                                        )}
                                    </Box>
                                    {module.isModuleLocked ? (
                                        <LockOutlinedIcon sx={{ color: courseLearningTheme.textMuted }} />
                                    ) : (
                                        <OndemandVideoIcon sx={{ color: courseLearningTheme.accent, display: { xs: 'none', sm: 'block' } }} />
                                    )}
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails
                                sx={{
                                    px: courseLearningTheme.accordionDetailsPx,
                                    py: courseLearningTheme.accordionDetailsPy,
                                    borderTop: `1px solid ${alpha(courseLearningTheme.accent, 0.2)}`,
                                }}
                            >
                                <Box className="tiptap-rendered-content" sx={{ ...courseTiptapSx, mb: 2 }}>
                                    {module.description ? (
                                        parse(module.description)
                                    ) : (
                                        <Typography variant="body2" sx={{ color: courseLearningTheme.textMuted }}>
                                            No outline has been added for this module yet.
                                        </Typography>
                                    )}
                                </Box>
                                {module.isModuleLocked && module.moduleLockReason && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: courseLearningTheme.textSecondary,
                                            mb: 2,
                                            lineHeight: 1.55,
                                            maxWidth: 560,
                                        }}
                                    >
                                        {module.moduleLockReason}
                                    </Typography>
                                )}
                                {module.isModuleLocked && module.previousModuleId ? (
                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        flexWrap="wrap"
                                        sx={{ gap: courseLearningTheme.space.gap, mt: courseLearningTheme.space.blockMt }}
                                    >
                                        <Button
                                            variant="outlined"
                                            size="medium"
                                            onClick={() => navigate(`/modules/${module.previousModuleId}/videos`)}
                                            sx={{ textTransform: 'none', fontWeight: 700 }}
                                        >
                                            Go to previous module
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="medium"
                                            onClick={() => navigate(`/modules/${module.previousModuleId}/quiz`)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                bgcolor: courseLearningTheme.accent,
                                                boxShadow: 'none',
                                            }}
                                        >
                                            Take previous quiz
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        disabled={module.isModuleLocked}
                                        onClick={() => handleModuleClick(module)}
                                        startIcon={module.isModuleLocked ? <LockOutlinedIcon /> : <PlayCircleOutlineIcon />}
                                        sx={{
                                            borderRadius: 1.5,
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            bgcolor: module.isModuleLocked ? courseLearningTheme.surfaceRaised : courseLearningTheme.accent,
                                            color: module.isModuleLocked ? courseLearningTheme.textMuted : '#fff',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                bgcolor: module.isModuleLocked
                                                    ? courseLearningTheme.surfaceRaised
                                                    : alpha(courseLearningTheme.accent, 0.88),
                                                boxShadow: 'none',
                                            },
                                        }}
                                    >
                                        {module.isModuleLocked ? 'Locked' : 'Open lessons'}
                                    </Button>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            )}
        </CourseLearningBand>
    );

    if (isLoading) {
        if (isAuthenticated) {
            return (
                <UserLayout title="Course" variant="learning">
                    <CourseLearningShell>
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, gap: 2 }}>
                            <CircularProgress sx={{ color: courseLearningTheme.accent }} size={28} />
                            <Typography sx={{ color: courseLearningTheme.textMuted }}>Loading course…</Typography>
                        </Box>
                    </CourseLearningShell>
                </UserLayout>
            );
        }
        return (
            <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress size={28} />
                <Typography color="text.secondary">Loading course…</Typography>
            </Box>
        );
    }

    if (error || !course) {
        const msg = error || 'This course is not available.';
        if (isAuthenticated) {
            return (
                <UserLayout title="Course" variant="learning">
                    <CourseLearningShell maxWidth="sm">
                        <Alert severity="error" action={error ? <Button onClick={fetchPageData}>Retry</Button> : undefined}>
                            {msg}
                        </Alert>
                    </CourseLearningShell>
                    <CourseBottomNav backLabel="Back to My Courses" backTo="/my-courses" />
                </UserLayout>
            );
        }
        return (
            <Container maxWidth="sm" sx={{ mt: 6 }}>
                <Alert severity={error ? 'error' : 'info'} action={error ? <Button onClick={fetchPageData}>Retry</Button> : undefined}>
                    {msg}
                </Alert>
            </Container>
        );
    }

    const examSlug = typeof course.examCategory === 'object' ? course.examCategory.slug : '';
    const examName = typeof course.examCategory === 'object' ? course.examCategory.name : 'Category';

    if (isAuthenticated) {
        return (
            <UserLayout title={course.title} variant="learning">
                <CourseLearningShell>
                    <CourseLearningBreadcrumbs
                        items={[
                            { label: 'My Courses', to: '/my-courses' },
                            { label: course.title },
                        ]}
                    />

                    <CourseLearningBand headerLabel="FULL COURSE" ribbon="ULTIMATE">
                        <CourseLearningHero
                            imageUrl={course.image ? getImageUrl(course.image, 'course') : getSplashImageUrl()}
                            imageAlt={course.title}
                            onImageError={(e) => {
                                (e.target as HTMLImageElement).src = getSplashImageUrl();
                            }}
                            title={course.title}
                            meta={
                                <>
                                    {typeof course.examCategory === 'object' && course.examCategory && (
                                        <Chip
                                            icon={<SchoolIcon sx={{ fontSize: 16, color: courseLearningTheme.accent }} />}
                                            label={course.examCategory.name}
                                            size="small"
                                            variant="outlined"
                                            sx={courseChipOutlinedSx}
                                        />
                                    )}
                                    {moduleCount > 0 && (
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            sx={{ gap: courseLearningTheme.space.gap, color: courseLearningTheme.textMuted }}
                                        >
                                            <VideoLibraryOutlinedIcon sx={{ fontSize: 20, color: courseLearningTheme.accent }} />
                                            <Typography variant="body2">
                                                {moduleCount} module{moduleCount === 1 ? '' : 's'}
                                                {totalVideos > 0
                                                    ? ` · ${totalVideos} lesson${totalVideos === 1 ? '' : 's'}`
                                                    : ''}
                                            </Typography>
                                        </Stack>
                                    )}
                                </>
                            }
                        />
                    </CourseLearningBand>

                    <CourseLearningBand headerLabel="OVERVIEW" subtitle="What you will cover in this program.">
                        <Typography
                            variant="subtitle2"
                            component="h2"
                            sx={{
                                fontWeight: 700,
                                m: courseLearningTheme.space.gap,
                                mt: courseLearningTheme.space.sectionMt,
                                color: courseLearningTheme.textSecondary,
                                fontSize: '0.875rem',
                            }}
                        >
                            About this course
                        </Typography>
                        <Box className="tiptap-rendered-content" sx={courseTiptapSx}>
                            {course.description ? (
                                parse(course.description)
                            ) : (
                                <Typography sx={{ color: courseLearningTheme.textBody, lineHeight: 1.6 }}>
                                    A full description will appear here when it is added for this program.
                                </Typography>
                            )}
                        </Box>
                    </CourseLearningBand>

                    {renderAuthenticatedCurriculum()}
                </CourseLearningShell>
                <CourseBottomNav backLabel="Back to My Courses" backTo="/my-courses" />
            </UserLayout>
        );
    }

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: { xs: 6, md: 8 } }}>
            <Container maxWidth="lg" sx={{ pt: { xs: 2, sm: 3 }, pb: 1 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}>
                    <MuiLink component={RouterLink} underline="hover" color="text.secondary" to="/" sx={{ fontSize: 14 }}>
                        Home
                    </MuiLink>
                    {examSlug ? (
                        <MuiLink component={RouterLink} underline="hover" color="text.secondary" to={`/exams/${examSlug}`} sx={{ fontSize: 14 }}>
                            {examName}
                        </MuiLink>
                    ) : (
                        <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                            {examName}
                        </Typography>
                    )}
                    <Typography color="text.primary" sx={{ fontSize: 14, fontWeight: 600, maxWidth: 280 }} noWrap>
                        {course.title}
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
                    }}
                >
                    <Grid container>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ position: 'relative', height: { xs: 220, sm: 280, md: '100%' }, minHeight: { md: 320 }, bgcolor: 'grey.200' }}>
                                <Box
                                    component="img"
                                    src={course.image ? getImageUrl(course.image, 'course') : getSplashImageUrl()}
                                    alt={course.title}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = getSplashImageUrl();
                                    }}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Stack spacing={2} sx={{ p: { xs: 3, sm: 4 }, height: '100%', justifyContent: 'center' }}>
                                <Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'primary.main', fontWeight: 700 }}>
                                    Course
                                </Typography>
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2rem' } }}>
                                    {course.title}
                                </Typography>
                                {typeof course.examCategory === 'object' && course.examCategory && (
                                    <Chip
                                        icon={<SchoolIcon sx={{ fontSize: 18 }} />}
                                        label={course.examCategory.name}
                                        size="small"
                                        sx={{ alignSelf: 'flex-start', fontWeight: 600, borderRadius: 1 }}
                                        variant="outlined"
                                        color="primary"
                                    />
                                )}
                                <Stack direction="row" flexWrap="wrap" gap={2} sx={{ color: 'text.secondary', typography: 'body2' }}>
                                    {moduleCount > 0 && (
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <VideoLibraryOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                            <span>
                                                {moduleCount} module{moduleCount === 1 ? '' : 's'}
                                                {totalVideos > 0 ? ` · ${totalVideos} video${totalVideos === 1 ? '' : 's'}` : ''}
                                            </span>
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Box sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                            About this course
                        </Typography>
                        <Box className="tiptap-rendered-content" sx={publicContentSx}>
                            {course.description ? (
                                parse(course.description)
                            ) : (
                                <Typography variant="body1" color="text.secondary">
                                    A full description will appear here when it is added for this program.
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        mt: { xs: 4, md: 5 },
                        p: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'center',
                        maxWidth: 520,
                        mx: 'auto',
                        bgcolor: 'background.paper',
                    }}
                >
                    <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                        Sign in to open the curriculum
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.65, fontSize: '0.95rem' }}>
                        Your modules and lesson videos are available after you log in. This page stays here so you can read the course overview anytime.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        component={RouterLink}
                        to={`/login?redirect=/courses/${courseId}`}
                        sx={{
                            px: 3,
                            py: 1.25,
                            borderRadius: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 2 },
                        }}
                    >
                        Log in to continue
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default CourseDetailPage;
