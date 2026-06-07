import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    CircularProgress,
    Alert,
    Box,
    Button,
    Chip,
    LinearProgress,
    Stack,
    Typography,
    alpha,
} from '@mui/material';
import {
    CourseLearningShell,
    CourseLearningBand,
    CourseLearningTile,
    CourseBottomNav,
    courseLearningTheme,
} from '../components/course';
import { getMyCoursesForUser, type CourseListItemUser } from '../services/courseUserService';
import {
    generateCourseCertificateForMe,
    getCourseCertificateEligibility,
    getMyCourseCertificates,
    type CourseCertificateEligibility,
    type MyCourseCertificate,
} from '../services/courseCertificateService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';
import { extractId } from '../utils/idUtils';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';

const stripHtml = (html: string, maxLen = 120): string =>
    html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);

const MyCoursesPage: React.FC = () => {
    useUserLayoutPage({ title: 'My Courses', variant: 'learning' });
    const [courses, setCourses] = useState<CourseListItemUser[]>([]);
    const [pageContext, setPageContext] = useState<'subscribed' | 'all_courses'>('all_courses');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [eligibilityByCourse, setEligibilityByCourse] = useState<Record<string, CourseCertificateEligibility>>({});
    const [certificateByCourse, setCertificateByCourse] = useState<Record<string, MyCourseCertificate>>({});
    const [generatingForCourse, setGeneratingForCourse] = useState<Record<string, boolean>>({});
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { courses: fetchedCourses, context } = await getMyCoursesForUser();
            const safeCourses = fetchedCourses || [];
            setCourses(safeCourses);
            setPageContext(context);

            if (isAuthenticated && safeCourses.length > 0 && context === 'subscribed') {
                const [myCertificates, eligibilityRows] = await Promise.all([
                    getMyCourseCertificates(),
                    Promise.all(
                        safeCourses.map(async (course) => {
                            const courseId = extractId(course) || course._id;
                            if (!courseId) return null;
                            try {
                                const eligibility = await getCourseCertificateEligibility(courseId);
                                return { courseId, eligibility };
                            } catch {
                                return null;
                            }
                        })
                    ),
                ]);

                const certMap = myCertificates.reduce<Record<string, MyCourseCertificate>>((acc, cert) => {
                    acc[cert.course] = cert;
                    return acc;
                }, {});
                setCertificateByCourse(certMap);

                const eligibilityMap = eligibilityRows.reduce<Record<string, CourseCertificateEligibility>>((acc, row) => {
                    if (row) acc[row.courseId] = row.eligibility;
                    return acc;
                }, {});
                setEligibilityByCourse(eligibilityMap);
            } else {
                setEligibilityByCourse({});
                setCertificateByCourse({});
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load courses.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleGenerateCertificate = async (courseId: string) => {
        setGeneratingForCourse((prev) => ({ ...prev, [courseId]: true }));
        setError(null);
        try {
            const certificate = await generateCourseCertificateForMe(courseId);
            setCertificateByCourse((prev) => ({ ...prev, [courseId]: certificate }));
            const eligibility = await getCourseCertificateEligibility(courseId);
            setEligibilityByCourse((prev) => ({ ...prev, [courseId]: eligibility }));
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to generate certificate.');
        } finally {
            setGeneratingForCourse((prev) => ({ ...prev, [courseId]: false }));
        }
    };

    const handleCardClick = (courseId: string) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/courses/${courseId}` } });
            return;
        }
        navigate(`/courses/${courseId}`);
    };

    const bandSubtitle =
        pageContext === 'subscribed'
            ? 'Your enrolled programs — pick up where you left off.'
            : 'Browse published courses and start learning.';

    const noCoursesMessage =
        pageContext === 'subscribed'
            ? "You haven't subscribed to any courses yet. Explore our courses to get started!"
            : 'No courses are available right now. Please check back soon.';

    const layout = (content: React.ReactNode) => (
        <>
            {content}
            <CourseBottomNav backLabel="Back to Dashboard" backTo="/dashboard" />
        </>
    );

    if (isLoading) {
        return layout(
            <CourseLearningShell>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, gap: 2 }}>
                    <CircularProgress sx={{ color: courseLearningTheme.accent }} />
                    <Typography sx={{ color: courseLearningTheme.textMuted }}>Loading courses…</Typography>
                </Box>
            </CourseLearningShell>
        );
    }

    if (error) {
        return layout(
            <CourseLearningShell maxWidth="md">
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            </CourseLearningShell>
        );
    }

    return layout(
        <CourseLearningShell maxWidth="xl">
            <CourseLearningBand headerLabel="MY COURSES" subtitle={bandSubtitle} ribbon="ULTIMATE">
                {courses.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography sx={{ color: courseLearningTheme.textMuted, mb: 2 }}>{noCoursesMessage}</Typography>
                        {pageContext === 'subscribed' && (
                            <Button
                                component={RouterLink}
                                to="/courses"
                                variant="contained"
                                sx={{
                                    bgcolor: courseLearningTheme.accent,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: courseLearningTheme.accentDark },
                                }}
                            >
                                Explore Courses
                            </Button>
                        )}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: '1fr',
                            },
                            gap: courseLearningTheme.gridGap,
                            alignItems: 'stretch',
                        }}
                    >
                        {courses.map((course) => {
                            const courseId = extractId(course) || course._id;
                            if (!courseId) return null;
                            const eligibility = eligibilityByCourse[courseId];
                            const certificate = certificateByCourse[courseId];
                            const canGenerate = Boolean(eligibility?.isEligible) && !certificate;
                            const examName =
                                typeof course.examCategory === 'object' && course.examCategory !== null
                                    ? course.examCategory.name
                                    : 'General';
                            const imageUrl = course.image
                                ? getImageUrl(course.image, 'course')
                                : getSplashImageUrl();
                            const descShort = course.description
                                ? stripHtml(course.description, 120)
                                : 'Explore this course to unlock your potential.';
                            const descLong = course.description
                                ? stripHtml(course.description, 360)
                                : descShort;

                            const courseMeta =
                                eligibility || course.moduleCount ? (
                                    <Stack direction="row" flexWrap="wrap" sx={{ gap: 1.5 }}>
                                        {eligibility && (
                                            <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted }}>
                                                {eligibility.completedModules} of {eligibility.totalModules} modules completed
                                            </Typography>
                                        )}
                                        {!eligibility && course.moduleCount != null && course.moduleCount > 0 && (
                                            <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted }}>
                                                {course.moduleCount} modules
                                            </Typography>
                                        )}
                                        {eligibility?.assessmentScore != null && (
                                            <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted }}>
                                                Assessment score: {eligibility.assessmentScore}%
                                            </Typography>
                                        )}
                                    </Stack>
                                ) : undefined;

                            const actionButtons = (
                                <Stack
                                    direction={{ xs: 'column', md: 'row' }}
                                    flexWrap="wrap"
                                    sx={{ gap: 1, width: '100%' }}
                                >
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleCardClick(courseId)}
                                        sx={{
                                            display: { xs: 'none', md: 'inline-flex' },
                                            bgcolor: courseLearningTheme.accent,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            flexShrink: 0,
                                            '&:hover': { bgcolor: courseLearningTheme.accentDark },
                                        }}
                                    >
                                        Continue learning
                                    </Button>
                                    {eligibility?.reportCardAvailable && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            component={RouterLink}
                                            to={`/my-courses/${courseId}/report-card`}
                                            sx={{
                                                width: { md: 'auto' },
                                                borderColor: alpha(courseLearningTheme.accent, 0.5),
                                                color: courseLearningTheme.textPrimary,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            View report card
                                        </Button>
                                    )}
                                    {certificate && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            onClick={() =>
                                                window.open(certificate.pdfUrl, '_blank', 'noopener,noreferrer')
                                            }
                                            sx={{
                                                width: { md: 'auto' },
                                                borderColor: alpha(courseLearningTheme.accent, 0.5),
                                                color: courseLearningTheme.textPrimary,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Download certificate
                                        </Button>
                                    )}
                                    {canGenerate && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            fullWidth
                                            disabled={Boolean(generatingForCourse[courseId])}
                                            onClick={() => handleGenerateCertificate(courseId)}
                                            sx={{
                                                width: { md: 'auto' },
                                                bgcolor: courseLearningTheme.accent,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                '&:hover': { bgcolor: courseLearningTheme.accentDark },
                                            }}
                                        >
                                            {generatingForCourse[courseId] ? 'Generating…' : 'Generate certificate'}
                                        </Button>
                                    )}
                                </Stack>
                            );

                            const hasFooterActions =
                                eligibility?.reportCardAvailable ||
                                certificate ||
                                canGenerate;

                            const progressFooter =
                                isAuthenticated && eligibility ? (
                                    <Stack sx={courseLearningTheme.learningColStackSx}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ gap: courseLearningTheme.space.gap }}>
                                            <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted }}>
                                                Completion
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: courseLearningTheme.textPrimary, fontWeight: 700 }}>
                                                {eligibility.completionPercent}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.max(0, Math.min(100, eligibility.completionPercent))}
                                            sx={{
                                                height: 6,
                                                borderRadius: 6,
                                                bgcolor: alpha(courseLearningTheme.accent, 0.2),
                                                '& .MuiLinearProgress-bar': { bgcolor: courseLearningTheme.accent },
                                            }}
                                        />
                                        <Stack direction="row" flexWrap="wrap" sx={{ gap: courseLearningTheme.space.gap, mt: courseLearningTheme.space.sectionMt }}>
                                            <Chip
                                                size="small"
                                                label={eligibility.isEligible ? 'Certificate eligible' : 'In progress'}
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.7rem',
                                                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                                                    color: courseLearningTheme.accent,
                                                }}
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </Stack>
                                ) : undefined;

                            const tileFooter =
                                progressFooter || hasFooterActions ? (
                                    <Stack sx={{ ...courseLearningTheme.learningColStackSx, width: '100%' }}>
                                        {progressFooter}
                                        {hasFooterActions && actionButtons}
                                    </Stack>
                                ) : undefined;

                            return (
                                <Box key={courseId} sx={{ width: '100%' }}>
                                    <CourseLearningTile
                                        variant="card"
                                        title={course.title}
                                        subtitle={`${examName} · ${descShort}`}
                                        subtitleDesktop={`${examName} · ${descLong}`}
                                        imageUrl={imageUrl}
                                        badgeLabel={examName}
                                        meta={courseMeta}
                                        onClick={() => handleCardClick(courseId)}
                                        footer={tileFooter}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </CourseLearningBand>
        </CourseLearningShell>
    );
};

export default MyCoursesPage;
