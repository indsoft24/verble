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
} from '@mui/material';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import parse from 'html-react-parser';

import { getPublishedCourseWithModulesForUser, type CourseListItemUser, type ModuleListItemUser } from '../services/courseUserService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';

const contentSx = {
    '& p': { typography: 'body1', lineHeight: 1.75, mb: 2, color: 'text.secondary' },
    '& ul, & ol': { pl: 3, mb: 2 },
    '& li': { mb: 0.5, typography: 'body1', lineHeight: 1.75 },
    '& strong': { fontWeight: 700, color: 'text.primary' },
    '& em': { fontStyle: 'italic' },
    '& u': { textDecoration: 'underline' },
    '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
    '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2.5, mb: 1, fontWeight: 700, color: 'text.primary' },
} as const;

const moduleBodySx = {
    '& p': { typography: 'body2', lineHeight: 1.7, mb: 1.5, color: 'text.secondary' },
    '& ul, & ol': { pl: 3, mb: 1.5 },
    '& li': { mb: 0.5, typography: 'body2', lineHeight: 1.7 },
    '& strong': { fontWeight: 700, color: 'text.primary' },
    '& em': { fontStyle: 'italic' },
    '& u': { textDecoration: 'underline' },
    '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
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

    const handleModuleClick = (moduleId: string) => {
        navigate(`/modules/${moduleId}/videos`);
    };

    if (isLoading) {
        return (
            <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress size={28} />
                <Typography color="text.secondary">Loading course…</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 6 }}>
                <Alert severity="error" action={<Button onClick={fetchPageData}>Retry</Button>}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!course) {
        return (
            <Container maxWidth="sm" sx={{ mt: 6 }}>
                <Alert severity="info">This course is not available.</Alert>
            </Container>
        );
    }

    const examSlug = typeof course.examCategory === 'object' ? course.examCategory.slug : '';
    const examName = typeof course.examCategory === 'object' ? course.examCategory.name : 'Category';
    const moduleCount = course.moduleCount ?? modules.length;
    const totalVideos = modules.reduce((sum, m) => sum + (m.videoCount ?? 0), 0);

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: { xs: 6, md: 8 } }}>
            <Container maxWidth="lg" sx={{ pt: { xs: 2, sm: 3 }, pb: 1 }}>
                <Breadcrumbs
                    aria-label="breadcrumb"
                    sx={{
                        mb: 3,
                        '& .MuiBreadcrumbs-separator': { color: 'text.disabled' },
                    }}
                >
                    <MuiLink component={RouterLink} underline="hover" color="text.secondary" to="/" sx={{ fontSize: 14 }}>
                        Home
                    </MuiLink>
                    {examSlug ? (
                        <MuiLink
                            component={RouterLink}
                            underline="hover"
                            color="text.secondary"
                            to={`/exams/${examSlug}`}
                            sx={{ fontSize: 14 }}
                        >
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
                            <Box
                                sx={{
                                    position: 'relative',
                                    height: { xs: 220, sm: 280, md: '100%' },
                                    minHeight: { md: 320 },
                                    bgcolor: 'grey.200',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={course.image ? getImageUrl(course.image, 'course') : getSplashImageUrl()}
                                    alt={course.title}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = getSplashImageUrl();
                                    }}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
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

                    <Box
                        sx={{
                            px: { xs: 3, sm: 4 },
                            py: { xs: 3, sm: 4 },
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'grey.50',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                            About this course
                        </Typography>
                        <Box className="tiptap-rendered-content" sx={contentSx}>
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

                {isAuthenticated ? (
                    <Box sx={{ mt: { xs: 4, md: 5 } }}>
                        <Stack spacing={0.5} sx={{ mb: 2.5 }}>
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                Curriculum
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
                                Expand a module to read what it covers, then open the video list when you are ready to study.
                            </Typography>
                        </Stack>
                        {modules.length === 0 ? (
                            <Paper
                                variant="outlined"
                                sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper' }}
                            >
                                <Typography color="text.secondary">Modules for this course will appear here once they are published.</Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={1.5}>
                                {modules.map((module, index) => (
                                    <Accordion
                                        key={module._id}
                                        defaultExpanded={index === 0}
                                        disableGutters
                                        elevation={0}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: '12px !important',
                                            overflow: 'hidden',
                                            bgcolor: 'background.paper',
                                            '&:before': { display: 'none' },
                                            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                                            sx={{
                                                px: 2,
                                                py: 1.5,
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 1 }}>
                                                <Box
                                                    sx={{
                                                        minWidth: 36,
                                                        height: 36,
                                                        borderRadius: 1,
                                                        bgcolor: 'primary.main',
                                                        color: 'primary.contrastText',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        typography: 'subtitle2',
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    {index + 1}
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                                                        {module.title}
                                                    </Typography>
                                                    {module.videoCount != null && module.videoCount > 0 && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {module.videoCount} video{module.videoCount === 1 ? '' : 's'}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <OndemandVideoIcon sx={{ color: 'action.active', display: { xs: 'none', sm: 'block' } }} />
                                            </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 2, pb: 2, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box className="tiptap-rendered-content" sx={{ ...moduleBodySx, mb: 2, mt: 2 }}>
                                                {module.description ? (
                                                    parse(module.description)
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No outline has been added for this module yet.
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Button
                                                variant="contained"
                                                size="medium"
                                                onClick={() => handleModuleClick(module._id)}
                                                startIcon={<PlayCircleOutlineIcon />}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    px: 2.5,
                                                    boxShadow: 'none',
                                                    '&:hover': { boxShadow: 2 },
                                                }}
                                            >
                                                View videos
                                            </Button>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Stack>
                        )}
                    </Box>
                ) : (
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
                )}
            </Container>
        </Box>
    );
};

export default CourseDetailPage;
