// File: src/pages/MyCoursesPage.tsx (NEW FILE)

import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Grid, Card, CardActionArea, CardContent, CardMedia,
    CircularProgress, Alert, Box, Button, Paper, Chip, LinearProgress, Stack
} from '@mui/material';
import UserLayout from '../components/layout/UserLayout';
import parse from 'html-react-parser';

// --- Import the new service function ---
import { getMyCoursesForUser, type CourseListItemUser } from '../services/courseUserService';
import {
    generateCourseCertificateForMe,
    getCourseCertificateEligibility,
    getMyCourseCertificates,
    type CourseCertificateEligibility,
    type MyCourseCertificate,
} from '../services/courseCertificateService';
import { useAuth } from '../contexts/AuthContext'; 
import { getImageUrl } from '../utils/imageUtils';
import { extractId } from '../utils/idUtils'; 

const MyCoursesPage: React.FC = () => {
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
            // Call the new service function. It handles auth automatically.
            const { courses: fetchedCourses, context } = await getMyCoursesForUser();
            const safeCourses = fetchedCourses || [];
            setCourses(safeCourses);
            setPageContext(context);

            if (isAuthenticated && safeCourses.length > 0) {
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
    }, []);

    useEffect(() => {
        // We use the isAuthenticated flag to re-fetch data if the user logs in or out.
        fetchCourses();
    }, [fetchCourses, isAuthenticated]);

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
        // If not authenticated, redirect to login, then bring them back.
        if (!isAuthenticated) {
            alert('Please log in or register to view course details.');
            navigate('/login', { state: { from: `/courses/${courseId}` } });
            return;
        }
        navigate(`/courses/${courseId}`);
    };

    const pageTitle = pageContext === 'subscribed' ? 'My Enrolled Courses' : 'Explore All Courses';
    const noCoursesMessage = pageContext === 'subscribed'
        ? "You haven't subscribed to any courses yet. Explore our courses to get started!"
        : "No courses are available right now. Please check back soon.";

    if (isLoading) {
        return (
            <UserLayout title="My Courses">
                <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Container>
            </UserLayout>
        );
    }
    if (error) {
        return (
            <UserLayout title="My Courses">
                <Container sx={{ mt: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Container>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="My Courses">
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
                {pageTitle}
            </Typography>

            {courses.length === 0 ? (
                <Paper sx={{p: 4, textAlign:'center', mt: 4}}>
                    <Typography variant="h6">{noCoursesMessage}</Typography>
                    {pageContext === 'subscribed' && (
                        <Button component={RouterLink} to="/courses" variant="contained" sx={{ mt: 2 }}>
                            Explore Courses
                        </Button>
                    )}
                </Paper>
            ) : (
                <Grid container spacing={4}>
                    {courses.map((course, index) => {
                        const courseId = extractId(course) || course._id;
                        if (!courseId) return null; // Skip if no valid ID
                        const eligibility = eligibilityByCourse[courseId];
                        const certificate = certificateByCourse[courseId];
                        const canGenerate = Boolean(eligibility?.isEligible) && !certificate;
                        
                        return (
                        <Grid key={courseId} sx={{width: {xs: '100%', sm: '50%', md: '33%'}}}>
                             <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', transition: 'all 0.3s', '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' } }}>
                                <CardActionArea
                                    onClick={() => handleCardClick(courseId)}
                                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                >
                                    <CardMedia
                                        component="div"
                                        sx={{
                                            height: 160,
                                            width: '100%',
                                            background: course.image 
                                                ? `url(${getImageUrl(course.image, 'course')})` 
                                                : `linear-gradient(45deg, hsl(${index * 50}, 60%, 85%), hsl(${index * 50 + 35}, 75%, 90%))`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                                            {course.title}
                                        </Typography>
                                         <Typography variant="caption" color="text.secondary" display="block">
                                            {typeof course.examCategory === 'object' && course.examCategory !== null ? course.examCategory.name : 'General'}
                                        </Typography>
                                        <Box
                                            sx={{
                                                mt: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                minHeight: '3.9em',
                                                color: 'text.secondary',
                                                '& p': { typography: 'body2', mb: 0.5, display: 'inline' },
                                                '& ul, & ol': { display: 'none' },
                                                '& strong': { fontWeight: 'bold' },
                                                '& em': { fontStyle: 'italic' },
                                            }}
                                        >
                                            {course.description ? parse(course.description) : 'Explore this course to unlock your potential.'}
                                        </Box>
                                        {isAuthenticated && eligibility && (
                                            <Box sx={{ mt: 1.5 }}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Completion
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {eligibility.completionPercent}%
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={Math.max(0, Math.min(100, eligibility.completionPercent))}
                                                    sx={{ height: 6, borderRadius: 6 }}
                                                />
                                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                                    <Chip
                                                        size="small"
                                                        label={eligibility.isEligible ? 'Eligible for certificate' : 'Not eligible yet'}
                                                        color={eligibility.isEligible ? 'success' : 'default'}
                                                    />
                                                    {eligibility.rule.requireAssessment && (
                                                        <Chip size="small" label="Assessment required" color="warning" />
                                                    )}
                                                </Box>
                                                {!eligibility.isEligible && eligibility.reasons?.[0] && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                                        {eligibility.reasons[0]}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </CardContent>
                                     <Box sx={{ p: 2, pt: 0, width: '100%', mt: 'auto' }}>
                                        <Stack spacing={1}>
                                            <Button variant="contained" fullWidth>
                                                View Course
                                            </Button>
                                            {isAuthenticated && certificate && (
                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(certificate.pdfUrl, '_blank', 'noopener,noreferrer');
                                                    }}
                                                >
                                                    Download Certificate
                                                </Button>
                                            )}
                                            {isAuthenticated && canGenerate && (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    fullWidth
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleGenerateCertificate(courseId);
                                                    }}
                                                    disabled={Boolean(generatingForCourse[courseId])}
                                                >
                                                    {generatingForCourse[courseId] ? 'Generating...' : 'Generate Certificate'}
                                                </Button>
                                            )}
                                        </Stack>
                                    </Box>
                                </CardActionArea>
                            </Card>
                        </Grid>
                        );
                    })}
                </Grid>
            )}
        </Container>
        </UserLayout>
    );
};

export default MyCoursesPage;