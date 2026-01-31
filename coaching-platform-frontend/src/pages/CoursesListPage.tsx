import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Card, CardActionArea, CardContent,
    CircularProgress, Alert, Box, Paper
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { getAllLawCoursesForUser, type CourseListItemUser } from '../services/courseUserService';
import { useAuth } from '../contexts/AuthContext'; 
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';
import { extractId } from '../utils/idUtils'; 

const CoursesListPage: React.FC = () => {
    const [courses, setCourses] = useState<CourseListItemUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth(); 
    const navigate = useNavigate();

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // LAW-only endpoint
            const fetchedCourses = await getAllLawCoursesForUser();
            setCourses(fetchedCourses || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load courses.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleCardClick = (event: React.MouseEvent, courseId: string) => {
        if (!isAuthenticated) {
            event.preventDefault(); 
            alert('Please log in or register to view course details.');
            navigate('/login', { state: { from: `/courses/${courseId}` } });
        }
    };
    
    if (isLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
    }
    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
                Our Courses
            </Typography>

            {courses.length === 0 && !isLoading && (
                <Paper sx={{p:3, textAlign:'center'}}><Typography>No courses are available right now.</Typography></Paper>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', sm: 'flex-start', md: 'flex-start' },
                    gap: { xs: 2, sm: 3, md: '15px' },
                    width: '100%',
                    marginLeft: { xs: 0, sm: 0, md: '0px' },
                    marginRight: { xs: 0, sm: 0, md: '0px' },
                    paddingLeft: { xs: 0, sm: 0, md: '0px' },
                    paddingRight: { xs: 0, sm: 0, md: '0px' }
                }}
            >
                {courses.map((course) => {
                    const courseId = extractId(course) || course._id;
                    if (!courseId) return null; // Skip if no valid ID
                    
                    // Course card rendering logic
                    // Handle both course.image and check if it's a valid URL
                    let courseImageUrl: string;
                    if (course.image && course.image.trim() !== '') {
                        courseImageUrl = getImageUrl(course.image, 'course');
                    } else {
                        courseImageUrl = getSplashImageUrl();
                    }
                    
                    return (
                    <Card 
                        key={courseId}
                        sx={{ 
                            width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 10px)' },
                            maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: '400px' },
                            minWidth: { xs: '100%', sm: '280px', md: '320px' },
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            borderRadius: '12px', 
                            transition: 'all 0.3s', 
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #d3f4f8 0%, #e0f8ff 100%)',
                            border: '1px solid rgba(25, 118, 210, 0.12)',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                            '&:hover': { 
                                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.15)', 
                                transform: 'translateY(-4px)',
                                borderColor: 'rgba(25, 118, 210, 0.2)',
                                background: 'linear-gradient(135deg, #e3f2fd 0%, #e8f4f8 100%)'
                            } 
                        }}
                    >
                            <CardActionArea
                                component={RouterLink}
                                to={`/courses/${courseId}`}
                                onClick={(e) => handleCardClick(e, courseId)}
                                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                            >
                                <Box sx={{ 
                                    width: '100%', 
                                    height: 160, 
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    backgroundColor: '#f5f5f5',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img
                                        src={courseImageUrl}
                                        alt={course.title || 'Course image'}
                                        loading="eager"
                                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                            const target = e.target as HTMLImageElement;
                                            const splashUrl = getSplashImageUrl();
                                            // Only set splash if not already set to prevent infinite loop
                                            if (!target.src.includes('verble-logo') && !target.src.includes('splash') && target.src !== splashUrl) {
                                                target.src = splashUrl;
                                                target.style.opacity = '1';
                                            }
                                        }}
                                        onLoad={(e) => {
                                            // Image loaded successfully
                                            const target = e.target as HTMLImageElement;
                                            target.style.opacity = '1';
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                            opacity: courseImageUrl === getSplashImageUrl() ? '1' : '0',
                                            transition: 'opacity 0.3s ease-in-out'
                                        }}
                                    />
                                </Box>
                                <CardContent sx={{ 
                                    flexGrow: 1, 
                                    width: '100%',
                                    minHeight: 0,
                                    backgroundColor: 'transparent',
                                    '&:last-child': { pb: 2 }
                                }}>
                                    <Typography 
                                        variant="h6" 
                                        component="h2" 
                                        sx={{ 
                                            fontWeight: 600, 
                                            mb: 1,
                                            fontSize: { xs: '1rem', sm: '1.1rem' },
                                            lineHeight: 1.3,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            minHeight: '2.6em'
                                        }}
                                    >
                                        {course.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            minHeight: '3.6em',
                                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                            lineHeight: 1.4
                                        }}
                                    >
                                        {course.description
                                            ? course.description.replace(/<[^>]+>/g, '').trim() || 'Explore this course to unlock your potential.'
                                            : 'Explore this course to unlock your potential.'}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ 
                                    p: 2, 
                                    pt: 1, 
                                    width: '100%', 
                                    mt: 'auto', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}>
                                    <Typography variant="caption" color="text.secondary">
                                    </Typography>
                                    {!isAuthenticated && (
                                        <LockIcon fontSize="small" color="action" />
                                    )}
                                </Box>
                            </CardActionArea>
                        </Card>
                    );
                })}
            </Box>
        </Container>
    );
};

export default CoursesListPage;
